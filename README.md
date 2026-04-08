# pi-dots

**All the skills you'll need for AI-powered development with pi-coding-agent.**

pi-dots is a comprehensive collection of 60+ skills, agents, and workflows that transform pi into a complete AI development platform. From project setup to research, implementation, testing, debugging, deployment, and even content creation — it's all here.

Quick start: copy what you want.

---

## For LLM Agents

Paste this into any coding agent to install pi-dots:

```
Install and configure pi-coding-agent extensions and skills by following the instructions here:
https://raw.githubusercontent.com/VenTheZone/pi-dots/refs/heads/main/INSTALL.md
```

---

## Packages

| Package | Description |
|---------|-------------|
| `pi-dotfiles` | Core skills, settings, MCP config |
| `pi-dotfiles-niche-skills` | 60 total skills (Docker, Python, Go, AI research, content creation, project management, design systems, web utilities, etc.) |
| `pi-dotfiles-specialist-skills` | 16 specialist roles |
| `pi-agents` | Extended subagents (external-scout, etc.) |
| `pi-dynamic-model-providers` | OpenRouter, Kilo Gateway, **NVIDIA NIM**, Cline free models |

---

## Core Skills (12)

| Skill | Use for |
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

## Niche Skills (60 total)

pi-dotfiles-niche-skills now includes **60 skills** (was 33). Skills are organized by category:

### Infrastructure & Research
- `agent-introspection-debugging` — Self-healing for failing agents (loops, context overflow)
- `mcp-server-patterns` — Build custom MCP servers
- `deep-research` — Multi-source cited research (firecrawl + exa)
- `market-research` — Business/competitive intelligence
- `exa-search` — Exa MCP integration for web/code search
- `documentation-lookup` — Context7 live docs lookup

### Content Creation
- `brand-voice` — Build reusable voice profiles from real examples
- `content-engine` — Platform-native content (X, LinkedIn, newsletters)
- `article-writing` — Long-form essays/guides with voice
- `crosspost` — Multi-platform distribution without duplicates

### Developer Tools
- `dmux-workflows` — Parallel agent orchestration via tmux
- `claude-api` — Anthropic Claude API patterns
- `bun-runtime` — Bun runtime/package manager/bundler
- `nextjs-turbopack` — Next.js 16+ development
- `x-api` — X/Twitter API integration
- `agent-sort` — Optimize skill/agent load based on repo
- `investor-outreach` — Investor communication
- `api-design` — REST/GraphQL API design patterns

### Project Management & Workflow
- `quick-setup` — Auto-detect project stack, generate .pi/ config
- `git-workflow` — Git branching, commits, PRs, conflict resolution
- `debug-helper` — Systematic error analysis, log interpretation, profiling
- `grill-me` — Stress-test plans with relentless interview
- `improve-codebase-architecture` — AI-powered codebase exploration for refactoring opportunities
- `request-refactor-plan` — Create refactor plans with tiny commits, GitHub RFC
- `write-a-skill` — Create new agent skills (meta-skill for extending pi)
- `decision-commits` — Write commits that capture judgment, not just description (record of decisions)

### Web Utilities
- `web-fetch` — Fetch web pages, extract readable text
- `web-search` — DuckDuckGo web search (lightweight option)

### Testing & E2E (already present, enhanced)
- `e2e-testing` — Playwright patterns and Page Object Model
- `eval-harness` — Eval-driven development framework

---

## Special Features

### External Scout & Plan

Use `/external-scout-and-plan <feature>` to:
1. Search the web for open source implementations
2. Clone top repos to `/tmp/` for review
3. Analyze patterns and architecture
4. Generate a detailed implementation plan based on real-world examples

Requires: `exa-search` skill + `exa-mcp-server` configured.

### Dynamic Model Providers

Adds support for multiple model providers beyond the built-in ones:
- **OpenRouter** — 350+ models
- **Kilo Gateway** — 350+ models
- **NVIDIA NIM** — Llama, Nemotron, Nemo (requires `NVIDIA_API_KEY`)
- **Cline** — 500+ models + 3 free models (MiniMax M2.5, KAT Coder Pro, GLM-5)

Use `/provider-models list` to see all available models.

---

## Install

```bash
mkdir -p ~/.pi/agent/skills
cp -r pi-dotfiles/skills/* ~/.pi/agent/skills/
cp pi-dotfiles/.pi/settings.json ~/.pi/agent/
cp pi-dotfiles/.pi/mcp.json ~/.pi/agent/
```

Or copy specific skills:

```bash
cp -r pi-dotfiles/skills/tdd-workflow ~/.pi/agent/skills/
```

---

## Commands

See `pi-dotfiles/prompts/commands.md` for all `/` commands (26 total).

---

## Verify

```bash
pi --eval "/mcp tools"
```
