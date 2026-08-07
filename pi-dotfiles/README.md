# pi-dotfiles

Core prompts and skills for `pi-coding-agent`.

This package is the lean default layer in this repo. It keeps the always-useful workflows close at hand and leaves niche or overlapping skills in optional packages.

## Why this package is lean now

This package is meant to be the default layer, so it now keeps only the most broadly useful workflows.

The intent is:

- keep the default skill list short
- reduce overlap with `pi-agents`
- move stack-specific guidance into an add-on pack
- keep specialist-role prompts available without loading them by default

## What is in this package

- `prompts/` — converted command templates
- `skills/` — 13 core skills for general coding workflows
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
- `decision-commits`
- `humanizer`
- `iterative-retrieval`
- `planning-with-files`
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
- `../pi-dynamic-model-providers` — dynamic provider registration for Cline and custom endpoints

## MCP and agents

When you run pi from this directory, the repo-local config loads:

- `pi-dotfiles`
- `pi-mcp-access`
- `pi-agents`
- `pi-dynamic-model-providers`

The repo-local MCP config enables:

- Context7
- JCodeMunch

The repo-local dynamic provider config enables:

- Cline (via `CLINE` OAuth or `CLINE_API_KEY`)
- custom OpenAI-compatible endpoints added with `/add-model`

Common env vars:

- `CLINE_API_KEY`

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
- `/provider-models status`
- `/provider-models refresh`
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
pi install ./pi-dynamic-model-providers -l
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
