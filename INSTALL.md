# Install Guide

This repo supports a few different install styles. Pick the one that matches how you want to use pi.

## Prerequisites

You need:

- Node.js 20+
- npm
- `pi`
- `uvx`

## Why the install paths changed

The old setup bundled too much into the default experience.

Now the install paths are explicit:

- **core** if you want a smaller everyday setup
- **full** if you want everything available everywhere
- **custom mix** if you want to stay selective

This keeps the default install lean without deleting any of the extra material.

## Option 1: Run from this repo

Best if you want to try the setup first or work on the repo itself.

```bash
npm run setup
npm run check
cd pi-dotfiles
pi
```

This uses the checked-in project config and loads:

- `pi-dotfiles`
- `pi-mcp-access`
- `pi-agents`

Default MCP tools:

- Context7
- JCodeMunch

## Option 2: Global install, core only

Best if you want the smallest default setup everywhere.

```bash
npm run install-global
```

This installs:

- `pi-dotfiles`
- `pi-mcp-access`
- `pi-agents`

It does **not** install the optional skill packs.

## Option 3: Global install, full setup

Best if you want everything available everywhere.

```bash
npm run install-global-full
```

This installs:

- `pi-dotfiles`
- `pi-dotfiles-niche-skills`
- `pi-dotfiles-specialist-skills`
- `pi-mcp-access`
- `pi-agents`

## Option 4: Build your own mix

If you want to stay selective, install only the pieces you want.

### Core package

```bash
pi install ./pi-dotfiles
pi install ./pi-mcp-access
pi install ./pi-agents
```

### Optional niche skills

```bash
pi install ./pi-dotfiles-niche-skills
```

Use this pack for stack-specific, workflow-specific, or special-purpose skills like:

- Django
- Spring Boot
- Go
- Python
- database migrations
- E2E testing
- browser automation
- web scraping
- `humanizer`

### Optional specialist-role skills

```bash
pi install ./pi-dotfiles-specialist-skills
```

Use this pack if you still want old `/skill:specialist-*` entry points.

## What the default package includes

The default `pi-dotfiles` package keeps only the broadest day-to-day skills:

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

## MCP config

The global install scripts write `~/.pi/agent/mcp.json` if it does not exist yet.

The example config lives at:

- `examples/mcp.global.example.json`

Repo-local config lives at:

- `pi-dotfiles/.pi/mcp.json`

## Sanity check

After installing, these are good quick checks:

```bash
pi
/mcp tools
```

If you are inside `pi-dotfiles`, you can also run:

```bash
npm run check
```
