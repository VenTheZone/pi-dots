# OpenCode Configuration Codemap

Complete navigation guide for the favorite-opencode-setup repository.

## Repository Overview

**Purpose**: Personal OpenCode configuration with curated skills, agents, and tools for AI-assisted development.

**Total Components**:
- 47 Skills
- 16 Agents  
- 27 Commands
- 4 Tools

---

## Directory Structure

```
favorite-opencode-setup/
├── README.md                 # Main documentation
├── AGENTS.md                 # Agent workflow rules
├── opencode.json            # Main configuration
├── .gitignore               # Git ignore rules
├── commands/                # 27 custom commands
├── instructions/            # Base instruction files
├── prompts/                 # Agent prompts
│   └── agents/             # 16 agent definitions
├── skills/                  # 47 skills organized by category
└── tools/                   # 4 custom tools
```

---

## Configuration Files

### opencode.json
**Location**: `./opencode.json`

**Purpose**: Main OpenCode configuration defining models, agents, commands, and permissions.

**Key Sections**:
- `model` / `small_model` - Default AI models
- `default_agent` - Primary agent (build)
- `instructions` - Auto-loaded skill files
- `agent` - 16 subagent definitions
- `command` - 27 custom commands
- `permission` - Tool permissions

### AGENTS.md
**Location**: `./AGENTS.md`

**Purpose**: Workflow rules for agents including Context7-driven development, security guidelines, and best practices.

---

## Skills by Category

### Security & Testing (9 skills)
| Skill | Purpose | File |
|-------|---------|------|
| `hack-scope` | VDP scope analysis | `skills/hack-scope/SKILL.md` |
| `hacker` | Grayhat security testing | `skills/hacker/SKILL.md` |
| `security-review` | Security code review | `skills/security-review/SKILL.md` |
| `security-scan` | Automated security scanning | `skills/security-scan/SKILL.md` |
| `tdd-workflow` | Test-driven development | `skills/tdd-workflow/SKILL.md` |
| `e2e-testing` | End-to-end testing | `skills/e2e-testing/SKILL.md` |
| `verification-loop` | Verification workflows | `skills/verification-loop/SKILL.md` |
| `eval-harness` | Evaluation framework | `skills/eval-harness/SKILL.md` |
| `browser-automation-agent` | Web browser automation | `skills/browser-automation-agent/SKILL.md` |

### Development Patterns (8 skills)
| Skill | Purpose | File |
|-------|---------|------|
| `api-design` | API design patterns | `skills/api-design/SKILL.md` |
| `backend-patterns` | Backend development | `skills/backend-patterns/SKILL.md` |
| `frontend-patterns` | Frontend development | `skills/frontend-patterns/SKILL.md` |
| `coding-standards` | Code quality standards | `skills/coding-standards/SKILL.md` |
| `database-migrations` | Database migration patterns | `skills/database-migrations/SKILL.md` |
| `deployment-patterns` | Deployment strategies | `skills/deployment-patterns/SKILL.md` |
| `docker-patterns` | Docker best practices | `skills/docker-patterns/SKILL.md` |
| `planning-with-files` | File-based planning | `skills/planning-with-files/SKILL.md` |

### Language-Specific (11 skills)
| Skill | Language | File |
|-------|----------|------|
| `golang-patterns` / `golang-testing` | Go | `skills/golang-*/SKILL.md` |
| `python-patterns` / `python-testing` | Python | `skills/python-*/SKILL.md` |
| `django-patterns` / `django-security` / `django-tdd` | Django | `skills/django-*/SKILL.md` |
| `springboot-patterns` / `springboot-security` / `springboot-tdd` | Spring Boot | `skills/springboot-*/SKILL.md` |
| `cpp-testing` | C++ | `skills/cpp-testing/SKILL.md` |
| `java-coding-standards` | Java | `skills/java-coding-standards/SKILL.md` |
| `jpa-patterns` | JPA/Hibernate | `skills/jpa-patterns/SKILL.md` |

### Database & Infrastructure (3 skills)
| Skill | Purpose | File |
|-------|---------|------|
| `postgres-patterns` | PostgreSQL patterns | `skills/postgres-patterns/SKILL.md` |
| `clickhouse-io` | ClickHouse database | `skills/clickhouse-io/SKILL.md` |
| `iterative-retrieval` | Information retrieval | `skills/iterative-retrieval/SKILL.md` |

### Specialized Development (6 skills)
| Skill | Purpose | File |
|-------|---------|------|
| `mev-solana-bot` | Solana MEV bot CLI | `skills/mev-solana-bot/SKILL.md` |
| `mev-bot-development` | MEV bot development | `skills/mev-bot-development/SKILL.md` |
| `context7-base-code-review` | Context7 integration | `skills/context7-base-code-review/SKILL.md` |
| `humanizer` | Text humanization | `skills/humanizer/SKILL.md` |
| `using-web-scraping` | Web scraping | `skills/using-web-scraping/SKILL.md` |
| `web-search-api` | Web search utilities | `skills/web-search-api/SKILL.md` |

### Workflow & Learning (4 skills)
| Skill | Purpose | File |
|-------|---------|------|
| `continuous-learning` / `continuous-learning-v2` | Learning workflows | `skills/continuous-learning*/SKILL.md` |
| `strategic-compact` | Strategic planning | `skills/strategic-compact/SKILL.md` |
| `project-guidelines-example` | Project guidelines | `skills/project-guidelines-example/SKILL.md` |
| `configure-ecc` | ECC configuration | `skills/configure-ecc/SKILL.md` |

### Data Processing (2 skills)
| Skill | Purpose | File |
|-------|---------|------|
| `nutrient-document-processing` | Document processing | `skills/nutrient-document-processing/SKILL.md` |
| `security-review/cloud-infrastructure-security` | Cloud security | `skills/security-review/cloud-infrastructure-security.md` |

---

## Agents

### Core Development Agents

| Agent | Mode | Purpose | Prompt File |
|-------|------|---------|-------------|
| `build` | primary | Primary coding agent | (inline) |
| `planner` | subagent | Implementation planning | `prompts/agents/planner.txt` |
| `architect` | subagent | System architecture | `prompts/agents/architect.txt` |
| `code-reviewer` | subagent | Code quality review | `prompts/agents/code-reviewer.txt` |

### Specialized Reviewers

| Agent | Mode | Purpose | Prompt File |
|-------|------|---------|-------------|
| `security-reviewer` | subagent | Security analysis | `prompts/agents/security-reviewer.txt` |
| `tdd-guide` | subagent | Test-driven development | `prompts/agents/tdd-guide.txt` |
| `build-error-resolver` | subagent | Build error fixing | `prompts/agents/build-error-resolver.txt` |
| `e2e-runner` | subagent | E2E testing | `prompts/agents/e2e-runner.txt` |

### Language Specialists

| Agent | Mode | Purpose | Prompt File |
|-------|------|---------|-------------|
| `go-reviewer` | subagent | Go code review | `prompts/agents/go-reviewer.txt` |
| `go-build-resolver` | subagent | Go build errors | `prompts/agents/go-build-resolver.txt` |
| `rust-reviewer` | subagent | Rust code review | `prompts/agents/rust-reviewer.txt` |
| `rust-clippy-fmt-check-tester` | subagent | Rust toolchain | `prompts/agents/rust-clippy-fmt-check-tester.txt` |
| `database-reviewer` | subagent | Database optimization | `prompts/agents/database-reviewer.txt` |

### Utility Agents

| Agent | Mode | Purpose | Prompt File |
|-------|------|---------|-------------|
| `doc-updater` | subagent | Documentation updates | `prompts/agents/doc-updater.txt` |
| `refactor-cleaner` | subagent | Dead code cleanup | `prompts/agents/refactor-cleaner.txt` |
| `context7-sdk-compliance` | subagent | SDK compliance | `prompts/agents/context7-sdk-compliance.md` |

### Additional Agent Files
- `python-reviewer.md` - Python specialist (not configured in opencode.json)

---

## Commands

### Development Workflow Commands

| Command | Agent | Description | File |
|---------|-------|-------------|------|
| `/plan` | planner | Create implementation plan | `commands/plan.md` |
| `/tdd` | tdd-guide | Enforce TDD workflow | `commands/tdd.md` |
| `/code-review` | code-reviewer | Review code quality | `commands/code-review.md` |
| `/security` | security-reviewer | Run security review | `commands/security.md` |
| `/build-fix` | build-error-resolver | Fix build errors | `commands/build-fix.md` |
| `/e2e` | e2e-runner | Generate E2E tests | `commands/e2e.md` |
| `/refactor-clean` | refactor-cleaner | Remove dead code | `commands/refactor-clean.md` |

### Go Commands

| Command | Agent | Description | File |
|---------|-------|-------------|------|
| `/go-review` | go-reviewer | Go code review | `commands/go-review.md` |
| `/go-test` | tdd-guide | Go TDD workflow | `commands/go-test.md` |
| `/go-build` | go-build-resolver | Fix Go build errors | `commands/go-build.md` |

### Rust Commands

| Command | Agent | Description | File |
|---------|-------|-------------|------|
| `/rust-review` | rust-reviewer | Rust code review | `commands/rust-review.md` |
| `/rust-clippy-fmt-check` | rust-clippy-fmt-check-tester | Fix Rust errors | `commands/rust-clippy-fmt-check.md` |

### Utility Commands

| Command | Agent | Description | File |
|---------|-------|-------------|------|
| `/orchestrate` | planner | Multi-agent orchestration | `commands/orchestrate.md` |
| `/learn` | - | Extract patterns | `commands/learn.md` |
| `/checkpoint` | - | Save progress | `commands/checkpoint.md` |
| `/verify` | - | Run verification | `commands/verify.md` |
| `/eval` | - | Run evaluation | `commands/eval.md` |
| `/update-docs` | doc-updater | Update documentation | `commands/update-docs.md` |
| `/update-codemaps` | doc-updater | Update codemaps | `commands/update-codemaps.md` |
| `/test-coverage` | tdd-guide | Analyze coverage | `commands/test-coverage.md` |
| `/setup-pm` | - | Configure package manager | `commands/setup-pm.md` |
| `/skill-create` | - | Generate skills | `commands/skill-create.md` |
| `/instinct-status` | - | View instincts | `commands/instinct-status.md` |
| `/instinct-import` | - | Import instincts | `commands/instinct-import.md` |
| `/instinct-export` | - | Export instincts | `commands/instinct-export.md` |
| `/evolve` | - | Cluster instincts | `commands/evolve.md` |
| `/mev-bot` | - | MEV bot patterns | `commands/mev-bot.md` |

---

## Tools

| Tool | Purpose | File |
|------|---------|------|
| `run-tests` | Run test suite | `tools/run-tests.ts` |
| `check-coverage` | Analyze test coverage | `tools/check-coverage.ts` |
| `security-audit` | Security vulnerability scan | `tools/security-audit.ts` |
| `index` | Tool exports | `tools/index.ts` |

---

## Instructions

### Auto-Loaded on Startup

1. `instructions/INSTRUCTIONS.md` - Base security and coding guidelines
2. `skills/tdd-workflow/SKILL.md` - TDD methodology
3. `skills/security-review/SKILL.md` - Security review patterns
4. `skills/coding-standards/SKILL.md` - Code quality standards
5. `skills/mev-bot-development/SKILL.md` - MEV bot patterns
6. `skills/mev-solana-bot/SKILL.md` - Solana MEV bot CLI
7. `skills/hacker/SKILL.md` - Grayhat security testing
8. `skills/hack-scope/SKILL.md` - VDP scope analysis

---

## Usage Patterns

### Loading Skills
```bash
skill: hacker                    # Load hacker skill
skill: hack-scope               # Load hack-scope skill
skill: mev-solana-bot           # Load MEV bot skill
```

### Using Agents
```bash
@planner create a plan for...    # Use planner agent
@security-reviewer check this... # Use security reviewer
@architect design system for...  # Use architect agent
```

### Running Commands
```bash
/plan feature implementation     # Create implementation plan
/tdd                             # Start TDD workflow
/security                        # Run security review
/build-fix                       # Fix build errors
```

---

## Dependencies

### Between Components

**Skills depend on:**
- Base instructions (security guidelines)
- Other skills (some reference each other)

**Agents depend on:**
- Prompt files in `prompts/agents/`
- Tool permissions defined in opencode.json

**Commands depend on:**
- Agent definitions
- Command template files in `commands/`

---

## Maintenance

### When Adding New Skills
1. Create `skills/<name>/SKILL.md` with proper frontmatter
2. Add to `opencode.json` instructions array (optional)
3. Update this codemap

### When Adding New Agents
1. Create `prompts/agents/<name>.txt`
2. Add agent definition to `opencode.json`
3. Update this codemap

### When Adding New Commands
1. Create `commands/<name>.md`
2. Add command definition to `opencode.json`
3. Update this codemap

---

## Quick Reference

**Total Files**:
- 3 root config files (README.md, AGENTS.md, opencode.json)
- 27 command files
- 16 agent prompt files
- 47 skill directories
- 4 tool files
- 1 instructions file

**Most Used Skills**:
1. `hacker` - Security testing
2. `hack-scope` - VDP analysis
3. `tdd-workflow` - Test-driven development
4. `security-review` - Security reviews
5. `planning-with-files` - Complex task planning

**Most Used Agents**:
1. `build` - Primary development
2. `planner` - Implementation planning
3. `code-reviewer` - Code review
4. `security-reviewer` - Security analysis
5. `tdd-guide` - TDD enforcement

---

*Generated: $(date)*
*Repository: https://github.com/VenTheZone/favorite-opencode-setup*
