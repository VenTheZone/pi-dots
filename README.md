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
| `pi-agents` | 20 subagents (planner, worker, reviewer, external-scout, etc.) |
| `pi-dynamic-model-providers` | Dynamic model catalogs + `/add-model` wizard for custom OpenAI-compatible endpoints |

---

## Core Skills (13)

| Skill | Use for |
|-------|---------|
| brainstorming | Feature planning |
| coding-standards | TypeScript/JS/React best practices |
| context7-base-code-review | Look up docs |
| context7-driven-development | Use docs while coding |
| decision-commits | Commits that capture judgment, not just change descriptions |
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
- `request-refactor-plan` — Create refactor plans with tight commits, GitHub RFC
- `write-a-skill` — Create new agent skills (meta-skill for extending pi)

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

Adds support for model providers beyond the built-ins, fetched live and cached:
- **Kilo Gateway** — free tier via `api.kilo.ai` (`kilo-auto/free` + every `*:free` model: Tencent Hy3, NVIDIA Nemotron, StepFun, Poolside, Cohere, etc.)
- **Cline** — 500+ models + 3 static free models (MiniMax M2.5, KAT Coder Pro, GLM-5; currently `402` — account needs credits)
- **AgentRouter** — Claude (`claude-opus-4-8/5`) + GPT-5.6 Sol via agentrouter.org (paid gateway)
- **Any custom endpoint** — add one interactively with `/add-model` (auto-detects a `/models` catalog or falls back to manual entry)

Manage with `/provider-models status`, `/provider-models refresh`, and `/provider-models list`.

For providers the dynamic extension does not cover, add them directly to `~/.pi/agent/models.json` — see `models.md` in the pi docs for the schema.

---

## Install

Install individual packages with pi's package manager:

```bash
pi install ./pi-dotfiles -l
pi install ./pi-agents -l
pi install ./pi-mcp-access -l
pi install ./pi-dynamic-model-providers -l
# optional
pi install ./pi-dotfiles-niche-skills -l
pi install ./pi-dotfiles-specialist-skills -l
```

Or install everything from the repo root:

```bash
npm run install-global
```

Get detailed agent-step-by-step setup in [INSTALL.md](INSTALL.md).
---

## Commands

See `pi-dotfiles/prompts/commands.md` for all `/` commands.

---

## Verify

```bash
pi --eval "/mcp tools"
```
