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
import { jest } from '@jest/globals';

// ESM tests have no `require`; alias the pieces the tests need.
const { request: httpRequest } = http;

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
  const META_KEY = 'io.modelcontextprotocol/protocolVersion';

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
        _meta: { [META_KEY]: '2026-07-28' },
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
      envelope: { missing: ['io.modelcontextprotocol/protocolVersion'] },
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
      params: { uri: 'file:///x', _meta: { [META_KEY]: '2026-07-28' } },
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
      params: { _meta: { [META_KEY]: '2026-07-28' } },
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

  test('passes a legacy (pre-2026) envelope claim without modern headers', () => {
    const body = {
      jsonrpc: '2.0',
      id: 7,
      method: 'tools/list',
      params: { _meta: { [META_KEY]: '2025-06-18' } },
    };
    expect(validateHttpRequestMetadata(fakeReq(), body)).toBeNull();
  });

  test('passes a string non-modern claim like 2025-11-25 (legacy-accepted, the LiteLLM default)', () => {
    // The claim value is well-formed for the claim mechanism (a string); the
    // full 2026 envelope schema (clientCapabilities etc.) is deliberately
    // deferred (option-b scope). A present string claim naming a pre-2026
    // revision classifies legacy-era traffic and is accepted.
    const body = {
      jsonrpc: '2.0',
      id: 8,
      method: 'tools/call',
      params: { name: 'frodo_discover', _meta: { [META_KEY]: '2025-11-25' } },
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
      // is not even reachable inside a non-object _meta).
      const body = {
        jsonrpc: '2.0',
        id: 11,
        method: 'tools/call',
        params: { name: 'x', _meta: metaValue },
      };
      expect(validateHttpRequestMetadata(fakeReq(), body)).toBeNull();
      // And with a modern header it is the modern-header-without-claim
      // cell (-32602), not a malformed-claim error. A present-but-non-object
      // _meta means the envelope mechanism was attempted, so the missing key
      // named is the reserved claim key; a null _meta gets '_meta'.
      const withHeader = validateHttpRequestMetadata(
        fakeReq({ 'mcp-protocol-version': '2026-07-28' }),
        body
      );
      expect(withHeader.error.code).toBe(-32602);
      expect(withHeader.error.data).toEqual({
        envelope: { missing: metaValue ? [META_KEY] : ['_meta'] },
      });
    }
  );
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
      process.exitCode = exitCodeBefore;
    } finally {
      incumbent.close();
    }
  }, 30000);
});
