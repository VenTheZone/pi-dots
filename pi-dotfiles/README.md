# pi-dotfiles

Core prompts and skills for `pi-coding-agent`.

This package is the lean default layer in this repo. It keeps the always-useful workflows close at hand and leaves niche or overlapping skills in optional packages.

## What is in this package

- `prompts/` — converted command templates
- `skills/` — 10 core skills for general coding workflows
- `AGENTS.md` — project guidance adapted for pi
- `docs/` — supporting reference docs
- `package.json` — pi package manifest
- `.pi/settings.json` — project-local wiring for this repo
- `.pi/mcp.json` — project-local MCP server config

## Core skills in this package

- `brainstorming`
- `coding-standards`
- `context7-base-code-review`
- `context7-driven-development`
- `iterative-retrieval`
- `security-review`
- `strategic-compact`
- `tdd-workflow`
- `verification-loop`
- `visual-explainer`

## Optional companion packages

- `../pi-dotfiles-niche-skills` — extra skills for stacks, databases, testing, scraping, document work, and writing polish
- `../pi-dotfiles-specialist-skills` — old standalone specialist-role skills
- `../pi-mcp-access` — MCP bridge for pi
- `../pi-agents` — subagent support and bundled agents

## MCP and agents

When you run pi from this directory, the repo-local config loads:

- `pi-dotfiles`
- `pi-mcp-access`
- `pi-agents`

The repo-local MCP config enables:

- Context7
- JCodeMunch

Bundled subagent workflows from `pi-agents` include:

- `/implement`
- `/scout-and-plan`
- `/implement-and-review`

For step-by-step install paths, see the repo-level [INSTALL.md](../INSTALL.md).

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
- `subagent` with bundled agents like `planner` and `code-reviewer`

## Install from this repo

```bash
pi install ./pi-dotfiles -l
pi install ./pi-mcp-access -l
pi install ./pi-agents -l
# optional niche skill pack
pi install ./pi-dotfiles-niche-skills -l
# optional specialist-role skill pack
pi install ./pi-dotfiles-specialist-skills -l
```

Or from the repo root:

```bash
npm run install-global
```

If you only install `pi-dotfiles`, you get the lean default prompts and core skills, but not the MCP bridge, subagent package, or optional skill packs.
