# pi-dotfiles-specialist-skills

Optional specialist-role skills for `pi-coding-agent`.

This package keeps the old standalone specialist roles available without putting them in the default skill list.

## Included skills

- `specialist-architect`
- `specialist-build-error-resolver`
- `specialist-code-reviewer`
- `specialist-context7-sdk-compliance`
- `specialist-database-reviewer`
- `specialist-doc-updater`
- `specialist-e2e-runner`
- `specialist-go-build-resolver`
- `specialist-go-reviewer`
- `specialist-planner`
- `specialist-python-reviewer`
- `specialist-refactor-cleaner`
- `specialist-rust-clippy-fmt-check-tester`
- `specialist-rust-reviewer`
- `specialist-security-reviewer`
- `specialist-tdd-guide`

## Install

Project-local:

```bash
pi install ./pi-dotfiles-specialist-skills -l
```

Global:

```bash
pi install ./pi-dotfiles-specialist-skills
```

## Recommendation

If you mainly want task delegation, prefer the bundled agents from `pi-agents`. Install this package if you specifically want the old `/skill:specialist-*` entry points.
