# pi-dotfiles

This directory is a pi-coding-agent compatible fork of `/home/V/projects/favorite-opencode-setup`.

## Included

- `prompts/` — converted command templates
- `skills/` — copied skills plus converted standalone specialist-role skills (`specialist-*`)
- `AGENTS.md` — project instructions adapted for pi
- `docs/` — supporting reference docs
- `package.json` — pi package manifest

## Omitted

- `plugins/`
- source-harness config files such as `opencode.json` and `oh-my-opencode-slim.json`
- original provider / plugin runtime wiring from the source setup
- harness-specific skills that depended on external hook systems or source-harness storage paths

## Notes

Pi does not natively support the source harness's specialist-agent command routing, so commands that previously targeted specialist agents were converted into standard pi prompt templates with the specialist prompt inlined.

Pi also does not ship with built-in MCP support. This repo now includes a small local extension package, `pi-mcp-access`, wired through `.pi/settings.json`. The local MCP config enables both Context7 and JCodeMunch. MCP-oriented workflows in this package still degrade gracefully: if an MCP server is unavailable, use the documented CLI, HTTP, or web-search fallback described in the relevant prompt or skill.

This repo also includes a local `pi-agents` package that adds a `subagent` tool plus bundled agent definitions such as `planner`, `architect`, `code-reviewer`, `security-reviewer`, `worker`, and `scout`.

This package now uses standard pi package directories (`prompts/`, `skills/`) instead of project-local `.pi/...` paths.

## Quick start

### Use directly from this folder

This repo includes `pi-dotfiles/.pi/settings.json` pointing back to the package root and to the local `pi-mcp-access` and `pi-agents` packages, so running `pi` from this directory loads the package resources automatically.

Run `pi` from this directory and use:

- `/plan ...`
- `/tdd ...`
- `/code-review ...`
- `/security ...`
- `/implement ...`
- `/scout-and-plan ...`
- `/implement-and-review ...`
- `/skill:context7-base-code-review`
- `/skill:specialist-planner`
- `/skill:specialist-code-reviewer`
- use the `subagent` tool for bundled agents like `planner`, `architect`, `worker`, `reviewer`, and `code-reviewer`

### Install as local pi packages

If you want the full setup outside this repo working directory, install all three local packages:

```bash
pi install ./pi-dotfiles -l
pi install ./pi-mcp-access -l
pi install ./pi-agents -l
```

You will also need MCP server config in either `.pi/mcp.json` for the project or `~/.pi/agent/mcp.json` globally. The repo-local `pi-dotfiles/.pi/mcp.json` is the example used when running inside this repository.

If you only install `pi-dotfiles`, you still get the prompt templates and skills, but not the local MCP bridge or subagent package from this repo.

