# Findings: pi Caveman Extension

## Caveman Project Analysis

**Source:** https://github.com/JuliusBrussee/caveman

### Core Concept
Caveman makes AI agents talk like a caveman:
- Reduce output tokens by ~75%
- Keep technical accuracy 100%
- Drop: articles (a, an, the), filler words (just, really, basically), pleasantries, hedging
- Keep: technical terms exact, code blocks unchanged
- Pattern: [thing] [action] [reason]. [next step]

### Intensity Levels
| Level | Description |
|-------|-------------|
| **Lite** | Drop filler, keep grammar. Professional but no fluff |
| **Full** | Default caveman. Drop articles, fragments, full grunt |
| **Ultra** | Maximum compression. Telegraphic. Abbreviate everything |
| **文言文 (Wenyan)** | Classical Chinese. Most token-efficient |

### Key Prompt Snippet (Always-On Mode)
```
Terse like caveman. Technical substance exact. Only fluff die.
Drop: articles, filler (just/really/basically), pleasantries, hedging.
Fragments OK. Short synonyms.
Code unchanged.
Pattern: [thing] [action] [reason]. [next step].
ACTIVE EVERY RESPONSE.
No revert after many turns. No filler drift.
```

## pi Extension API Research

**Documentation:** /home/kytusdevenn/.picord/workspace/picord/node_modules/@mariozechner/pi-coding-agent/docs/extensions.md

### Key Events for Caveman
- `before_agent_start` - Inject system prompt modifications
- `session_start` - Restore persisted state
- Can register commands like `/caveman`

### System Prompt Modification Pattern
```typescript
pi.on("before_agent_start", async (event, ctx) => {
  return {
    systemPrompt: event.systemPrompt + "\n\n[CAVEMAN INSTRUCTIONS]",
  };
});
```

### State Persistence Pattern
Use `pi.appendEntry()` to store extension state in session, then reconstruct on `session_start`.

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Monitor `before_agent_start` | Clean injection point for modifying system prompt |
| Store mode in custom entry | Session survives restarts; entry type "caveman" |
| Restore on session_start | Reconstruct state when session reloads |
| Use setStatus for indicator | Clean UI feedback for active mode |
| /caveman command with args | Simple user interface: `/caveman [lite\|full\|ultra\|wenyan\|off]` |

## Resources
- Example extension: `/home/kytusdevenn/.picord/workspace/picord/node_modules/@mariozechner/pi-coding-agent/examples/extensions/permission-gate.ts`
- Event reference: `/home/kytusdevenn/.picord/workspace/picord/node_modules/@mariozechner/pi-coding-agent/docs/extensions.md`
