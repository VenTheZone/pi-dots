# pi-dots

A repo containing local `pi-coding-agent` packages and project dotfiles:

- `./pi-dotfiles/` — converted prompts, skills, project docs, and `.pi` config
- `./pi-mcp-access/` — MCP bridge extension for pi
- `./pi-agents/` — subagent extension plus bundled agent definitions
- `./pi-coding-dynamic-pruning/` — standalone dynamic context pruning package

## Prerequisites

- Node.js 20+
- npm
- `pi`
- `uvx` for JCodeMunch MCP

## Fast local setup

For using this repo directly as a project:

```bash
./scripts/setup-local.sh
cd pi-dotfiles
pi
```

This uses the checked-in project config in `pi-dotfiles/.pi/` and automatically loads:

- `pi-dotfiles`
- `pi-mcp-access`
- `pi-agents`

It also uses the project MCP config in `pi-dotfiles/.pi/mcp.json`, which enables:

- Context7
- JCodeMunch

Useful commands once pi is running:

- `/mcp tools`
- `/implement <task>`
- `/scout-and-plan <task>`
- `/implement-and-review <task>`

## Global install

If you want these packages available outside this repo's project-local config:

```bash
./scripts/install-global.sh
```

That will:

- install npm dependencies for the local packages
- run `pi install` for `pi-dotfiles`, `pi-mcp-access`, and `pi-agents`
- create `~/.pi/agent/mcp.json` from `examples/mcp.global.example.json` if one does not already exist

## Validation

```bash
cd pi-mcp-access && npm run check
cd ../pi-agents && npm run check
cd ../pi-coding-dynamic-pruning && npm run check
```

## Notes

- The dynamic pruning package is implemented and tested as a standalone package. Live `.pi` integration remains deferred.
- The repo intentionally ignores `node_modules/` and `dist/`.
