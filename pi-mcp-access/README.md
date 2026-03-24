# pi-mcp-access

A small `pi-coding-agent` extension package that bridges MCP tools into pi custom tools.

## Features

- connects to MCP servers over:
  - `streamable-http`
  - `sse`
  - `stdio`
- dynamically registers discovered MCP tools as pi tools
- preserves original MCP tool names when possible
- adds `/mcp status`, `/mcp tools`, and `/mcp reload`

## Config

The extension loads MCP server config from:

- project: `.pi/mcp.json`
- global: `~/.pi/agent/mcp.json`

Project config overrides global config.

Example:

```json
{
  "servers": {
    "context7": {
      "transport": "streamable-http",
      "url": "https://mcp.context7.com/mcp",
      "enabled": true
    },
    "local-example": {
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "some-mcp-server"],
      "enabled": false,
      "toolPrefix": "local_"
    }
  }
}
```

## Commands

- `/mcp status`
- `/mcp tools`
- `/mcp reload`

## Scripts

```bash
npm install
npm run typecheck
npm run test
npm run check
```

## Repo integration

This repo already includes project-local MCP config at `pi-dotfiles/.pi/mcp.json` for:

- `context7`
- `jcodemunch`

For global setup, use:

```bash
./scripts/install-global.sh
```

or copy `examples/mcp.global.example.json` to `~/.pi/agent/mcp.json` and adjust as needed.
