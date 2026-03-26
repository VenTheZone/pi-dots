# pi-dots

Quick setup for pi-coding-agent. Copy what you want.

---

## Copy specific skills

```bash
mkdir -p ~/.pi/agent/skills
cp -r pi-dotfiles/skills/<skill-name> ~/.pi/agent/skills/
```

Available skills in `pi-dotfiles/skills/`:
- brainstorming
- coding-standards
- context7-base-code-review
- context7-driven-development
- humanizer
- iterative-retrieval
- planning-with-files
- security-review
- strategic-compact
- tdd-workflow
- verification-loop
- visual-explainer

Example:
```bash
cp -r pi-dotfiles/skills/tdd-workflow ~/.pi/agent/skills/
cp -r pi-dotfiles/skills/brainstorming ~/.pi/agent/skills/
```

---

## Copy all core skills

```bash
mkdir -p ~/.pi/agent/skills
cp -r pi-dotfiles/skills/* ~/.pi/agent/skills/
```

---

## Copy extra skills

```bash
# 34 niche skills (Docker, Python, Go, etc.)
cp -r pi-dotfiles-niche-skills/skills/* ~/.pi/agent/skills/

# 16 specialist roles
cp -r pi-dotfiles-specialist-skills/skills/* ~/.pi/agent/skills/
```

---

## Copy settings

```bash
cp pi-dotfiles/.pi/settings.json ~/.pi/agent/
cp pi-dotfiles/.pi/mcp.json ~/.pi/agent/
```

---

## Model providers (optional)

```bash
cp examples/dynamic-model-providers.global.example.json ~/.pi/agent/dynamic-model-providers.json
```

Edit to add your API key.

---

## Verify

```bash
pi --eval "/mcp tools"
```

## Commands

See `pi-dotfiles/prompts/commands.md` for all available `/` commands.