# Setting up Frodo MCP in an MCP Client

This guide covers how to configure an MCP client to connect to Frodo's MCP server (`frodo mcp server start`). For what the server does once connected -- skill discovery, policy presets, profiles, logging -- see the [MCP Server](../.github/README.md#mcp-server) section of the main README. This guide is only about the client-side wiring: where each client's config file lives and what to put in it.

MCP client configuration file formats are still evolving and differ from client to client. The examples below were verified against each client's own documentation at the time of writing; if a client has since changed its config schema, trust that client's own current docs over this file, and please open an issue or PR to update this guide.

## Prerequisites

- Frodo installed and on `PATH` (`npm i -g @rockcarver/frodo-cli`), or invoked via `npx @rockcarver/frodo-cli`.
- A saved [connection profile](../.github/README.md#connection-profiles) for the tenant you want the MCP server to target (`frodo conn add ...`), so `frodo mcp server start <profile>` doesn't need credentials on the command line or in a client config file.

Frodo's MCP server supports two transports (`frodo mcp server start --help` for the full flag list):

- **stdio** (default): the client launches `frodo mcp server start ...` as a subprocess and talks to it over stdin/stdout. This is what every example below uses -- it's the simplest, most widely supported option and needs no separate process management.
- **http** (`--transport http --bind-host <host> --port <port>`, default `127.0.0.1:6277`): you start the server yourself as a long-running process, and point a client that supports HTTP/SSE-based MCP servers at its URL instead of a launch command. Support for this varies more by client than stdio does, so prefer stdio unless you have a specific reason to run the server long-lived and shared across multiple client sessions. See [Running the HTTP transport](#running-the-http-transport) below for bind/auth/host options.

## VS Code Copilot (Agent Mode)

VS Code reads MCP server definitions from a `.vscode/mcp.json` file in the workspace root (or from VS Code's user-level MCP settings for a config you want available across projects). Its schema uses a top-level `servers` key -- not `mcpServers`, which is what Claude Desktop and some other clients use -- and requires an explicit `"type": "stdio"` on each entry.

`.vscode/mcp.json`:

```json
{
  "servers": {
    "frodo": {
      "type": "stdio",
      "command": "frodo",
      "args": ["mcp", "server", "start", "my-tenant"]
    }
  }
}
```

Replace `my-tenant` with the name of a saved connection profile. Restart VS Code (or reload the window) after adding or changing this file. Once the workspace opens, Copilot starts the server and its tools become available in Agent Mode.

## Claude Code

Claude Code is configured via the `claude mcp add` command rather than by hand-editing a config file directly (though it does write one under the hood). For a stdio server, options come before the server name, and `--` separates the server name from the command Claude Code should run:

```console
claude mcp add --transport stdio frodo -- frodo mcp server start my-tenant
```

Use `--scope project` instead of the default user scope if you want this registered only for the current project rather than for all of Claude Code. Verify with `claude mcp list`.

## Claude Desktop

Claude Desktop reads `claude_desktop_config.json`:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

Its schema uses `mcpServers` as the top-level key, and typically infers stdio transport from the presence of `command`/`args` rather than requiring an explicit `type` field (unlike VS Code):

```json
{
  "mcpServers": {
    "frodo": {
      "command": "frodo",
      "args": ["mcp", "server", "start", "my-tenant"]
    }
  }
}
```

Restart Claude Desktop after editing this file for the change to take effect.

## Other MCP clients

Any MCP client that supports launching a local stdio server should work the same way: point it at the `frodo` executable with args `["mcp", "server", "start", "<profile>"]` (or the fully-qualified path/`npx @rockcarver/frodo-cli` invocation, if `frodo` isn't globally on `PATH` in that client's execution environment). Consult the client's own documentation for its specific config file location and key names.

## Running the HTTP transport

`frodo mcp server start --transport http` serves the MCP endpoint at `POST /mcp` and a liveness probe at `GET /health` (`{"status":"ok"}`, no auth -- liveness probes must not need secrets). The default bind is `127.0.0.1:6277`, which only exposes the port to the local machine; everything below exists to safely widen that.

### Bearer-token auth (`--mcp-auth-token` / `FRODO_MCP_AUTH_TOKEN`)

Pass `--mcp-auth-token <secret>` and every `POST /mcp` request must carry a matching `Authorization: Bearer <secret>` header; requests without (or with a wrong) token get `401` and a `WWW-Authenticate: Bearer` challenge. The comparison is timing-safe. `GET /health` stays unauthenticated. The token value is never printed in logs or the startup summary, which only reports `HTTP auth: on`:

```console
frodo mcp server start --transport http --bind-host 0.0.0.0 --port 6277 --mcp-auth-token <secret>
```

The token can instead come from the `FRODO_MCP_AUTH_TOKEN` environment variable -- preferred for anything long-lived, since the environment keeps the secret out of process listings (`ps`). The CLI flag wins when both are set; the flag exists for parity and quick testing.

Refusing an exposed bind without a token: binding a non-loopback host (`0.0.0.0`, a LAN address, a hostname -- anything that is not `127.x.y.z`, `[::1]`, or `localhost`) without a token **refuses to start**, because anything that can reach the port could drive tenant operations with the startup credentials. Pass `--mcp-auth-token <secret>` (or set the env var), or `--allow-unauthenticated` to accept that risk explicitly. A loopback bind without a token behaves exactly as it always has -- local-only, no auth gate.

### Host allow-list (`--allowed-hosts`)

The server validates the `Host` header against an allow-list to stay safe against DNS rebinding. The default set is `localhost`, `127.0.0.1`, and `[::1]`; `--allowed-hosts <host...>` *extends* it (it does not replace it), and `host.docker.internal` is added automatically whenever the bind host is non-loopback -- the standard Docker Desktop/Linux `host-gateway` alias a bridge-network container uses to reach a server on the host itself:

```console
frodo mcp server start --transport http --allowed-hosts mcp.example.internal
```

### Containerized gateway on the same machine

The setup this section exists for: an AI gateway (or other MCP client) running in a Docker container on the same host as frodo. A bridge-network container cannot reach the host's `127.0.0.1` -- inside the container that is the container's own loopback, so the connection is refused. Point the container at the host instead (via `host.docker.internal`, or `extra_hosts: host-gateway:host-gateway` on Linux where the alias does not exist by default), and run frodo bound to a non-loopback interface with a token:

```console
frodo mcp server start --transport http --bind-host 0.0.0.0 --port 6277 --mcp-auth-token <secret>
```

```yaml
# docker-compose fragment for the gateway container
services:
  gateway:
    extra_hosts:
      - "host.docker.internal:host-gateway"   # Linux: create the alias; Docker Desktop has it natively
    environment:
      FRODO_MCP_URL: http://host.docker.internal:6277/mcp
      FRODO_MCP_AUTH_TOKEN: <secret>          # same secret as frodo's --mcp-auth-token
```

The gateway then connects to `http://host.docker.internal:6277/mcp` with `Authorization: Bearer <secret>` on every request. No change to the gateway's image or network model is needed: opening the three gates (non-loopback bind, the `host.docker.internal` Host alias -- automatic --, and the token) is all frodo-side configuration.

### Observability (PID, heartbeat, crash lines)

The HTTP server is long-lived and usually watched remotely, so its log carries the basics a remote operator needs:

- The startup line names the server PID: `MCP HTTP server (pid 12345) listening on http://...` -- pair it with `lsof -iTCP:<port> -sTCP:LISTEN` when sorting out who holds a port.
- A liveness heartbeat is logged every 15 minutes (`heartbeat: MCP HTTP server still listening on ...`) so a silent process can be told apart from a hung one.
- Signals are logged as they arrive (`shutdown: received SIGHUP, shutting down MCP HTTP server`), so a remotely triggered shutdown leaves a record of why the server went down.
- If the port is already taken, the `EADDRINUSE` message probes the incumbent's `/health` endpoint: when something answers, the message says an MCP server is already serving on that port; otherwise it falls back to the generic "another process is likely listening" wording with the `lsof` discovery hint. Either way the process exits with code 1.
- Process-level crashes in server mode log one timestamped line each (event `crash`): an uncaught exception logs the error and first stack frame, releases the port best-effort, and exits with code 1 (a supervisor should restart it). Unhandled promise rejections are owned by `frodo`'s own global handler (shared by every CLI command): they are logged -- the "please report this unhandled error" block -- and set the shell's eventual exit code to 1, while the server keeps serving. There is no additional server-specific rejection handler.
- Every request's path through the gates is visible at `--mcp-log-level debug` (`http` event: arrival with method/route-path/remote address -- the path only, never the query string, so secret material in a query parameter cannot be echoed into the log --, the deciding gate and value on each rejection -- including which gate rejected an unauthorized POST, without ever logging the Authorization header's contents -- and one acceptance line before the SDK transport answers). At the default `info` level the per-request lines stay quiet.

Test/debug-only hook: setting `FRODO_MCP_CRASH_TEST=1` in the environment makes the HTTP server throw an uncaught exception shortly after it starts listening, so the crash path above (crash line, port release, exit code 1) can be exercised in a real spawned process. Never set it in production.

Note for `frodo`'s own launcher: signals delivered to only the `frodo` wrapper process (`launch.cjs`) -- a closing SSH session sending SIGHUP to the session leader, or `kill <wrapper-pid>` -- are forwarded to the actual CLI child, and a wrapper that exits for any other reason takes the child down with it. Without that forwarding, a long-running HTTP server could outlive its parent and keep holding the port with nobody watching it.

### Protocol-era handling (request metadata and batches)

Older gateway stacks (LiteLLM defaults to protocol revision 2025-11-25; Kong shipped 2025-06-18) speak an earlier MCP protocol era without the 2026 request-metadata headers. Frodo detects the era per request and applies the matching rules, so those clients work without configuration. A request is only rejected at this layer for a genuinely unsupported protocol version, or for one of these SDK-parity validation cells (each answered exactly as the MCP SDK's own HTTP entry answers it):

- an invalid `_meta` envelope (400 -32602): a request claiming the 2026-07-28 per-request envelope must carry BOTH required envelope keys -- the protocol-version claim (a string) AND `io.modelcontextprotocol/clientCapabilities` (a present object). Missing keys are reported first (`io.modelcontextprotocol/clientCapabilities: missing` when only the claim key is present, whatever the claim's value), then schema violations inside present keys (a non-string claim value, a non-object capabilities value). The one carve-out, matching the SDK: an `initialize` whose claim lacks the capabilities key is still treated as the legacy handshake and answered normally. Notifications are validated NARROWER, exactly as the SDK validates them: a notification whose claim is a string is served with no capabilities-key requirement (whatever revision it names); the only notification envelope rejection is a claim whose value is not a string (`400 -32602`, the claim key's type error).
- an empty JSON-RPC batch (`[]`) or a batch containing any element with an envelope claim (400 -32600, `batch-with-modern-element`) -- the 2026 per-request envelope has no batch semantics, and the SDK rejects on claim presence whatever the claim's validity or era.
- a modern `MCP-Protocol-Version` header on a request without a complete envelope (400 -32602, listing every missing envelope key), or a header/body disagreement (400 -32020) -- on requests and on claimed notifications alike.

