# pi-dotfiles

A `pi-coding-agent` compatible fork of the original favorite-opencode setup, adapted into a cleaner pi package layout.

## Includes

- `prompts/` — converted command templates
- `skills/` — imported skills plus converted specialist-role skills (`specialist-*`)
- `AGENTS.md` — project guidance adapted for pi
- `docs/` — supporting reference docs
- `package.json` — pi package manifest
- `.pi/settings.json` — project-local wiring for this repo
- `.pi/mcp.json` — project-local MCP server config

## What changed from the original setup

- plugin/runtime wiring from the source setup was removed
- specialist-agent routing was converted into normal pi prompts and skills
- pi package directories (`prompts/`, `skills/`) are used instead of source-harness-specific layout
- MCP support is provided through the local `pi-mcp-access` package in this repo
- subagent support is provided through the local `pi-agents` package in this repo

## MCP and agents

When you run pi from this directory, the repo-local config loads:

- `pi-dotfiles`
- `pi-mcp-access`
- `pi-agents`

The repo-local MCP config enables:

- Context7
- Exa
- JCodeMunch

Bundled subagent workflows come from `pi-agents`, including:

- `/implement`
- `/scout-and-plan`
- `/implement-and-review`

## Quick start

From the repo root:

```bash
npm run setup
npm run check
cd pi-dotfiles
pi
```

Then try:

- `/mcp tools`
- `/plan ...`
- `/tdd ...`
- `/code-review ...`
- `/implement ...`
- `/scout-and-plan ...`
- `/implement-and-review ...`
- `/skill:context7-base-code-review`
- `/skill:specialist-planner`

You can also use the `subagent` tool directly for bundled agents such as `planner`, `architect`, `worker`, `reviewer`, and `code-reviewer`.

## Using it outside this repo

Install the local packages:

```bash
pi install ./pi-dotfiles -l
pi install ./pi-mcp-access -l
pi install ./pi-agents -l
```

Or from the repo root use:

```bash
npm run install-global
```

If you only install `pi-dotfiles`, you still get prompt templates and skills, but not the MCP bridge or subagent package.
