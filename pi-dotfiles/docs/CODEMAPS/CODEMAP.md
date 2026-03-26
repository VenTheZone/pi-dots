# Pi-Dots Configuration Codemap

**Last Updated:** 2026-03-26

Complete navigation guide for the pi-dots repository.

## Repository Overview

**Purpose**: Personal pi-agent configuration with core skills, dynamic model providers, MCP access, and optional skill packages.

**Total Components**:
- 11 Core Skills (in pi-dotfiles/skills)
- 34 Niche Skills (in pi-dotfiles-niche-skills)
- 16 Specialist Skills (in pi-dotfiles-specialist-skills)
- 1 Planning Skill (planning-with-files)
- 3 Dynamic Model Providers (OpenRouter, Kilo Gateway, Qwen OAuth)

---

## Directory Structure

```
pi-dots/
├── README.md                 # Main documentation
├── INSTALL.md               # Installation guide
├── bootstrap-check.sh       # Bootstrap verification script
├── package.json             # Root package config
│
├── pi-dotfiles/             # Core config (10 skills + settings)
│   ├── skills/              # 10 core skills
│   │   ├── brainstorming/
│   │   ├── coding-standards/
│   │   ├── context7-base-code-review/
│   │   ├── context7-driven-development/
│   │   ├── iterative-retrieval/
│   │   ├── planning-with-files/    # NEW: Manus-style planning
│   │   ├── security-review/
│   │   ├── strategic-compact/
│   │   ├── tdd-workflow/
│   │   └── visual-explainer/
│   ├── .pi/
│   │   ├── settings.json    # pi settings
│   │   ├── mcp.json         # MCP configuration
│   │   └── dynamic-model-providers.json
│   ├── prompts/             # Agent prompts
│   └── docs/CODEMAPS/       # This codemap
│
├── pi-dotfiles-niche-skills/  # Optional stack/workflow skills (34)
│   └── skills/              # Niche skills
│       ├── humanizer/
│       ├── docker/
│       ├── python-patterns/
│       ├── golang-patterns/
│       └── ... (30 more)
│
├── pi-dotfiles-specialist-skills/  # Optional specialist roles (16)
│   └── skills/              # Specialist skills
│       ├── specialist-auditor/
│       ├── specialist-reporter/
│       └── ... (14 more)
│
├── pi-dynamic-model-providers/  # Dynamic model provider extension
│   ├── src/
│   │   ├── index.ts          # Main extension entry
│   │   ├── config.ts         # Provider configuration
│   │   ├── providers.ts      # Model loading logic
│   │   ├── qwen-oauth.ts     # Qwen OAuth auth
│   │   └── cline-oauth.ts   # (disabled) Cline OAuth
│   ├── dist/                # Compiled JavaScript
│   └── package.json
│
├── pi-mcp-access/           # MCP access configuration
│   ├── src/
│   │   ├── index.ts
│   │   ├── config.ts
│   │   └── mcp.ts
│   └── package.json
│
├── pi-agents/               # Custom agents
│   ├── src/
│   │   ├── index.ts
│   │   └── agents.ts
│   └── package.json
│
├── pi-coding-dynamic-pruning/ # Dynamic pruning extension
├── examples/                # Configuration examples
└── scripts/                 # Utility scripts
```

---

## Core Skills (pi-dotfiles/skills)

| Skill | Purpose |
|-------|---------|
| `brainstorming` | Creative feature/function planning |
| `coding-standards` | TypeScript, JS, React, Node best practices |
| `context7-base-code-review` | Context7 documentation lookup |
| `context7-driven-development` | Context7 for features/debugging |
| `iterative-retrieval` | Progressive context retrieval |
| `planning-with-files` | Manus-style file-based planning (NEW) |
| `security-review` | Authentication, secrets, API security |
| `strategic-compact` | Manual context compaction |
| `tdd-workflow` | Test-driven development |
| `visual-explainer` | HTML visual explanations |

---

## Dynamic Model Providers

### Configuration Files
- `~/.pi/agent/dynamic-model-providers.json` - Global config
- `pi-dotfiles/.pi/dynamic-model-providers.json` - Project override

### Providers

| Provider | Models | Auth Method |
|----------|--------|-------------|
| `openrouter` | 50+ models | API Key |
| `kilo-gateway` | 200+ models | API Key |
| `qwen` | qwen3-coder-plus, qwen3-coder-flash | OAuth (Qwen CLI) |

### Usage

```bash
# Login to a provider
pi --eval "/login openrouter"
pi --eval "/login kilo-gateway"
pi --eval "/login qwen"

# Use a model
pi --model kilo-gateway/minimax/minimax-m2.5:free
pi --model openrouter/gpt-4o-mini
```

### Qwen OAuth Setup

```bash
# Install Qwen CLI
npm install -g @qwen-code/qwen-code

# Authenticate
qwen
# Select "Qwen OAuth" and complete browser login

# Credentials saved to: ~/.qwen/oauth_creds.json
```

---

## MCP Access

Configuration: `pi-mcp-access/src/config.ts`

Provides access to local MCP servers via:
- Configured endpoints in settings
- Security-scoped file access

---

## Installation

```bash
# Full install
./scripts/install-global-full.sh

# Core install only
./scripts/install-global.sh
```

Or use pi's package system:
```bash
pi install /home/V/projects/pi-dots/pi-dotfiles
```

---

## Maintenance

### Adding Skills to Core (pi-dotfiles/skills)
1. Create `skills/<name>/SKILL.md`
2. Update this codemap

### Adding Niche/Specialist Skills
1. Add to `pi-dotfiles-niche-skills/` or `pi-dotfiles-specialist-skills/`
2. User can install separately via `pi install npm:...`

### Adding Dynamic Providers
1. Update `pi-dynamic-model-providers/src/config.ts`
2. Update `~/.pi/agent/dynamic-model-providers.json`
3. Rebuild: `cd pi-dynamic-model-providers && npm run build`

---

## Quick Reference

| Component | Location | Notes |
|-----------|----------|-------|
| Core Skills | `pi-dotfiles/skills/` | 10 skills |
| Niche Skills | `pi-dotfiles-niche-skills/skills/` | 34 skills (optional) |
| Specialist Skills | `pi-dotfiles-specialist-skills/skills/` | 16 skills (optional) |
| Planning Skill | `pi-dotfiles/skills/planning-with-files/` | Manus-style |
| Settings | `~/.pi/agent/settings.json` | Global config |
| Provider Config | `~/.pi/agent/dynamic-model-providers.json` | Model providers |
| MCP Config | `~/.pi/agent/mcp.json` | MCP servers |

---

*Generated: 2026-03-26*
*Repository: https://github.com/VenTheZone/pi-dots*