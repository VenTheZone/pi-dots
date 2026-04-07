# Install

For AI agents: run these steps to install pi-coding-agent and its extensions for the user. Ask the user which packages they want before proceeding.

## Step 1: Clone to /tmp

```bash
cd /tmp && git clone https://github.com/VenTheZone/pi-dots.git && cd pi-dots
```

## Step 2: Ask the user what to install

Before installing, explain each package and ask which ones the user wants:

### Packages

**pi-dotfiles** — Core package. 12 foundational skills (TDD, security review, brainstorming, etc.), prompt templates, slash commands, and MCP config. Start here if unsure.

**pi-agents** — Subagent definitions (planner, worker, reviewer, scout, **external-scout**, etc.) for delegating tasks. Includes workflow prompts like `/implement-and-review` and `/external-scout-and-plan`.

**pi-dynamic-model-providers** — Dynamic model catalog fetcher. Adds OpenRouter (350+ models), Kilo Gateway (350+), **NVIDIA NIM** (requires API key), and Cline free models (MiniMax M2.5, KAT Coder Pro, GLM-5). Configure with API keys.

**pi-dotfiles-niche-skills** — **60 skills total** covering:
  - Languages: Go, Python, Java, C++
  - Frameworks: Django, Spring Boot
  - DevOps: Docker, deployment patterns
  - Databases: Postgres, ClickHouse, migrations
  - Security: hacker patterns, security scanning
  - **New**: AI research (deep-research, market-research, exa-search), content creation (brand-voice, content-engine, article-writing, crosspost), parallel orchestration (dmux-workflows), API design, project management (quick-setup, git-workflow, debug-helper, grill-me, improve-codebase-architecture, request-refactor-plan, write-a-skill, decision-commits), design systems (claymorphism, liquid-glass, neubrutalism), web utilities (web-fetch, web-search).

**pi-dotfiles-specialist-skills** — 16 specialist roles (database reviewer, E2E runner, build error resolver, etc.).

### Granular Skill Selection

Users can also select **individual skills** from `pi-dotfiles-niche-skills` if they don't want all 60. Common selections:

- **AI Research**: `deep-research`, `market-research`, `exa-search`, `documentation-lookup`
- **Content**: `brand-voice`, `content-engine`, `article-writing`, `crosspost`
- **Dev Tools**: `dmux-workflows`, `claude-api`, `bun-runtime`, `nextjs-turbopack`, `x-api`, `agent-sort`, `investor-outreach`, `api-design`
- **Project Workflow**: `quick-setup`, `git-workflow`, `debug-helper`, `grill-me`, `improve-codebase-architecture`, `request-refactor-plan`, `write-a-skill`, `decision-commits`
- **Web Utilities**: `web-fetch`, `web-search`
- **Design Systems**: `claymorphism`, `liquid-glass`, `neubrutalism`
- **Languages/Frameworks**: `golang-patterns`, `python-patterns`, `django-patterns`, `springboot-patterns`, `docker-patterns`, etc.

Ask the user: "Do you want all niche skills, or only specific ones?" If they want specific ones, note which and install only those in Step 4.

After the user picks, continue with the steps below for each chosen package or skill.

## Step 3: Install pi

```bash
npm install -g @mariozechner/pi-coding-agent
```

## Step 4: Copy skills

Based on the user's selection, copy the appropriate packages or individual skills:

### Option A: Copy entire packages (recommended for first-time setup)

```bash
mkdir -p ~/.pi/agent/skills

# Core (always include if user selected pi-dotfiles)
cp -r /tmp/pi-dots/pi-dotfiles/skills/* ~/.pi/agent/skills/

# If user selected pi-agents (includes agents and prompts)
cp -r /tmp/pi-dots/pi-agents ~/.pi/agent/

# If user selected pi-dotfiles-niche-skills (all niche skills)
cp -r /tmp/pi-dots/pi-dotfiles-niche-skills/skills/* ~/.pi/agent/skills/

# If user selected pi-dotfiles-specialist-skills
cp -r /tmp/pi-dots/pi-dotfiles-specialist-skills/skills/* ~/.pi/agent/skills/
```

### Option B: Copy individual niche skills only

If the user wants only specific niche skills, copy just those:

```bash
mkdir -p ~/.pi/agent/skills

# Example: only AI research and git tools
cp -r /tmp/pi-dots/pi-dotfiles-niche-skills/skills/deep-research ~/.pi/agent/skills/
cp -r /tmp/pi-dots/pi-dotfiles-niche-skills/skills/market-research ~/.pi/agent/skills/
cp -r /tmp/pi-dots/pi-dotfiles-niche-skills/skills/exa-search ~/.pi/agent/skills/
cp -r /tmp/pi-dots/pi-dotfiles-niche-skills/skills/git-workflow ~/.pi/agent/skills/
cp -r /tmp/pi-dots/pi-dotfiles-niche-skills/skills/decision-commits ~/.pi/agent/skills/
# Add others as needed
```

**Tip**: For a curated set, suggest common combinations (e.g., "AI research bundle": deep-research, market-research, exa-search, documentation-lookup; "Project workflow bundle": quick-setup, git-workflow, debug-helper, grill-me).

## Step 5: Configure settings

Open `~/.pi/agent/settings.json` and add the packages the user chose to the `packages` array. Use the absolute paths from `/tmp/pi-dots/`:

```json
{
  "packages": [
    "/tmp/pi-dots/pi-dotfiles"
    // Add other selected packages here
  ]
}
```

**Important**: Only include packages the user selected. Examples:

- **Minimal** (just core):
  ```json
  { "packages": ["/tmp/pi-dots/pi-dotfiles"] }
  ```
- **With agents**:
  ```json
  { "packages": [
    "/tmp/pi-dots/pi-dotfiles",
    "/tmp/pi-dots/pi-agents"
  ] }
```
- **Full install** (all packages):
  ```json
  { "packages": [
    "/tmp/pi-dots/pi-dotfiles",
    "/tmp/pi-dots/pi-agents",
    "/tmp/pi-dots/pi-mcp-access",
    "/tmp/pi-dots/pi-dynamic-model-providers",
    "/tmp/pi-dots/pi-dotfiles-niche-skills",
    "/tmp/pi-dots/pi-dotfiles-specialist-skills"
  ] }
```

If the user selected only individual niche skills (not the whole `pi-dotfiles-niche-skills` package), the package entry is **not needed** — those skills are already copied directly to `~/.pi/agent/skills/` in Step 4.

## Step 6: Copy MCP config (optional)

If the user wants MCP servers:

```bash
cp /tmp/pi-dots/pi-dotfiles/.pi/mcp.json ~/.pi/agent/
```

## Step 7: Build extensions (if needed)

Some packages require building before use. If the user selected any of these, run:

```bash
cd /tmp/pi-dots/pi-mcp-access && npm install && npm run build
```

Only `pi-mcp-access` currently needs building. The other packages are pure skills/config.

## Step 8: Verify

Check that installation succeeded:

```bash
# Verify pi can load and see basic commands
pi --eval "/help"

# If MCP was configured, check tools
pi --eval "/mcp tools"

# If user installed pi-agents, check agents are available
pi --eval "/agents"

# If user installed exa-search or deep-research, verify those MCP tools appear in /mcp tools
```

Start pi and check the footer for extension status. Optionally test a newly installed skill based on what was selected:

- `external-scout-and-plan`: `/external-scout-and-plan Build a simple Express rate limiter`
- `quick-setup`: `/quick-setup` (run in a project directory)
- `git-workflow`: `/git-workflow status`
- `provider-models`: `/provider-models list` (if dynamic-model-providers installed)

If anything is missing, check:
- Skills are in `~/.pi/agent/skills/`
- Packages are listed in `~/.pi/agent/settings.json`
- Extensions that need building were compiled (`pi-mcp-access`)
- pi was restarted after installation
