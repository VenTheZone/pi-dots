# pi-dots

A polished local `pi-coding-agent` setup with:

- `pi-dotfiles` — prompts, skills, docs, and project-local `.pi` config
- `pi-mcp-access` — MCP bridge for pi
- `pi-agents` — subagent support plus bundled agents

MCP is configured for:
- Context7
- Exa
- JCodeMunch

## What this gives you

Run `pi` with:
- reusable prompt commands like `/plan`, `/implement`, and `/scout-and-plan`
- bundled subagents like `planner`, `architect`, `worker`, and `reviewer`
- MCP-backed tools for docs lookup, web search, and repo/code intelligence

## Prerequisites

- Node.js 20+
- npm
- `pi`
- `uvx`

## Recommended setup

From the repo root:

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

## Global install

To use the same packages from any directory:

```bash
npm run install-global
```

That installs the local pi packages globally and writes `~/.pi/agent/mcp.json` if needed.

## Validation

Run the root bootstrap check:

```bash
npm run check
```

It validates:
- `pi-mcp-access`
- `pi-agents`
- prompt command discovery from `pi-dotfiles`
- MCP connectivity for Context7, Exa, and JCodeMunch

## Useful commands inside pi

- `/mcp tools`
- `/plan <task>`
- `/implement <task>`
- `/scout-and-plan <task>`
- `/implement-and-review <task>`

## Repo layout

- `./pi-dotfiles/`
- `./pi-mcp-access/`
- `./pi-agents/`
- `./scripts/`
- `./examples/`

## Notes

- The repo intentionally ignores `node_modules/`, `dist/`, and repo-root `.pi/` state.
- The dynamic pruning package remains in the repo as standalone work, but it is not part of the active pi setup.
