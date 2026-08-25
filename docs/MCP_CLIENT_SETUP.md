# Setting up Frodo MCP in an MCP Client

This guide covers how to configure an MCP client to connect to Frodo's MCP server (`frodo mcp server start`). For what the server does once connected -- skill discovery, policy presets, profiles, logging -- see the [MCP Server](../.github/README.md#mcp-server) section of the main README. This guide is only about the client-side wiring: where each client's config file lives and what to put in it.

MCP client configuration file formats are still evolving and differ from client to client. The examples below were verified against each client's own documentation at the time of writing; if a client has since changed its config schema, trust that client's own current docs over this file, and please open an issue or PR to update this guide.

## Prerequisites

- Frodo installed and on `PATH` (`npm i -g @rockcarver/frodo-cli`), or invoked via `npx @rockcarver/frodo-cli`.
- A saved [connection profile](../.github/README.md#connection-profiles) for the tenant you want the MCP server to target (`frodo conn add ...`), so `frodo mcp server start <profile>` doesn't need credentials on the command line or in a client config file.

Frodo's MCP server supports two transports (`frodo mcp server start --help` for the full flag list):

- **stdio** (default): the client launches `frodo mcp server start ...` as a subprocess and talks to it over stdin/stdout. This is what every example below uses -- it's the simplest, most widely supported option and needs no separate process management.
- **http** (`--transport http --bind-host <host> --port <port>`, default `127.0.0.1:6277`): you start the server yourself as a long-running process, and point a client that supports HTTP/SSE-based MCP servers at its URL instead of a launch command. Support for this varies more by client than stdio does, so prefer stdio unless you have a specific reason to run the server long-lived and shared across multiple client sessions.

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
