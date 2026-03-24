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
npm run setup
npm run check
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
npm run install-global
```

That will:

- install npm dependencies for the local packages
- run `pi install` for `pi-dotfiles`, `pi-mcp-access`, and `pi-agents`
- create `~/.pi/agent/mcp.json` from `examples/mcp.global.example.json` if one does not already exist

## Validation

Run the root bootstrap check:

```bash
npm run check
```

It validates:

- `pi-mcp-access`
- `pi-agents`
- prompt command discovery from `pi-dotfiles`
- MCP connectivity for Context7 and JCodeMunch

## Notes

- The dynamic pruning package is implemented and tested as a standalone package. Live `.pi` integration remains deferred.
- The repo intentionally ignores `node_modules/` and `dist/`.
