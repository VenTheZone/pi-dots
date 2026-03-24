# pi-dots

A local `pi-coding-agent` setup with a small default install and optional add-on skill packs.

## Packages

- `pi-dotfiles` — prompts, 10 core skills, docs, and project-local `.pi` config
- `pi-dotfiles-niche-skills` — optional stack-specific and special-purpose skills
- `pi-dotfiles-specialist-skills` — optional standalone `/skill:specialist-*` roles
- `pi-mcp-access` — MCP bridge for pi
- `pi-agents` — subagent support plus bundled agents

## Why this changed

This repo used to expose a very large default skill surface.

That worked, but it also created a few problems:

- too many overlapping ways to do the same thing
- a noisier default skill list
- more maintenance drift between docs, config, and actual usage
- more cognitive overhead when the default package should feel lightweight

The cleanup goal was not to remove capability. The goal was to make the default experience smaller and sharper, while keeping the rest available as optional packs.

## What changed

- `pi-dotfiles` was reduced to a 10-skill core package
- stack-specific and special-purpose skills were moved into `pi-dotfiles-niche-skills`
- old standalone `specialist-*` skills were moved into `pi-dotfiles-specialist-skills`
- install flows were split into core-only and full global installs
- docs were updated to match the new package layout and actual MCP defaults

## Default vs optional skills

### Default core skills

These stay in the default package because they are broadly useful across most coding sessions:

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

### Optional niche pack

Install `pi-dotfiles-niche-skills` if you want extra skills for:

- API and backend work
- frontend and Python work
- database and migration work
- framework-specific stacks like Django, Spring Boot, and Go
- document processing, browser automation, web search, and scraping
- security testing workflows
- writing polish via `humanizer`

### Optional specialist pack

Install `pi-dotfiles-specialist-skills` if you still want the old standalone specialist roles available as `/skill:specialist-*` commands.

For most delegation tasks, the bundled agents in `pi-agents` are the better default.

## MCP defaults

This repo is wired for:

- Context7
- JCodeMunch

See [INSTALL.md](./INSTALL.md) for step-by-step install paths.

## Quick start

From the repo root:

```bash
npm run setup
npm run check
cd pi-dotfiles
pi
```

That uses the checked-in project config in `pi-dotfiles/.pi/` and loads:

- `pi-dotfiles`
- `pi-mcp-access`
- `pi-agents`

## Global install

### Core-only global install

```bash
npm run install-global
```

This installs the lean default setup globally.

### Full global install

```bash
npm run install-global-full
```

This installs the default setup plus both optional skill packs.

### Add optional packs manually

```bash
pi install ./pi-dotfiles-niche-skills
pi install ./pi-dotfiles-specialist-skills
```

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

## Useful commands inside pi

- `/mcp tools`
- `/plan <task>`
- `/implement <task>`
- `/scout-and-plan <task>`
- `/implement-and-review <task>`

## Repo layout

- `./pi-dotfiles/`
- `./pi-dotfiles-niche-skills/`
- `./pi-dotfiles-specialist-skills/`
- `./pi-mcp-access/`
- `./pi-agents/`
- `./scripts/`
- `./examples/`

## Notes

- The repo intentionally ignores `node_modules/`, `dist/`, and repo-root `.pi/` state.
- The dynamic pruning package is still in the repo, but it is not part of the active default setup.
