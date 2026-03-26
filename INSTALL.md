# Install

## 1. Install pi

```bash
npm install -g @mariozechner/pi-coding-agent
```

## 2. Copy skills you want

Copy specific skills or all of them:

```bash
mkdir -p ~/.pi/agent/skills

# One skill
cp -r pi-dotfiles/skills/tdd-workflow ~/.pi/agent/skills/

# All core skills
cp -r pi-dotfiles/skills/* ~/.pi/agent/skills/

# Extra skills (optional)
cp -r pi-dotfiles-niche-skills/skills/* ~/.pi/agent/skills/
cp -r pi-dotfiles-specialist-skills/skills/* ~/.pi/agent/skills/
```

## 3. Copy settings (optional)

```bash
cp pi-dotfiles/.pi/settings.json ~/.pi/agent/
cp pi-dotfiles/.pi/mcp.json ~/.pi/agent/
```

## 4. Verify

```bash
pi --eval "/mcp tools"
```