# pi-agents

A local `pi-coding-agent` package that adds a `subagent` tool plus a bundled set of reusable agent definitions.

## Included

- subagent extension based on the pi example extension
- bundled agents such as:
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
- workflow prompts:
  - `/implement`
  - `/scout-and-plan`
  - `/implement-and-review`

## Notes

- bundled package agents are always available
- user agents from `~/.pi/agent/agents` can also be used
- project agents from `.pi/agents` can be enabled with `agentScope: "both"` or `"project"`
- project agents require confirmation by default when pi has a UI

## Scripts

```bash
npm install
npm run typecheck
npm run test
npm run check
```
