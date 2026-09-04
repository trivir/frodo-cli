/**
 * Transport-limit resolution for the MCP HTTP transport.
 *
 * Split out of server-start.ts for the same reason as server-auth.ts: the
 * resolution rules (flag-over-env precedence, invalid-value fallback) have
 * direct unit coverage, while server-start's own import graph pulls in all of
 * frodo-lib and the full CLI command tree, which cannot load under jest's ESM
 * runtime.
 */

import {
  DEFAULT_MCP_HTTP_MAX_BODY_SIZE_BYTES,
  DEFAULT_MCP_HTTP_MAX_CONCURRENT_REQUESTS,
} from '../../../ops/McpServerOps.js';

/**
 * Parses a positive integer option value, treating everything else (zero,
 * negative, non-numeric, non-finite) as unset.
 *
 * Shared validation for `--max-body-size` and `--max-concurrent-requests`:
 * an invalid value must not crash the start nor silently cap at some tiny
 * number — it falls back to the documented default, and the caller logs the
 * fallback so an operator who mistyped sees it in the startup log.
 */
export function parsePositiveIntOptionValue(
  value: string | undefined
): number | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
    return undefined;
  }
  return parsed;
}

/**
 * Resolves the effective POST /mcp body-size limit: the CLI flag wins over
 * the `FRODO_MCP_MAX_BODY_SIZE` environment fallback (same precedence rule as
 * the bearer token — the environment keeps long-lived operator config out of
 * process listings; the flag exists for parity and quick testing). An
 * invalid or non-positive value on either channel is treated as unset, so a
 * fat-fingered `FRODO_MCP_MAX_BODY_SIZE=0` (or `abc`) cannot disable the cap
 * entirely; the caller logs when a value was ignored.
 */
export function resolveMcpHttpMaxBodySize(
  flagValue: string | undefined,
  envValue: string | undefined,
  /** Set when a value was ignored as invalid (rendered in the fallback log). */
  onInvalid?: (invalid: {
    flag: string | undefined;
    env: string | undefined;
  }) => void
): number {
  const flag = parsePositiveIntOptionValue(flagValue);
  if (flag !== undefined) {
    return flag;
  }
  const env = parsePositiveIntOptionValue(envValue);
  if (env !== undefined) {
    return env;
  }
  if (onInvalid && (flagValue !== undefined || envValue !== undefined)) {
    onInvalid({ flag: flagValue, env: envValue });
  }
  return DEFAULT_MCP_HTTP_MAX_BODY_SIZE_BYTES;
}

/**
 * Resolves the effective concurrent POST /mcp handler cap: same precedence
 * and invalid-value rules as {@linkcode resolveMcpHttpMaxBodySize}.
 */
export function resolveMcpHttpMaxConcurrentRequests(
  flagValue: string | undefined,
  envValue: string | undefined,
  onInvalid?: (invalid: {
    flag: string | undefined;
    env: string | undefined;
  }) => void
): number {
  const flag = parsePositiveIntOptionValue(flagValue);
  if (flag !== undefined) {
    return flag;
  }
  const env = parsePositiveIntOptionValue(envValue);
  if (env !== undefined) {
    return env;
  }
  if (onInvalid && (flagValue !== undefined || envValue !== undefined)) {
    onInvalid({ flag: flagValue, env: envValue });
  }
  return DEFAULT_MCP_HTTP_MAX_CONCURRENT_REQUESTS;
}

/**
 * Resolves the `--port` option value to the port number handed to the
 * transport: a valid TCP port as-is, the literal `auto` (any case) as 0 —
 * the OS then assigns the ephemeral port and every user-visible mention
 * (listening line, lockfile) reports the RESOLVED port — and the default
 * 6277 otherwise. An out-of-range or non-numeric value falls back to the
 * default rather than crashing the start.
 */
export function parseMcpHttpPortOption(value: string | undefined): number {
  if (value !== undefined && value.toLowerCase() === 'auto') {
    return 0;
  }
  const parsed = parsePositiveIntOptionValue(value);
  if (parsed !== undefined && parsed <= 65535) {
    return parsed;
  }
  return 6277;
}
