# Pi-Dots Codemap

**Last Updated:** 2026-03-26

pi-coding-agent dotfiles - copy what you need.

---

## Packages

| Package | Location | Skills |
|---------|----------|--------|
| Core | `pi-dotfiles/skills/` | 12 |
| Niche | `pi-dotfiles-niche-skills/skills/` | 33 |
| Specialist | `pi-dotfiles-specialist-skills/skills/` | 16 |

---

## Core Skills (12)

Located in `pi-dotfiles/skills/`:

| Skill | Purpose |
|-------|---------|
| brainstorming | Feature planning |
| coding-standards | TypeScript/JS/React best practices |
| context7-base-code-review | Look up docs |
| context7-driven-development | Use docs while coding |
| humanizer | Polish documentation |
| iterative-retrieval | Progressive context |
| planning-with-files | File-based task planning |
| security-review | Auth, secrets, API security |
| strategic-compact | Manual context compaction |
| tdd-workflow | Test-driven development |
| verification-loop | Verify your work |
| visual-explainer | HTML diagrams |

---

## Directory Structure

```
pi-dots/
├── README.md              # Quick install guide
├── INSTALL.md             # Detailed install
├── bootstrap-check.sh     # (unused, can delete)
│
├── pi-dotfiles/           # Core
│   ├── skills/            # 12 skills
│   └── .pi/               # settings.json, mcp.json
│
├── pi-dotfiles-niche-skills/  # Optional (34)
│   └── skills/
│
├── pi-dotfiles-specialist-skills/  # Optional (16)
│   └── skills/
│
├── pi-mcp-access/         # MCP bridge
├── pi-agents/             # Subagents
├── pi-dynamic-model-providers/  # Model providers
├── examples/              # Config examples
└── pi-coding-dynamic-pruning/  # (unused)
```

---

## Install

```bash
# Copy skills you want
mkdir -p ~/.pi/agent/skills
cp -r pi-dotfiles/skills/* ~/.pi/agent/skills/

# Copy settings
cp pi-dotfiles/.pi/settings.json ~/.pi/agent/
cp pi-dotfiles/.pi/mcp.json ~/.pi/agent/
```

---

## Model Providers

- **OpenRouter** - needs API key
- **Kilo Gateway** - needs API key

---

*Generated: 2026-03-26*