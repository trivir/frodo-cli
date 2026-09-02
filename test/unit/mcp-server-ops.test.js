/**
 * Unit tests for the MCP HTTP transport layer (McpServerOps.ts): signal
 * handling, EADDRINUSE ergonomics, Host allow-list computation, the bearer
 * auth helper, and the era-conditional request-metadata gate.
 *
 * Mocking mirrors ThemeConfig.test.js: the real import graph pulls in all of
 * frodo-lib (whose bundled ESM cannot load under jest's ESM runtime), so a
 * minimal frodo-lib surface plus Console/Version are mocked BEFORE the
 * dynamic import of the module under test. The MCP SDK packages are NOT
 * mocked — the SDK is exactly what the transport wraps, so exercising the
 * real one keeps the era gate honest against real SDK semantics.
 */
import http from 'node:http';
import net from 'node:net';
import childProcess from 'node:child_process';
import fsPromise from 'node:fs';
import osPromise from 'node:os';
import pathPromise from 'node:path';
import { jest } from '@jest/globals';

// ESM tests have no `require`; alias the pieces the tests need.
const { request: httpRequest } = http;
// The launcher test below needs fs/os/path; `path` is also used by the
// resolveMcpAuthTokenValue import at line ~330 in its own scope.

jest.unstable_mockModule('@rockcarver/frodo-lib', () => ({
  getRealmFromContext: () => undefined,
  resolveRequestScopedFrodo: async (_context, frodoSingleton) => frodoSingleton,
  state: {
    getHost: () => undefined,
    getRealm: () => undefined,
    getServiceAccountId: () => undefined,
    getServiceAccountJwk: () => undefined,
    getUsername: () => undefined,
    getPassword: () => undefined,
    getDeploymentType: () => undefined,
    getAllowInsecureConnection: () => false,
    getDebug: () => false,
    getCurlirize: () => false,
    getState: () => ({}),
  },
}));

const printed = [];
jest.unstable_mockModule('../../src/utils/Console', () => ({
  printMessage: (msg, type) => {
    printed.push({ msg: String(msg), type });
  },
}));

jest.unstable_mockModule('../../src/utils/Version', () => ({
  getCliBuildTimestamp: () => 'test-build',
}));

const {
  computeHttpAllowedHosts,
  isLoopbackBindHost,
  registerServerCrashHandlers,
  startHttpTransport,
  validateHttpRequestMetadata,
  verifyMcpBearerAuthorization,
} = await import('../../src/ops/McpServerOps.ts');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Binds an ephemeral port, reads it back, and releases it. */
function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

/**
 * Starts the transport and resolves once the listener accepts connections.
 *
 * Returns the transport's shutdown promise itself (NOT an async wrapper):
 * awaiting an `async` helper here would adopt the shutdown promise and block
 * the test until the server stops, instead of handing it back for the
 * afterEach cleanup to resolve.
 */
function startServer(bindHost, port, options) {
  return startHttpTransport(
    { listTools: () => [] },
    bindHost,
    port,
    undefined,
    options
  );
}

/** Polls until the port accepts connections (or the deadline passes). */
function waitForListening(bindHost, port, deadlineMs = 5000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tryConnect = () => {
      const socket = net.connect(port, bindHost);
      socket.once('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() > started + deadlineMs) {
          reject(
            new Error(
              `server on ${bindHost}:${port} never accepted a connection`
            )
          );
        } else {
          setTimeout(tryConnect, 25);
        }
      });
    };
    tryConnect();
  });
}

/** A raw node:http request, bypassing fetch's normalizations. */
function rawRequest(port, method, path, headers, body) {
  return new Promise((resolve, reject) => {
    const req = httpRequest(
      { host: '127.0.0.1', port, method, path, headers: headers ?? {} },
      (res) => {
        const chunks = [];
        // SSE responses never end; resolve on first data so tests can read
        // the priming event and move on. Regular responses resolve on 'end'.
        let settled = false;
        const settle = () => {
          if (settled) return;
          settled = true;
          req.destroy();
          resolve({
            status: res.statusCode,
            headers: res.headers,
            text: Buffer.concat(chunks).toString('utf8'),
          });
        };
        res.on('data', (chunk) => {
          chunks.push(chunk);
          if (
            String(res.headers['content-type']).includes('text/event-stream')
          ) {
            settle();
          }
        });
        res.once('end', settle);
      }
    );
    // Reject on real request errors, but tolerate the ECONNRESET/socket hang
    // up that destroying the socket after a settled response produces.
    req.on('error', (err) => {
      if (settled) return;
      if (!String(err).includes('socket hang up')) {
        reject(err);
      }
    });
    if (body !== undefined) {
      req.end(body);
    } else {
      req.end();
    }
  });
}

/** A JSON-RPC POST body shaped like a 2025-era initialize handshake. */
function legacyInitializeBody(version = '2025-06-18') {
  return JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: { protocolVersion: version, capabilities: {}, clientInfo: { name: 't', version: '1' } },
  });
}

const JSON_HEADERS = {
  'content-type': 'application/json',
  // Streamable HTTP requires both accept types on POST /mcp.
  accept: 'application/json, text/event-stream',
};

// The 2026-07-28 envelope keys (SDK parity) and the modern revision, used by
// both the metadata-gate suite and the HTTP integration cells.
const META = 'io.modelcontextprotocol/protocolVersion';
const CAPS = 'io.modelcontextprotocol/clientCapabilities';
const PV = '2026-07-28';

// ---------------------------------------------------------------------------
// Host allow-list computation
// ---------------------------------------------------------------------------

describe('computeHttpAllowedHosts', () => {
  test('defaults to the localhost set on a loopback bind', () => {
    expect(computeHttpAllowedHosts('127.0.0.1')).toEqual([
      'localhost',
      '127.0.0.1',
      '[::1]',
    ]);
    expect(computeHttpAllowedHosts('localhost')).toEqual([
      'localhost',
      '127.0.0.1',
      '[::1]',
    ]);
    expect(computeHttpAllowedHosts('::1')).toEqual([
      'localhost',
      '127.0.0.1',
      '[::1]',
    ]);
  });

  test('extends the localhost set with the provided hosts', () => {
    expect(computeHttpAllowedHosts('127.0.0.1', ['gateway.internal'])).toEqual([
      'localhost',
      '127.0.0.1',
      '[::1]',
      'gateway.internal',
    ]);
  });

  test('auto-includes host.docker.internal on a non-loopback bind', () => {
    const hosts = computeHttpAllowedHosts('0.0.0.0', ['gateway.internal']);
    expect(hosts).toContain('host.docker.internal');
    expect(hosts).toContain('gateway.internal');
    expect(hosts).toContain('localhost');
  });

  test('does not duplicate host.docker.internal when provided explicitly', () => {
    const hosts = computeHttpAllowedHosts('0.0.0.0', ['host.docker.internal']);
    expect(hosts.filter((h) => h === 'host.docker.internal')).toHaveLength(1);
  });

  test('ignores empty entries', () => {
    expect(computeHttpAllowedHosts('127.0.0.1', ['', 'x'])).toEqual([
      'localhost',
      '127.0.0.1',
      '[::1]',
      'x',
    ]);
  });
});

// ---------------------------------------------------------------------------
// Loopback bind-host classification
// ---------------------------------------------------------------------------

describe('isLoopbackBindHost', () => {
  test('classifies loopback addresses and names', () => {
    expect(isLoopbackBindHost('127.0.0.1')).toBe(true);
    expect(isLoopbackBindHost('127.9.9.9')).toBe(true);
    expect(isLoopbackBindHost('localhost')).toBe(true);
    expect(isLoopbackBindHost('LOCALHOST')).toBe(true);
    expect(isLoopbackBindHost('::1')).toBe(true);
    expect(isLoopbackBindHost('[::1]')).toBe(true);
  });

  test('classifies non-loopback binds as exposed', () => {
    expect(isLoopbackBindHost('0.0.0.0')).toBe(false);
    expect(isLoopbackBindHost('192.168.1.10')).toBe(false);
    expect(isLoopbackBindHost('host.example.com')).toBe(false);
    expect(isLoopbackBindHost('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Bearer-token verification
// ---------------------------------------------------------------------------

describe('verifyMcpBearerAuthorization', () => {
  test('accepts the exact token in a Bearer header', () => {
    expect(verifyMcpBearerAuthorization('Bearer testsecret', 'testsecret')).toBe(true);
  });

  test('is case-insensitive on the scheme and tolerates extra whitespace', () => {
    expect(verifyMcpBearerAuthorization('bearer  testsecret', 'testsecret')).toBe(true);
    expect(verifyMcpBearerAuthorization(' BEARER\ttestsecret ', 'testsecret')).toBe(true);
  });

  test('rejects a wrong token', () => {
    expect(verifyMcpBearerAuthorization('Bearer wrong', 'testsecret')).toBe(false);
  });

  test('rejects missing/malformed headers without throwing', () => {
    expect(verifyMcpBearerAuthorization(undefined, 'testsecret')).toBe(false);
    expect(verifyMcpBearerAuthorization('', 'testsecret')).toBe(false);
    expect(verifyMcpBearerAuthorization('Bearer', 'testsecret')).toBe(false);
    expect(verifyMcpBearerAuthorization('Bearer ', 'testsecret')).toBe(false);
    expect(verifyMcpBearerAuthorization('Basic dXNlcjpwYXNz', 'testsecret')).toBe(false);
  });

  test('rejects when no token is configured', () => {
    expect(verifyMcpBearerAuthorization('Bearer testsecret', '')).toBe(false);
    expect(verifyMcpBearerAuthorization('Bearer testsecret', undefined)).toBe(false);
  });

  test('does not leak the token via prefix matching', () => {
    // A prefix of the real token must not authenticate.
    expect(verifyMcpBearerAuthorization('Bearer testsecre', 'testsecret')).toBe(false);
    // A longer string sharing the prefix must not authenticate either.
    expect(verifyMcpBearerAuthorization('Bearer testsecret-extra', 'testsecret')).toBe(false);
  });

  test('rejects the duplicate-header folding shape (first value wins in node:http)', () => {
    // node:http folds repeated Authorization headers into a single
    // comma-joined header value — except `authorization`, which is on
    // node's single-value header list, so the SERVER sees only the FIRST
    // value (verified against a live node:http server). The joined form
    // below is therefore only reachable at this helper's own boundary (a
    // reverse proxy that joins duplicates before forwarding); asserting it
    // documents the failure mode: whatever reaches the timing-safe compare
    // must match the token exactly, and a folded string never does.
    expect(
      verifyMcpBearerAuthorization('Bearer testsecret, Bearer other', 'testsecret')
    ).toBe(false);
    expect(
      verifyMcpBearerAuthorization('Bearer testsecret, Bearer testsecret', 'testsecret')
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Bearer-token resolution (CLI flag / env fallback)
// ---------------------------------------------------------------------------

describe('resolveMcpAuthTokenValue', () => {
  const ENV_NAME = 'FRODO_MCP_AUTH_TOKEN';
  let savedEnv;
  let resolveMcpAuthTokenValue;

  beforeAll(async () => {
    // server-auth.ts is dependency-free, so this import needs no mocks.
    ({ resolveMcpAuthTokenValue } = await import(
      '../../src/cli/mcp/server/server-auth.ts'
    ));
  });

  beforeEach(() => {
    savedEnv = process.env[ENV_NAME];
    delete process.env[ENV_NAME];
  });

  afterEach(() => {
    if (savedEnv === undefined) {
      delete process.env[ENV_NAME];
    } else {
      process.env[ENV_NAME] = savedEnv;
    }
  });

  test('prefers the flag over the environment variable', () => {
    process.env[ENV_NAME] = 'env-token';
    expect(resolveMcpAuthTokenValue('flag-token', process.env[ENV_NAME])).toBe('flag-token');
  });

  test('falls back to the environment variable', () => {
    process.env[ENV_NAME] = 'env-token';
    expect(resolveMcpAuthTokenValue(undefined, process.env[ENV_NAME])).toBe('env-token');
  });

  test('treats an empty string as unset (flag and env)', () => {
    // An empty bearer token would be enforceable yet trivially guessable;
    // resolution must yield undefined so the startup refusal for non-loopback
    // binds and the "no token configured" path both see it as absent rather
    // than enforcing a zero-length secret.
    expect(resolveMcpAuthTokenValue('', undefined)).toBeUndefined();
    expect(resolveMcpAuthTokenValue(undefined, '')).toBeUndefined();
    // An empty flag does not shadow a set env var (falsy, so env is read).
    expect(resolveMcpAuthTokenValue('', 'env-token')).toBe('env-token');
  });
});

// ---------------------------------------------------------------------------
// Era-conditional request-metadata gate
// ---------------------------------------------------------------------------

describe('validateHttpRequestMetadata', () => {
  const META_KEY = META;
  const CAPS_KEY = CAPS;

  function fakeReq(headers = {}) {
    return { headers };
  }

  function legacyInitialize(version = '2025-06-18') {
    return {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: version, capabilities: {}, clientInfo: {} },
    };
  }

  function legacyToolsList() {
    return { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} };
  }

  function modernRequest() {
    return {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'frodo_discover',
        arguments: {},
        _meta: {
          [META_KEY]: '2026-07-28',
          [CAPS_KEY]: {},
        },
      },
    };
  }

  test('passes a 2025-era initialize with no modern headers (the gateway incident)', () => {
    expect(validateHttpRequestMetadata(fakeReq(), legacyInitialize())).toBeNull();
  });

  test('passes a 2025-era tools/list with no modern headers', () => {
    expect(validateHttpRequestMetadata(fakeReq(), legacyToolsList())).toBeNull();
  });

  test('passes a legacy request carrying a pre-2026 MCP-Protocol-Version header', () => {
    expect(
      validateHttpRequestMetadata(
        fakeReq({ 'mcp-protocol-version': '2025-06-18' }),
        legacyToolsList()
      )
    ).toBeNull();
  });

  test('ignores stray Mcp-Method/Mcp-Name headers on legacy requests', () => {
    expect(
      validateHttpRequestMetadata(
        fakeReq({ 'mcp-method': 'tools/list', 'mcp-name': 'whatever' }),
        legacyToolsList()
      )
    ).toBeNull();
  });

  test('rejects a modern header naming a different version than the initialize handshake', () => {
    // initialize + modern header is a cross-check mismatch (SDK parity),
    // regardless of the initialize version.
    const err = validateHttpRequestMetadata(
      fakeReq({ 'mcp-protocol-version': '2026-07-28' }),
      legacyInitialize('2025-06-18')
    );
    expect(err.error.code).toBe(-32020);
    expect(err.statusCode).toBe(400);
  });

  test('rejects a modern header on a claim-less request with -32602', () => {
    const err = validateHttpRequestMetadata(
      fakeReq({ 'mcp-protocol-version': '2026-07-28' }),
      legacyToolsList()
    );
    expect(err.error.code).toBe(-32602);
    expect(err.error.message).toContain('missing the required per-request envelope key');
    expect(err.error.data).toEqual({ envelope: { missing: ['_meta'] } });
  });

  test('rejects a modern header with a _meta envelope missing the claim key', () => {
    // SDK parity (verified live against classifyInboundRequest): a claim-less
    // `_meta` under a modern header names EVERY absent required envelope key
    // (claim key first, then capabilities) — not just the claim key.
    const body = {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/list',
      params: { _meta: { traceparent: 'x' } },
    };
    const err = validateHttpRequestMetadata(
      fakeReq({ 'mcp-protocol-version': '2026-07-28' }),
      body
    );
    expect(err.error.code).toBe(-32602);
    expect(err.error.data).toEqual({
      envelope: {
        missing: [
          'io.modelcontextprotocol/protocolVersion',
          'io.modelcontextprotocol/clientCapabilities',
        ],
      },
    });
  });

  test('passes a fully-formed modern request', () => {
    const err = validateHttpRequestMetadata(
      fakeReq({
        'mcp-protocol-version': '2026-07-28',
        'mcp-method': 'tools/call',
        'mcp-name': 'frodo_discover',
      }),
      modernRequest()
    );
    expect(err).toBeNull();
  });

  test('enforces the full modern check set on modern requests', () => {
    const body = modernRequest();
    // Missing protocol-version header
    expect(
      validateHttpRequestMetadata(fakeReq({ 'mcp-method': 'tools/call', 'mcp-name': 'frodo_discover' }), body)
        .error.code
    ).toBe(-32020);
    // Missing method header
    expect(
      validateHttpRequestMetadata(
        fakeReq({ 'mcp-protocol-version': '2026-07-28', 'mcp-name': 'frodo_discover' }),
        body
      ).error.code
    ).toBe(-32020);
    // Method header disagrees with body
    expect(
      validateHttpRequestMetadata(
        fakeReq({
          'mcp-protocol-version': '2026-07-28',
          'mcp-method': 'tools/list',
          'mcp-name': 'frodo_discover',
        }),
        body
      ).error.code
    ).toBe(-32020);
    // Missing name header
    expect(
      validateHttpRequestMetadata(
        fakeReq({ 'mcp-protocol-version': '2026-07-28', 'mcp-method': 'tools/call' }),
        body
      ).error.code
    ).toBe(-32020);
    // Name header disagrees with body
    expect(
      validateHttpRequestMetadata(
        fakeReq({
          'mcp-protocol-version': '2026-07-28',
          'mcp-method': 'tools/call',
          'mcp-name': 'other',
        }),
        body
      ).error.code
    ).toBe(-32020);
  });

  test('mirrors params.uri for resources/read under modern rules', () => {
    const body = {
      jsonrpc: '2.0',
      id: 5,
      method: 'resources/read',
      params: {
        uri: 'file:///x',
        _meta: { [META_KEY]: '2026-07-28', [CAPS_KEY]: {} },
      },
    };
    expect(
      validateHttpRequestMetadata(
        fakeReq({
          'mcp-protocol-version': '2026-07-28',
          'mcp-method': 'resources/read',
          'mcp-name': 'file:///x',
        }),
        body
      )
    ).toBeNull();
    // name-based value does not satisfy uri-mirroring
    expect(
      validateHttpRequestMetadata(
        fakeReq({
          'mcp-protocol-version': '2026-07-28',
          'mcp-method': 'resources/read',
          'mcp-name': 'file:///y',
        }),
        body
      ).error.code
    ).toBe(-32020);
  });

  test('passes a modern request without Mcp-Name for methods with no name source', () => {
    const body = {
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/list',
      params: {
        _meta: { [META_KEY]: '2026-07-28', [CAPS_KEY]: {} },
      },
    };
    expect(
      validateHttpRequestMetadata(
        fakeReq({ 'mcp-protocol-version': '2026-07-28', 'mcp-method': 'tools/list' }),
        body
      )
    ).toBeNull();
  });

  test('accepts a claim-less notification POST with a modern header, cross-checking method', () => {
    const body = { jsonrpc: '2.0', method: 'notifications/initialized' };
    expect(
      validateHttpRequestMetadata(
        fakeReq({ 'mcp-protocol-version': '2026-07-28' }),
        body
      )
    ).toBeNull();
    expect(
      validateHttpRequestMetadata(
        fakeReq({
          'mcp-protocol-version': '2026-07-28',
          'mcp-method': 'tools/list',
        }),
        body
      ).error.code
    ).toBe(-32020);
  });

  test('rejects a legacy (pre-2026) envelope claim missing clientCapabilities (full-envelope parity)', () => {
    // Option-(b) scope landed: the SDK's validateEnvelopeMeta requires the
    // client-capabilities key on EVERY claimed request, whatever revision the
    // claim names (verified live: a '2025-06-18' claim without caps answers
    // envelope-invalid, not legacy acceptance).
    const body = {
      jsonrpc: '2.0',
      id: 7,
      method: 'tools/list',
      params: { _meta: { [META_KEY]: '2025-06-18' } },
    };
    const err = validateHttpRequestMetadata(fakeReq(), body);
    expect(err.error.code).toBe(-32602);
    expect(err.error.message).toBe(
      `Invalid _meta envelope for protocol revision 2026-07-28: ${CAPS_KEY}: missing`
    );
    expect(err.error.data).toEqual({
      envelope: { key: CAPS_KEY, problem: 'missing' },
    });
  });

  test('passes a string non-modern claim WITH clientCapabilities (the LiteLLM shape, SDK-verified)', () => {
    // A claim naming a pre-2026 revision plus a present (object) capabilities
    // key passes the SDK's full envelope validation and classifies
    // legacy-era traffic — accepted without modern headers.
    const body = {
      jsonrpc: '2.0',
      id: 8,
      method: 'tools/call',
      params: {
        name: 'frodo_discover',
        _meta: { [META_KEY]: '2025-11-25', [CAPS_KEY]: {} },
      },
    };
    expect(validateHttpRequestMetadata(fakeReq(), body)).toBeNull();
  });

  test.each([
    [12345, 'number'],
    [{ nested: true }, 'object'],
    [null, 'null'],
    [true, 'boolean'],
    [['2026-07-28'], 'array'],
  ])(
    'rejects a present-but-non-string envelope claim (%p) with the SDK envelope-invalid shape',
    (claimValue, receivedType) => {
      // Before the malformed-claim fix, this body silently downgraded to
      // legacy handling: hasClaim=true but version=undefined made
      // isModernProtocolVersion(undefined) false, skipping every modern
      // cross-check. SDK parity: envelope-invalid, 400 -32602.
      const body = {
        jsonrpc: '2.0',
        id: 9,
        method: 'tools/call',
        params: { name: 'x', _meta: { [META_KEY]: claimValue } },
      };
      const err = validateHttpRequestMetadata(fakeReq(), body);
      expect(err.error.code).toBe(-32602);
      expect(err.statusCode).toBe(400);
      expect(err.error.message).toBe(
        `Invalid _meta envelope for protocol revision 2026-07-28: ${META_KEY}: Invalid input: expected string, received ${receivedType}`
      );
      expect(err.error.data).toEqual({
        envelope: {
          key: META_KEY,
          problem: `Invalid input: expected string, received ${receivedType}`,
        },
      });
    }
  );

  test('rejects a malformed claim on a notification (notification-envelope-invalid parity)', () => {
    const body = {
      jsonrpc: '2.0',
      method: 'notifications/initialized',
      params: { _meta: { [META_KEY]: { nested: 1 } } },
    };
    const err = validateHttpRequestMetadata(fakeReq(), body);
    expect(err.error.code).toBe(-32602);
    expect(err.error.message).toBe(
      `Invalid _meta envelope for protocol revision 2026-07-28: ${META_KEY}: Invalid input: expected string, received object`
    );
  });

  test('still legacy-accepts an initialize with a malformed claim and no modern header (SDK precedence)', () => {
    // The SDK's initialize precedence rule checks a VALID modern envelope
    // claim; a malformed claim keeps the legacy-handshake classification
    // (verified against classifyInboundRequest) — frodo must not start
    // rejecting legacy-era initialize traffic over a stray _meta key.
    const body = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2025-06-18', _meta: { [META_KEY]: 12345 } },
    };
    expect(validateHttpRequestMetadata(fakeReq(), body)).toBeNull();
  });

  test('still rejects an initialize with a malformed claim and a modern header (-32020 precedence)', () => {
    // initialize-with-modern-header is the first rejection on the SDK's
    // ladder for this shape — the malformed claim never gets to win.
    const body = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2025-06-18', _meta: { [META_KEY]: 12345 } },
    };
    const err = validateHttpRequestMetadata(
      fakeReq({ 'mcp-protocol-version': '2026-07-28' }),
      body
    );
    expect(err.error.code).toBe(-32020);
  });

  test('rejects a malformed claim even when a modern header would otherwise pair with it', () => {
    // The regression cell from review: a modern header + non-string claim
    // must not skip the modern checks, and the claim's own malformedness is
    // the error that fires.
    const body = {
      jsonrpc: '2.0',
      id: 10,
      method: 'tools/call',
      params: { name: 'x', _meta: { [META_KEY]: 12345 } },
    };
    const err = validateHttpRequestMetadata(
      fakeReq({ 'mcp-protocol-version': '2026-07-28' }),
      body
    );
    expect(err.error.code).toBe(-32602);
    expect(err.error.message).toContain('Invalid input: expected string, received number');
  });

  test.each([
    ['a string _meta', 'not-an-object'],
    ['a null _meta', null],
    ['an array _meta', ['2026-07-28']],
    ['a number _meta', 7],
  ])(
    'treats params._meta that is %s as claim-less (no false -32602, no false -32020)',
    (_label, metaValue) => {
      // getRequestParams guards _meta to a plain object; a non-object _meta
      // carries no envelope claim at all, so with no modern header this is
      // legacy traffic — never the malformed-claim rejection (the claim key
      // is not even reachable inside a non-object _meta). (The SDK's own
      // body schema rejects these shapes outright as invalid JSON-RPC; frodo
      // forwards them to the transport per the P1 body-shape decision, so
      // the metadata gate itself stays claim-less-silent here.)
      const body = {
        jsonrpc: '2.0',
        id: 11,
        method: 'tools/call',
        params: { name: 'x', _meta: metaValue },
      };
      expect(validateHttpRequestMetadata(fakeReq(), body)).toBeNull();
      // And with a modern header it is the modern-header-without-claim
      // cell (-32602), not a malformed-claim error. A non-object _meta is
      // not an envelope at all, so the missing list is ['_meta'] (SDK
      // parity: meta === undefined => missing = ['_meta']).
      const withHeader = validateHttpRequestMetadata(
        fakeReq({ 'mcp-protocol-version': '2026-07-28' }),
        body
      );
      expect(withHeader.error.code).toBe(-32602);
      expect(withHeader.error.data).toEqual({
        envelope: { missing: ['_meta'] },
      });
    }
  );
});

// ---------------------------------------------------------------------------
// Server-mode crash handlers (scoped to the MCP server start path)
// ---------------------------------------------------------------------------

describe('registerServerCrashHandlers', () => {
  // Registrations are guarded by process.listenerCount(name) === 0, so these
  // tests assert the guard, the dispose contract, and the log-and-continue
  // semantics. The uncaughtException exit(1) path cannot run inside the jest
  // worker (it would kill the suite); the dist smoke test exercises it
  // against a spawned child process instead.
  let savedExitCode;

  beforeEach(() => {
    savedExitCode = process.exitCode;
  });

  afterEach(() => {
    process.exitCode = savedExitCode;
  });

  test('registers exactly one handler of each kind when none exist', () => {
    const beforeException = process.listenerCount('uncaughtException');
    const beforeRejection = process.listenerCount('unhandledRejection');
    const dispose = registerServerCrashHandlers();
    if (beforeException === 0) {
      expect(process.listenerCount('uncaughtException')).toBe(1);
    } else {
      // Guard parity: an existing handler (FrodoCommand's, or another
      // transport's) suppresses the scoped registration entirely.
      expect(process.listenerCount('uncaughtException')).toBe(beforeException);
    }
    if (beforeRejection === 0) {
      expect(process.listenerCount('unhandledRejection')).toBe(1);
    } else {
      expect(process.listenerCount('unhandledRejection')).toBe(beforeRejection);
    }
    dispose();
  });

  test('dispose removes exactly the handlers it added (re-start re-registers cleanly)', () => {
    const beforeException = process.listenerCount('uncaughtException');
    const beforeRejection = process.listenerCount('unhandledRejection');
    const dispose = registerServerCrashHandlers();
    dispose();
    expect(process.listenerCount('uncaughtException')).toBe(beforeException);
    expect(process.listenerCount('unhandledRejection')).toBe(beforeRejection);
    // Idempotent dispose.
    dispose();
    expect(process.listenerCount('uncaughtException')).toBe(beforeException);
  });

  test('skips registration when a handler already exists (FrodoCommand guard parity)', () => {
    const fake = () => {};
    process.on('unhandledRejection', fake);
    const countBefore = process.listenerCount('unhandledRejection');
    const dispose = registerServerCrashHandlers();
    expect(process.listenerCount('unhandledRejection')).toBe(countBefore);
    process.off('unhandledRejection', fake);
    dispose();
  });

  test('an unhandledRejection is logged and does not poison the exit code', () => {
    // Log-and-continue is the locked semantics: a rejected promise somewhere
    // in a tool call must not tear down a healthy server, and must not make
    // a live listener report itself failed. The crash line goes through the
    // captured printMessage (no startupInfo in unit tests).
    const exitCodeBefore = process.exitCode;
    const dispose = registerServerCrashHandlers();
    try {
      // Notify the handler without invoking other listeners' rejections:
      // process.emit dispatches to all registered handlers, including any
      // from previously started transports in this worker — all of them are
      // log-only by contract, so the emit is safe.
      process.emit('unhandledRejection', new Error('probe-rejection'));
      expect(process.exitCode).not.toBe(1);
      const crashLines = printed.filter(
        (p) => p.type === 'error' && p.msg.includes('unhandledRejection')
      );
      expect(crashLines.length).toBeGreaterThanOrEqual(1);
      expect(crashLines.some((p) => p.msg.includes('probe-rejection'))).toBe(true);
      // Crash lines are timestamped and carry the first stack frame.
      expect(crashLines[0].msg).toMatch(/\d{4}-\d{2}-\d{2}T/);
      expect(crashLines[0].msg).toContain('(at ');
    } finally {
      process.exitCode = exitCodeBefore;
      dispose();
    }
  });

  test('the crash line carries name, message, and first stack frame', () => {
    const dispose = registerServerCrashHandlers();
    printed.length = 0;
    process.emit('unhandledRejection', new TypeError('typed-probe'));
    const line = printed.find((p) => p.msg.includes('typed-probe'));
    expect(line.msg).toContain('TypeError: typed-probe');
    expect(line.msg).toMatch(/\(at .+/);
    dispose();
  });
});

// ---------------------------------------------------------------------------
// HTTP integration through the real listener
// ---------------------------------------------------------------------------

describe('startHttpTransport', () => {
  beforeEach(() => {
    printed.length = 0;
  });

  afterEach(async () => {
    // Release any listener this test started and restore default signal
    // disposition for subsequent tests.
    await shutdownTransport();
  });

  let currentDone = null;
  async function shutdownTransport() {
    if (currentDone) {
      const done = currentDone;
      currentDone = null;
      // process.emit, not process.kill: jest replaces the worker's process
      // object, so real OS signals never reach handlers registered in tests
      // (the worker just dies). Emitting dispatches to the registered
      // handlers synchronously, exactly what the shutdown closure needs.
      process.emit('SIGTERM', 'SIGTERM');
      await done;
    }
  }

  // Debug-level gate logging is emitted through printMessage(msg, 'debug')
  // in the unit setup (no startupInfo). The McpLogger maps winston 'debug'
  // to stderr as "[frodo-mcp] debug: http: <message>" — here the Console
  // mock records { msg, type }, so debug lines are the 'debug'-typed entries.
  function debugLines() {
    return printed.filter((p) => p.type === 'debug');
  }

  test('serves /health unauthenticated and stateless', async () => {
    const port = await getFreePort();
    currentDone = startServer('127.0.0.1', port, { authToken: 'tok123' });
    await waitForListening('127.0.0.1', port);
    const res = await rawRequest(port, 'GET', '/health');
    expect(res.status).toBe(200);
    expect(JSON.parse(res.text)).toEqual({ status: 'ok' });
  });

  test('enforces the bearer token on /mcp and never on /health', async () => {
    const port = await getFreePort();
    const body = legacyInitializeBody();
    currentDone = startServer('127.0.0.1', port, { authToken: 'tok123' });
    await waitForListening('127.0.0.1', port);

    const missing = await rawRequest(port, 'POST', '/mcp', JSON_HEADERS, body);
    expect(missing.status).toBe(401);
    expect(missing.headers['www-authenticate']).toBe('Bearer error="invalid_token"');
    const missingPayload = JSON.parse(missing.text);
    expect(missingPayload.error.code).toBe(-32001);

    const wrong = await rawRequest(port, 'POST', '/mcp', { ...JSON_HEADERS, authorization: 'Bearer nope' }, body);
    expect(wrong.status).toBe(401);

    // With the token, both gates pass and the SDK transport answers the
    // initialize itself.
    const ok = await rawRequest(port, 'POST', '/mcp', { ...JSON_HEADERS, authorization: 'Bearer tok123' }, body);
    expect(ok.status).toBe(200);
  }, 30000);

  test('serves a 2025-era initialize without any modern metadata headers', async () => {
    const port = await getFreePort();
    currentDone = startServer('127.0.0.1', port);
    await waitForListening('127.0.0.1', port);
    const res = await rawRequest(port, 'POST', '/mcp', JSON_HEADERS, legacyInitializeBody());
    expect(res.status).toBe(200);
    // The SDK answers an initialize with an SSE stream (the Accept header
    // includes text/event-stream), carrying one `data:` line: the result.
    const dataLine = res.text.split('\n').find((l) => l.startsWith('data: '));
    const payload = JSON.parse(dataLine.replace(/^data: /, ''));
    expect(payload.result.serverInfo.name).toBe('frodo-mcp');
  }, 30000);

  test('rejects an unknown initialize protocol version with -32022', async () => {
    const port = await getFreePort();
    currentDone = startServer('127.0.0.1', port);
    await waitForListening('127.0.0.1', port);
    const res = await rawRequest(port, 'POST', '/mcp', JSON_HEADERS, legacyInitializeBody('1999-01-01'));
    expect(res.status).toBe(400);
    expect(res.text).toContain('-32022');
  }, 30000);

  test('rejects an empty JSON-RPC batch with 400 -32600 (SDK empty-batch parity)', async () => {
    // Before the fix the hand-wired transport silently answered 202 for [].
    const port = await getFreePort();
    currentDone = startServer('127.0.0.1', port);
    await waitForListening('127.0.0.1', port);
    const res = await rawRequest(port, 'POST', '/mcp', JSON_HEADERS, '[]');
    expect(res.status).toBe(400);
    const payload = JSON.parse(res.text);
    expect(payload.error.code).toBe(-32600);
    expect(payload.error.message).toBe('Bad Request: empty JSON-RPC batch');
    expect(payload.id).toBeNull();
  }, 30000);

  test('forwards a non-empty legacy JSON-RPC batch to the transport (existing behavior)', async () => {
    // classifyBatch parity: only the empty array is a batch-shaped
    // rejection; a batch of legacy elements keeps reaching the transport,
    // which answers the initialize element itself.
    const port = await getFreePort();
    currentDone = startServer('127.0.0.1', port);
    await waitForListening('127.0.0.1', port);
    const initialize = JSON.parse(legacyInitializeBody());
    const res = await rawRequest(port, 'POST', '/mcp', JSON_HEADERS, JSON.stringify([initialize]));
    expect(res.status).toBe(200);
    const dataLine = res.text.split('\n').find((l) => l.startsWith('data: '));
    const payload = JSON.parse(dataLine.replace(/^data: /, ''));
    expect(payload.result.serverInfo.name).toBe('frodo-mcp');
  }, 30000);

  test('rejects a malformed (non-string) envelope claim with 400 -32602 end to end', async () => {
    // The QA reproduction: before the fix this POST returned 202 with no
    // body (silently downgraded to legacy handling); now it is the SDK's
    // envelope-invalid answer.
    const port = await getFreePort();
    currentDone = startServer('127.0.0.1', port);
    await waitForListening('127.0.0.1', port);
    const body = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'frodo_discover',
        arguments: {},
        _meta: { 'io.modelcontextprotocol/protocolVersion': 12345 },
      },
    });
    const res = await rawRequest(port, 'POST', '/mcp', JSON_HEADERS, body);
    expect(res.status).toBe(400);
    const payload = JSON.parse(res.text);
    expect(payload.error.code).toBe(-32602);
    expect(payload.error.message).toBe(
      'Invalid _meta envelope for protocol revision 2026-07-28: io.modelcontextprotocol/protocolVersion: Invalid input: expected string, received number'
    );
    expect(payload.error.data).toEqual({
      envelope: {
        key: 'io.modelcontextprotocol/protocolVersion',
        problem: 'Invalid input: expected string, received number',
      },
    });
  }, 30000);

  test('SIGHUP and SIGQUIT release the listener, log the signal, and resolve the promise', async () => {
    for (const signal of ['SIGHUP', 'SIGQUIT']) {
      const port = await getFreePort();
      printed.length = 0;
      const done = startHttpTransport({ listTools: () => [] }, '127.0.0.1', port);
      await waitForListening('127.0.0.1', port);
      // Emit with the signal name: a real OS signal delivers the name to
      // signal handlers, but a bare process.emit('SIGHUP') passes no
      // argument (Node 24), so the name must be passed explicitly here.
      process.emit(signal, signal);
      await done;
      // Signal receipt is logged (the only record of WHY the server went
      // down when shutdown is triggered remotely). At-least-one rather than
      // exactly-one: jest's shared worker process has accumulated shutdown
      // handlers from every transport this suite started, so one emit
      // dispatches to all of them (each logs its own line).
      const signalLines = printed.filter(
        (p) => p.type === 'info' && p.msg === `received ${signal}, shutting down MCP HTTP server`
      );
      expect(signalLines.length).toBeGreaterThanOrEqual(1);
      // Port released: a fresh bind on the same port must succeed.
      const rebind = await new Promise((resolve, reject) => {
        const server = http.createServer();
        server.on('error', reject);
        server.listen(port, '127.0.0.1', () => {
          server.close(() => resolve(true));
        });
      });
      expect(rebind).toBe(true);
    }
  }, 30000);

  test('EADDRINUSE prints one actionable message and resolves with exit code 1', async () => {
    const port = await getFreePort();
    const incumbent = http.createServer();
    await new Promise((r) => incumbent.listen(port, '127.0.0.1', r));
    try {
      const exitCodeBefore = process.exitCode;
      printed.length = 0;
      const done = startHttpTransport({ listTools: () => [] }, '127.0.0.1', port);
      await expect(done).resolves.toBeUndefined();
      expect(process.exitCode).toBe(1);
      const errorLines = printed.filter((p) => p.type === 'error');
      expect(errorLines).toHaveLength(1);
      expect(errorLines[0].msg).toContain(`port ${port} on 127.0.0.1 is already in use`);
      expect(errorLines[0].msg).toContain('lsof');
      expect(errorLines[0].msg).toContain('--port');
      // A plain TCP squatter (no /health endpoint) does NOT claim an MCP
      // server is answering — the health probe must gate that variant.
      expect(errorLines[0].msg).not.toContain('another MCP server is answering');
      process.exitCode = exitCodeBefore;
    } finally {
      incumbent.close();
    }
  }, 30000);

  test('EADDRINUSE names a live MCP incumbent when its /health answers', async () => {
    const port = await getFreePort();
    // A minimal stand-in MCP incumbent: an HTTP server answering GET /health
    // with 200 — exactly what a real frodo mcp server (or any conforming
    // liveness endpoint) gives the probe.
    const incumbent = http.createServer((req, res) => {
      if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
      }
      res.writeHead(404).end();
    });
    await new Promise((r) => incumbent.listen(port, '127.0.0.1', r));
    try {
      const exitCodeBefore = process.exitCode;
      printed.length = 0;
      const done = startHttpTransport({ listTools: () => [] }, '127.0.0.1', port);
      await expect(done).resolves.toBeUndefined();
      expect(process.exitCode).toBe(1);
      const errorLines = printed.filter((p) => p.type === 'error');
      expect(errorLines).toHaveLength(1);
      expect(errorLines[0].msg).toContain(
        'another MCP server is answering on this port'
      );
      // The lsof hint still covers discovery (no PID claim — the incumbent
      // process is not this process's child).
      expect(errorLines[0].msg).toContain('lsof');
      process.exitCode = exitCodeBefore;
    } finally {
      incumbent.close();
    }
  }, 30000);

  test('the listening line carries the server PID', async () => {
    const port = await getFreePort();
    printed.length = 0;
    const done = startHttpTransport({ listTools: () => [] }, '127.0.0.1', port);
    try {
      await waitForListening('127.0.0.1', port);
      const listening = printed.find((p) => p.msg.includes('listening on'));
      expect(listening).toBeDefined();
      expect(listening.msg).toBe(
        `MCP HTTP server (pid ${process.pid}) listening on http://127.0.0.1:${port}/mcp`
      );
    } finally {
      currentDone = done;
      await shutdownTransport();
    }
  }, 30000);

  test('the heartbeat interval logs a liveness line and is cleared on shutdown', async () => {
    // The production interval is 15 minutes — far beyond a test's patience,
    // and jest fake timers installed after startHttpTransport would not
    // capture an interval created under real timers. The interval is
    // injectable (options.heartbeatIntervalMs), so this drives the real
    // emission/clearing lifecycle with a 40ms period against real timers.
    const port = await getFreePort();
    printed.length = 0;
    const done = startServer('127.0.0.1', port, { heartbeatIntervalMs: 40 });
    await waitForListening('127.0.0.1', port);
    try {
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      await sleep(100);
      const beats = printed.filter((p) => p.msg.includes('still listening'));
      expect(beats.length).toBeGreaterThanOrEqual(1);
      expect(beats[0].msg).toBe(
        `MCP HTTP server still listening on http://127.0.0.1:${port}/mcp (pid ${process.pid})`
      );
      // Shutdown clears the interval: after the transport stops, no further
      // beats accumulate.
      currentDone = done;
      await shutdownTransport();
      const beatsAtShutdown = printed.filter((p) => p.msg.includes('still listening')).length;
      await sleep(120);
      expect(printed.filter((p) => p.msg.includes('still listening'))).toHaveLength(
        beatsAtShutdown
      );
    } catch (err) {
      // Make sure a failure doesn't strand the listener.
      currentDone = done;
      await shutdownTransport();
      throw err;
    }
  }, 30000);


  test('a POST to /mcp with a query string reaches the endpoint (query-param routing)', async () => {
    const port = await getFreePort();
    currentDone = startServer('127.0.0.1', port);
    await waitForListening('127.0.0.1', port);
    // The pre-fix router compared req.url !== '/mcp', 404ing any query string;
    // RFC 9110: the query is not part of the path, and gateways append
    // trace/correlation parameters.
    const res = await rawRequest(
      port,
      'POST',
      '/mcp?source=gateway&requestId=abc123',
      JSON_HEADERS,
      legacyInitializeBody()
    );
    expect(res.status).toBe(200);
    const dataLine = res.text.split('\n').find((l) => l.startsWith('data: '));
    const payload = JSON.parse(dataLine.replace(/^data: /, ''));
    expect(payload.result.serverInfo.name).toBe('frodo-mcp');
    // The path check now ignores the query string on BOTH routes: /health
    // with a query answers 200 like the bare path (RFC 9110 — the query is
    // not part of the path), and unknown paths stay 404.
    const health = await rawRequest(port, 'GET', '/health');
    expect(health.status).toBe(200);
    const healthQuery = await rawRequest(port, 'GET', '/health?probe=1');
    expect(healthQuery.status).toBe(200);
    const notFound = await rawRequest(port, 'GET', '/other?x=1');
    expect(notFound.status).toBe(404);
    const notFoundQuery = await rawRequest(port, 'GET', '/other?x=1');
    expect(notFoundQuery.status).toBe(404);
  }, 30000);

  test('a non-empty batch containing ANY claimed element is rejected -32600 (batch-with-modern-element parity)', async () => {
    // SDK classifyBatch parity (verified live): a batch with any element
    // carrying an envelope claim — valid modern, malformed, legacy-dated, or
    // a claimed notification — answers 400 -32600 with the SDK's exact
    // wording. Presence-only: the claim's validity is never consulted.
    const port = await getFreePort();
    currentDone = startServer('127.0.0.1', port);
    await waitForListening('127.0.0.1', port);
    const cases = {
      'valid modern claim': {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {
          _meta: { [META]: PV, [CAPS]: {} },
        },
      },
      'malformed claim': {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: { _meta: { [META]: 12345 } },
      },
      'legacy-dated claim': {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: { _meta: { [META]: '2025-11-25', [CAPS]: {} } },
      },
      'claimed notification element': {
        jsonrpc: '2.0',
        method: 'notifications/initialized',
        params: { _meta: { [META]: PV, [CAPS]: {} } },
      },
    };
    for (const [label, element] of Object.entries(cases)) {
      const res = await rawRequest(
        port,
        'POST',
        '/mcp',
        JSON_HEADERS,
        JSON.stringify([
          { jsonrpc: '2.0', id: 90, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: {} } },
          element,
        ])
      );
      expect(res.status).toBe(400); // label checked via per-case messages below
      const payload = JSON.parse(res.text);
      expect(payload.error.code).toBe(-32600);
      expect(payload.error.message).toBe(
        'Bad Request: JSON-RPC batches may not contain requests for protocol revision 2026-07-28 or later'
      );
      expect(payload.id).toBeNull();
    }
  }, 30000);

  test('a modern claim missing clientCapabilities is rejected -32602 with the SDK envelope-invalid wording', async () => {
    // The claim-only-modern regression cell, updated for full envelope
    // validation: before this change a request carrying ONLY the claim key
    // was accepted (P1 deferral); the SDK requires the capabilities key on
    // every claimed request and answers exactly this message.
    const port = await getFreePort();
    currentDone = startServer('127.0.0.1', port);
    await waitForListening('127.0.0.1', port);
    const body = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'frodo_discover',
        arguments: {},
        _meta: { [META]: PV },
      },
    });
    const res = await rawRequest(port, 'POST', '/mcp', JSON_HEADERS, body);
    expect(res.status).toBe(400);
    const payload = JSON.parse(res.text);
    expect(payload.error.code).toBe(-32602);
    expect(payload.error.message).toBe(
      `Invalid _meta envelope for protocol revision 2026-07-28: ${CAPS}: missing`
    );
    expect(payload.error.data).toEqual({
      envelope: { key: CAPS, problem: 'missing' },
    });
  }, 30000);

  test('an initialize with a modern claim but no clientCapabilities stays legacy (SDK precedence, end to end)', async () => {
    // SDK parity probe: carriesValidModernEnvelopeClaim requires a FULLY
    // valid envelope, so an initialize whose _meta claims a modern revision
    // without the capabilities key classifies as the legacy handshake and is
    // ANSWERED (the SDK negotiates 2025-era initialize) — not rejected.
    const port = await getFreePort();
    currentDone = startServer('127.0.0.1', port);
    await waitForListening('127.0.0.1', port);
    const body = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 't', version: '1' },
        _meta: { [META]: PV },
      },
    });
    const res = await rawRequest(port, 'POST', '/mcp', JSON_HEADERS, body);
    expect(res.status).toBe(200);
    const dataLine = res.text.split('\n').find((l) => l.startsWith('data: '));
    const payload = JSON.parse(dataLine.replace(/^data: /, ''));
    expect(payload.result.serverInfo.name).toBe('frodo-mcp');
    // The initialize version is honored (not a -32020 or -32602 rejection).
    expect(payload.result.protocolVersion).toBe('2025-06-18');
  }, 30000);

  test('the -32020 presence messages keep origin/main header capitalization', () => {
    // The era gate rewrote the presence messages with wire-lowercased header
    // names ("Missing required mcp-protocol-version header."); origin/main's
    // text capitalized the well-known names. Existing log-greps and test
    // snapshots match the capitalized forms, so the well-known headers
    // restore them (the generic fallthrough keeps the wire spelling).
    const fakeReq = (headers = {}) => ({ headers });
    // Build the mismatch cells:
    const pvHeader = {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'frodo_discover',
        _meta: { [META]: PV, [CAPS]: {} },
      },
    };
    const missingProtocolVersion = validateHttpRequestMetadata(
      fakeReq({ 'mcp-method': 'tools/call', 'mcp-name': 'frodo_discover' }),
      pvHeader
    );
    expect(missingProtocolVersion.error.message).toBe(
      'Missing required MCP-Protocol-Version header.'
    );
    const missingMethod = validateHttpRequestMetadata(
      fakeReq({ 'mcp-protocol-version': '2026-07-28', 'mcp-name': 'frodo_discover' }),
      pvHeader
    );
    expect(missingMethod.error.message).toBe('Missing required Mcp-Method header.');
    const missingName = validateHttpRequestMetadata(
      fakeReq({ 'mcp-protocol-version': '2026-07-28', 'mcp-method': 'tools/call' }),
      pvHeader
    );
    expect(missingName.error.message).toBe(
      'Missing required Mcp-Name header.'
    );
  });

  test('gate decisions are logged at debug level (unauthorized, host, acceptance)', async () => {
    // The per-request gate observability contract: an operator at
    // --mcp-log-level debug can tell "requests arrive and are rejected at a
    // gate" from "requests never arrive". Each decision point emits one
    // line; token/authorization VALUES are never logged (presence only).
    const port = await getFreePort();
    currentDone = startServer('127.0.0.1', port, { authToken: 'tok123' });
    await waitForListening('127.0.0.1', port);
    const body = legacyInitializeBody();

    // Unauthorized POST (no header): gate line without any header material.
    const missing = await rawRequest(port, 'POST', '/mcp', JSON_HEADERS, body);
    expect(missing.status).toBe(401);
    const unauthorizedLines = debugLines().filter((p) =>
      p.msg.includes('rejected: unauthorized')
    );
    expect(unauthorizedLines.length).toBeGreaterThanOrEqual(1);
    expect(
      unauthorizedLines.some((p) => p.msg.includes('no Authorization header'))
    ).toBe(true);
    // The secret token value must never appear in any log line.
    expect(printed.some((p) => p.msg.includes('tok123'))).toBe(false);

    // Wrong token: presence is logged, contents are not.
    await rawRequest(
      port,
      'POST',
      '/mcp',
      { ...JSON_HEADERS, authorization: 'Bearer wrong-value' },
      body
    );
    expect(
      debugLines().some((p) =>
        p.msg.includes('Authorization header did not verify')
      )
    ).toBe(true);
    expect(printed.some((p) => p.msg.includes('wrong-value'))).toBe(false);

    // Accepted request: one arrival line + one acceptance line.
    await rawRequest(
      port,
      'POST',
      '/mcp',
      { ...JSON_HEADERS, authorization: 'Bearer tok123' },
      body
    );
    expect(debugLines().some((p) => p.msg.includes('accepted from'))).toBe(true);
    expect(
      debugLines().some((p) => p.msg.includes('POST /mcp?') || p.msg.includes('POST /mcp from'))
    ).toBe(true);

    // Host rejection: a bad Host header is named by the gate line.
    const badHost = await rawRequest(
      port,
      'POST',
      '/mcp',
      { ...JSON_HEADERS, authorization: 'Bearer tok123', host: 'evil.example.com' },
      body
    );
    expect(badHost.status).toBe(403);
    expect(
      debugLines().some((p) => p.msg.includes('rejected: invalid Host header'))
    ).toBe(true);
  }, 30000);

  test('gate logging stays silent at the default (info) level contract', async () => {
    // The DEBUG marker is what gates the output: production runs default to
    // --mcp-log-level info, and the logger's own level filter (McpLogger
    // constructor: level 'info' drops debug records) is what keeps stdout
    // quiet. Here assert the unit-level counterpart: every debug line the
    // transport emits is typed 'debug' (never 'info'/'error'), so wiring the
    // real logger at info cannot leak these lines.
    const port = await getFreePort();
    printed.length = 0;
    currentDone = startServer('127.0.0.1', port, { authToken: 'tok123' });
    await waitForListening('127.0.0.1', port);
    await rawRequest(port, 'POST', '/mcp', JSON_HEADERS, legacyInitializeBody());
    const nonDebugGateLines = printed.filter(
      (p) =>
        (p.msg.includes('rejected:') || p.msg.includes('accepted from')) &&
        p.type !== 'debug'
    );
    expect(nonDebugGateLines).toEqual([]);
    const arrival = debugLines().find((p) => p.msg.includes('POST /mcp'));
    expect(arrival).toBeDefined();
  }, 30000);
});

// ---------------------------------------------------------------------------
// Launcher signal forwarding (src/launch.ts, the dist/launch.cjs wrapper)
// ---------------------------------------------------------------------------

describe('launcher signal forwarding', () => {
  // The wrapper (launch.ts) spawns the CLI child with stdio inherit and has
  // no session of its own; a signal delivered to only the wrapper (closing
  // SSH session -> SIGHUP, `kill <wrapper-pid>` -> SIGTERM) must reach the
  // child, or a long-running `frodo mcp server start` outlives its parent
  // and holds the port. Driven against the built dist/launch.cjs running the
  // real `mcp server start --transport http` (the listener comes up without
  // a tenant connection), signaling the WRAPPER process.
  const { spawn } = childProcess;
  const fs = fsPromise;
  const os = osPromise;
  const path = pathPromise;
  const launchPath = path.resolve('dist/launch.cjs');
  const hasDist = fs.existsSync(launchPath);

  const cond = (name, fn) => (hasDist ? test(name, fn, 60000) : test.skip(name, fn));

  cond('SIGHUP to the wrapper reaches the child, which exits and releases the port', async () => {
    const port = await getFreePort();
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-launch-'));
    const profilesPath = path.join(tmpDir, 'Connections.json');
    fs.writeFileSync(profilesPath, JSON.stringify({}));
    const child = spawn(
      process.execPath,
      [launchPath, 'mcp', 'server', 'start', '--transport', 'http', '--port', String(port)],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, FRODO_TEST: '1', NO_COLOR: '1', FRODO_CONNECTION_PROFILES_PATH: profilesPath },
      }
    );
    try {
      await waitForListening('127.0.0.1', port, 30000);
      // Signal the WRAPPER, not the child: the forwarding under test. The
      // child exits on the forwarded SIGHUP (its graceful-shutdown handler
      // resolves the transport promise, then the process unwinds) — the
      // wrapper's exit reflects the child's.
      process.kill(child.pid, 'SIGHUP');
      const [code, signal] = await new Promise((resolve) =>
        child.once('exit', (c, s) => resolve([c, s]))
      );
      expect(code ?? signal).not.toBeNull();
      // Port released: a fresh bind on the same port must succeed.
      const rebind = await new Promise((resolve, reject) => {
        const server = http.createServer();
        server.on('error', reject);
        server.listen(port, '127.0.0.1', () => server.close(() => resolve(true)));
      });
      expect(rebind).toBe(true);
    } finally {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGKILL');
      }
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
