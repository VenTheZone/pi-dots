# pi-dots

Quick setup for pi-coding-agent. Copy what you want.

---

## For LLM Agents

Paste this into any coding agent to install pi-dots:

```
Install and configure pi-coding-agent extensions and skills by following the instructions here:
https://raw.githubusercontent.com/badlogic/pi-dots/refs/heads/master/INSTALL.md
```

---

## Packages

| Package | Description |
|---------|-------------|
| `pi-dotfiles` | Core skills, settings, MCP config |
| `pi-dotfiles-niche-skills` | 33 extra skills (Docker, Python, Go, etc.) |
| `pi-dotfiles-specialist-skills` | 16 specialist roles |
| `pi-coding-dynamic-pruning` | Auto-prune stale context, compress old messages |
| `pi-mcp-access` | MCP bridge |
| `pi-agents` | Subagents |
| `pi-dynamic-model-providers` | OpenRouter, Kilo Gateway |

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

## Niche Skills (33)

Available in `pi-dotfiles-niche-skills/skills/`:

| Category | Skills |
|----------|--------|
| Languages | golang-patterns, python-patterns, java-coding-standards, cpp-testing |
| Frameworks | django-patterns, springboot-patterns |
| DevOps | docker-patterns, deployment-patterns |
| Database | postgres-patterns, database-migrations, clickhouse-io |
| Security | hacker, hack-scope, security-scan |
| Testing | e2e-testing, eval-harness |
| Other | api-design, frontend-patterns, backend-patterns, continuous-learning, etc. |

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