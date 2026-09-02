/**
 * Bearer-token resolution for the MCP HTTP transport.
 *
 * Split out of server-start.ts so the resolution rules (flag-over-env
 * precedence, empty-means-unset) have direct unit coverage: server-start's
 * own import graph pulls in all of frodo-lib and the full CLI command tree,
 * which cannot load under jest's ESM runtime.
 */

/**
 * Resolves the effective HTTP bearer token: the CLI flag wins over the
 * `FRODO_MCP_AUTH_TOKEN` environment fallback, since the environment keeps
 * the secret out of process listings (`ps`) while the flag exists for parity
 * and testing. An empty string (flag or env) counts as unset — an empty
 * bearer token would otherwise be enforceable yet trivially guessable, and
 * an empty `Authorization: Bearer` header is malformed anyway.
 */
export function resolveMcpAuthTokenValue(
  flagValue: string | undefined,
  envValue: string | undefined
): string | undefined {
  if (flagValue) {
    return flagValue;
  }
  return envValue ? envValue : undefined;
}
