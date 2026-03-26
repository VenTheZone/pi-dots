# Pi-Dots Codemap

**Last Updated:** 2026-03-26

---

## Packages

| Package | Path | Description |
|---------|------|-------------|
| Core | `pi-dotfiles/` | 12 skills, settings, MCP config |
| Niche | `pi-dotfiles-niche-skills/` | 33 extra skills |
| Specialist | `pi-dotfiles-specialist-skills/` | 16 specialist roles |
| MCP Access | `pi-mcp-access/` | MCP bridge |
| Agents | `pi-agents/` | Subagents |
| Dynamic Providers | `pi-dynamic-model-providers/` | Model providers |

---

## Core Skills (12)

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

## Niche Skills (33)

| Category | Skills |
|----------|--------|
| Languages | golang-patterns, golang-testing, python-patterns, python-testing, java-coding-standards, cpp-testing, jpa-patterns |
| Frameworks | django-patterns, django-security, django-tdd, springboot-patterns, springboot-security, springboot-tdd |
| DevOps | docker-patterns, deployment-patterns |
| Database | postgres-patterns, database-migrations, clickhouse-io |
| Security | hacker, hack-scope, security-scan |
| Testing | e2e-testing, verification-loop, eval-harness, browser-automation-agent |
| Other | api-design, frontend-patterns, backend-patterns, continuous-learning, continuous-learning-v2, project-guidelines-example, configure-ecc, nutrient-document-processing, using-web-scraping, web-search-api |

---

## Specialist Skills (16)

| Skill | Purpose |
|-------|---------|
| specialist-auditor | Code auditing |
| specialist-debugger | Debugging |
| specialist-documenter | Documentation |
| specialist-evaluator | Evaluation |
| specialist-generator | Code generation |
| specialist-implementer | Implementation |
| specialist-investigator | Investigation |
| specialist-planner | Planning |
| specialist-refactorer | Refactoring |
| specialist-reviewer | Code review |
| specialist-security | Security |
| specialist-tester | Testing |
| specialist-toolsmith | Tool creation |
| specialist-troubleshooter | Troubleshooting |
| specialist-validator | Validation |
| specialist-visualizer | Visualization |

---

## Slash Commands (26)

| Category | Commands |
|----------|----------|
| Planning | `/plan`, `/orchestrate`, `/checkpoint` |
| Code | `/code-review`, `/refactor-clean`, `/build-fix` |
| Testing | `/tdd`, `/e2e`, `/test-coverage`, `/verify` |
| Languages | `/go-review`, `/go-test`, `/go-build`, `/rust-review`, `/rust-clippy-fmt-check` |
| Security | `/security` |
| Docs | `/update-docs`, `/update-codemaps` |
| Learning | `/learn`, `/evolve`, `/instinct-status`, `/instinct-import`, `/instinct-export` |
| Other | `/eval`, `/setup-pm`, `/skill-create` |

---

## Install

```bash
mkdir -p ~/.pi/agent/skills
cp -r pi-dotfiles/skills/* ~/.pi/agent/skills/
cp pi-dotfiles/.pi/settings.json ~/.pi/agent/
cp pi-dotfiles/.pi/mcp.json ~/.pi/agent/
```

---

## Model Providers

| Provider | Cost | Auth |
|----------|------|------|
| OpenRouter | Paid | API Key |
| Kilo Gateway | Paid | API Key |

---

*Generated: 2026-03-26*
*Repository: https://github.com/VenTheZone/pi-dots*