# pi-dots

Your pi-coding-agent setup. Keep it simple, expand as needed.

---

## One-line install

```bash
curl -fsSL https://raw.githubusercontent.com/VenTheZone/pi-dots/main/scripts/install-global-full.sh | bash
```

Or see [Manual setup](#manual-setup) below.

---

## What's included

| Package | Purpose |
|---------|---------|
| `pi-dotfiles` | 12 core skills, prompts, settings |
| `pi-dynamic-model-providers` | OpenRouter, Kilo Gateway, Qwen OAuth |
| `pi-mcp-access` | MCP bridge |
| `pi-agents` | Bundled subagents |

---

## Core skills (included)

| Skill | Use it for |
|-------|------------|
| `brainstorming` | Planning features/tasks |
| `coding-standards` | TypeScript, JS, React, Node best practices |
| `context7-base-code-review` | Looking up docs |
| `context7-driven-development` | Using docs while coding |
| `humanizer` | Polishing documentation |
| `iterative-retrieval` | Progressive context retrieval |
| `planning-with-files` | File-based task planning (Manus-style) |
| `security-review` | Auth, secrets, API security |
| `strategic-compact` | Manual context compaction |
| `tdd-workflow` | Test-driven development |
| `verification-loop` | Verifying your work |
| `visual-explainer` | HTML diagrams and visualizations |

---

## Optional add-ons

### Niche skills (34 more)
Stack-specific and workflow skills for Docker, Python, Go, Django, etc.

```bash
pi install npm:pi-dotfiles-niche-skills
```

### Specialist skills (16 more)
Standalone specialist roles as `/skill:specialist-*` commands.

```bash
pi install npm:pi-dotfiles-specialist-skills
```

---

## Model providers

| Provider | Cost | Setup |
|----------|------|-------|
| Kilo Gateway | Paid | Get API key, then `/login kilo-gateway` |
| OpenRouter | Paid | Get API key, then `/login openrouter` |
| Qwen OAuth | FREE | See below |

### Qwen OAuth (free, 2000/day)

```bash
# 1. Install Qwen CLI
npm install -g @qwen-code/qwen-code

# 2. Authenticate (opens browser)
qwen
# Select "Qwen OAuth" → log in

# 3. Use in pi
pi --model qwen/qwen3-coder-plus
```

---

## Manual setup

### Prerequisites
- Node.js 20+
- `pi` installed (`npm install -g @mariozechner/pi-coding-agent`)

### Install steps

```bash
# Clone repo
git clone https://github.com/VenTheZone/pi-dots.git
cd pi-dots

# Full install (core + niche + specialist)
./scripts/install-global-full.sh

# Or core only
./scripts/install-global.sh
```

### Run locally (no install)

```bash
npm run setup
npm run check
cd pi-dotfiles
pi
```

---

## Common commands

```bash
# Check available MCP tools
pi --eval "/mcp tools"

# See available models
pi --eval "/provider-models status"

# Login to a provider
pi --eval "/login openrouter"
pi --eval "/login kilo-gateway"

# Use a specific model
pi --model kilo-gateway/minimax/minimax-m2.5:free
```

---

## Project structure

```
pi-dots/
├── pi-dotfiles/                    # Core (12 skills)
│   ├── skills/                     # Core skills live here
│   ├── .pi/                        # pi settings
│   └── docs/CODEMAPS/              # Detailed docs
├── pi-dotfiles-niche-skills/       # Optional (34 more)
├── pi-dotfiles-specialist-skills/  # Optional (16 more)
├── pi-dynamic-model-providers/      # Extra models
├── pi-mcp-access/                   # MCP bridge
└── pi-agents/                      # Subagents
```

---

## Links

- [INSTALL.md](./INSTALL.md) — Full setup guide
- [pi-dotfiles/docs/CODEMAPS/CODEMAP.md](./pi-dotfiles/docs/CODEMAPS/CODEMAP.md) — Detailed reference
- [pi.dev](https://pi.dev) — pi documentation