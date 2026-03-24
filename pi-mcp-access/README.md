# pi-mcp-access

A small `pi-coding-agent` extension package that bridges MCP servers into pi tools.

## Features

- connects to MCP servers over:
  - `streamable-http`
  - `sse`
  - `stdio`
- dynamically registers discovered MCP tools as pi tools
- preserves MCP tool names when possible, with optional prefixes
- adds:
  - `/mcp status`
  - `/mcp tools`
  - `/mcp reload`

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
      "enabled": true,
      "toolPrefix": "context7_"
    },
    "exa": {
      "transport": "streamable-http",
      "url": "https://mcp.exa.ai/mcp",
      "enabled": true,
      "toolPrefix": "exa_"
    },
    "jcodemunch": {
      "transport": "stdio",
      "command": "uvx",
      "args": ["jcodemunch-mcp"],
      "enabled": true,
      "toolPrefix": "jcodemunch_"
    }
  }
}
```

## Repo integration

This repo already includes MCP wiring for:

- Context7
- Exa
- JCodeMunch

Repo-local project config lives at:
- `pi-dotfiles/.pi/mcp.json`

Global config example lives at:
- `examples/mcp.global.example.json`

For global setup from the repo root:

```bash
npm run install-global
```

## Scripts

```bash
npm install
npm run typecheck
npm run test
npm run check
```
