# pi-coding-dynamic-pruning

A standalone work-in-progress `pi-coding-agent` extension package that ports the **automatic pruning** parts of the OpenCode Dynamic Context Pruning plugin.

## Current scope

Implemented and covered by typecheck/tests:

- deduplicate repeated tool calls and prune stale outputs
- prune stale `write` / `edit` inputs once later file state supersedes them
- prune errored tool inputs after a configurable number of user turns
- protect recent turns from pruning
- protect selected tools and path globs from pruning
- session-local `/dcp` runtime toggles

Not implemented yet:

- OpenCode-style `compress` / `decompress` / `recompress`
- prompt override files
- cross-session stats
- installation dotfiles under `.pi/` (deferred until review is complete)

## Package layout

- `src/index.ts` - pi extension entry point
- `src/pruning.ts` - pure pruning engine
- `src/config.ts` - config loading/merging
- `tests/` - node:test coverage for pruning logic

## Scripts

```bash
npm install
npm run typecheck
npm run test
npm run check
```

## Planned later

Once reviewed, we can add the actual dotfiles for pi integration, e.g.:

- `.pi/extensions/...`
- `.pi/dcp.json`

That part is intentionally deferred for now.
