# pi-agents

A local `pi-coding-agent` package that adds a `subagent` tool plus a bundled set of reusable agent definitions.

## Includes

Bundled agents such as:

- `planner`
- `architect`
- `code-reviewer`
- `security-reviewer`
- `tdd-guide`
- `build-error-resolver`
- `doc-updater`
- `go-reviewer`
- `go-build-resolver`
- `database-reviewer`
- `rust-reviewer`
- `rust-clippy-fmt-check-tester`
- `context7-sdk-compliance`
- `python-reviewer`
- `scout`
- `reviewer`
- `worker`

Bundled workflow prompts:

- `/implement`
- `/scout-and-plan`
- `/implement-and-review`

## Behavior

- bundled package agents are always available when this package is loaded
- user agents from `~/.pi/agent/agents` can also be used
- project agents from `.pi/agents` can be enabled with `agentScope: "both"` or `"project"`
- project agents require confirmation by default when pi has a UI

## Repo integration

This repo's `pi-dotfiles/.pi/settings.json` already loads `pi-agents` automatically when you run `pi` from `pi-dotfiles/`.

In the default repo setup, `pi-agents` is paired with the companion `pi-dynamic-model-providers` extension so the same environment also gets dynamic OpenRouter, Kilo Gateway, and optional Cline proxy model registration.

For setup from the repo root:

```bash
npm run setup
npm run check
```

For broader availability across projects:

```bash
npm run install-global
```

That global install flow includes:

- `pi-agents`
- `pi-dynamic-model-providers`

So subagents and dynamic provider discovery are available together by default.

## Scripts

```bash
npm install
npm run typecheck
npm run test
npm run check
```
