# pi-coding-dynamic-pruning

A `pi-coding-agent` extension that ports **Dynamic Context Pruning** from [opencode-dynamic-context-pruning](https://github.com/Opencode-DCP/opencode-dynamic-context-pruning).

## Features

### Automatic pruning strategies

- **Deduplication** — prunes older duplicate tool calls (same tool + args), keeping only the newest
- **Supersede writes** — prunes stale `write`/`edit` inputs when a later `read` on the same file supersedes them
- **Purge errors** — prunes errored tool inputs after a configurable number of user turns
- **Turn protection** — shields recent turns from pruning
- **Path/tool protection** — glob-based protection for tools and file paths

### Compress (ported from OpenCode DCP)

- **Compress tool** — LLM calls `compress` with message ranges and summaries to replace stale sections
- **Message refs** — assistant messages get `[msg:N]` tags so the LLM can reference specific messages
- **Decompress/recompress** — `/dcp decompress <id>` restores, `/dcp recompress <id>` re-activates
- **Block state** — compressed blocks tracked with session persistence

### Context nudges (ported from OpenCode DCP)

- **Context limit nudge** — warns when context usage exceeds configurable % of window
- **Turn nudge** — periodic reminder on turn boundaries when context is between min/max
- **Iteration nudge** — fires after many consecutive tool-only iterations without user input

### Configuration

- **Per-strategy protectedTools** — `deduplication.protectedTools`, `purgeErrors.protectedTools`
- **Config validation** — warns on unknown keys and type mismatches
- **Backward compatible** — old boolean/number shorthand still works

### Stats

- `/dcp stats` — shows active blocks, tokens saved, block history

## Commands

```
/dcp status          Show DCP status, context usage, and compression info
/dcp on              Enable DCP for this session branch
/dcp off             Disable DCP for this session branch
/dcp manual [on|off] Toggle manual mode (no automatic pruning)
/dcp reload          Reload config from disk
/dcp stats           Show compression statistics
/dcp decompress <id> Restore a compressed block's messages
/dcp recompress <id> Re-activate a previously decompressed block
/dcp help            Show available commands
```

## Config

Global: `~/.pi/agent/dcp.json`
Project: `.pi/dcp.json` (walks up from cwd)

```jsonc
{
  "enabled": true,
  "minContextTokens": 50000,
  "protectedTools": [],
  "protectedPathPatterns": ["secrets/**", ".env*"],
  "turnProtection": { "enabled": true, "turns": 4 },
  "strategies": {
    "deduplication": {
      "enabled": true,
      "protectedTools": ["bash"]
    },
    "supersedeWrites": true,
    "purgeErrors": {
      "enabled": true,
      "turns": 4,
      "protectedTools": ["edit"]
    }
  },
  "compress": {
    "enabled": true,
    "permission": "allow",
    "protectedTools": ["compress"],
    "protectUserMessages": false,
    "nudges": {
      "enabled": true,
      "maxContextPercent": 80,
      "minContextPercent": 50,
      "nudgeFrequency": 5,
      "iterationThreshold": 15
    }
  }
}
```

## Package layout

```
src/
├── index.ts              Extension entry point (events, commands, wiring)
├── config.ts             Config loading, merging, validation
├── pruning.ts            Pure pruning engine (dedup, supersede, purge errors)
├── glob.ts               Glob matching for path/tool protection
├── compress-state.ts     Compress block state management
├── compress-tool.ts      Compress tool registration
└── nudges.ts             Context nudge evaluation
tests/
├── pruning.test.ts       Pruning strategy tests
├── glob.test.ts          Glob matching tests
├── config.test.ts        Config merge and validation tests
├── compress-state.test.ts Compress state round-trip tests
└── nudges.test.ts        Nudge evaluation tests
```

## Scripts

```bash
npm install
npm run typecheck
npm run test
npm run check    # typecheck + test
```

## Compatibility

Requires `@mariozechner/pi-coding-agent@^0.62.0`. Tested against OpenCode DCP v3.1.5.

Feature parity with OpenCode DCP:
| Feature | Status |
|---------|--------|
| Deduplication | ✅ Ported |
| Purge errors | ✅ Ported (with per-strategy protectedTools) |
| Supersede writes | ✅ pi-only feature |
| Compress tool | ✅ Ported |
| Decompress | ✅ Ported |
| Recompress | ✅ Ported |
| Context nudges | ✅ Ported |
| Stats | ✅ Ported |
| Config validation | ✅ Ported |
| Per-strategy protectedTools | ✅ Ported |
| Message ID injection | ✅ Ported (`[msg:N]` tags) |
| Custom prompt overrides | ❌ Not ported (OpenCode-specific path resolution) |
| Sub-agent support | ❌ Not ported (pi doesn't expose sub-agent context) |
| Range-mode compress | ❌ Simplified to contiguous ranges |
| All-time cross-session stats | ❌ Not ported (pi session model differs) |
