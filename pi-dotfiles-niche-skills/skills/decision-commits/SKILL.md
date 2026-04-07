---
name: decision-commits
description: Write commit messages that capture judgment and decision-making, not just change descriptions. Use when the user wants to elevate their commit history from a log to a record of reasoning, trade-offs, and context.
---

# Decision Commits

**Philosophy**: Commit history isn't just a log—it's a record of judgment. A good commit message doesn't just describe *what* changed; it explains *why* it changed, what decisions were made, and what alternatives were considered.

## When to Use

- The user wants to write better commit messages
- Reviewing or rewriting commit history for clarity
- Creating commit templates or guidelines for a team
- When commit messages feel like trivia instead of reasoning
- Establishing a culture of decision capture in commit logs

## Core Principles

### 1. The Commit as Decision Record
Every commit should answer:
- **What problem** was being solved?
- **Why this solution** over alternatives?
- **What trade-offs** were made?
- **Who** (or what context) benefited?

### 2. Three-Part Structure

```
<type>(<scope>): <summary>

<body>

<footer>
```

**Summary** (≤50 chars): What changed (imperative mood)

**Body** (optional): The *why* and *how*
- Problem context
- Considered alternatives
- Trade-offs and rationale
- Who approved / was consulted

**Footer** (optional): References, breaking changes, co-authors

### 3. Information Hierarchy

Front-load the **decision**:
- ❌ Bad: "Add caching to user service"
- ✅ Better: "feat(service): add in-memory cache to user service

We had 3 options:
1. Redis cluster (cost, infrastructure)
2. LRU in-process cache (simple, same-process)
3. No cache (keep it simple, accept DB load)

Chose #2 because:
- Current load: 50 RPS, well within Node memory limits
- Redis infra overhead not justified yet
- Allows easy refactor to distributed cache later (see REFACTOR.md)

Cache invalidates on user update events.

Co-authored-by: @teammate <email>"

---

## Framework: DARE Methodology

For each commit, consider:

### D — Describe the Problem Context
What was happening? What symptoms or metrics indicated a problem?

### A — Alternatives Considered
What other approaches were evaluated? Why were they rejected?

### R — Reasoning & Trade-offs
Why was this particular solution chosen? What costs are being paid now vs later?

### E — Evidence & Impact
How do we know this is an improvement? What's measured? Who benefits?

---

## Decision Capture Templates

### Template 1: Feature Addition
```
feat(scope): brief imperative summary

PROBLEM: [What user pain point or gap existed?]

ALTERNATIVES:
- Option A: [brief] — REJECTED because [reason]
- Option B: [brief] — REJECTED because [reason]

DECISION: Implement [this approach] because [rationale]

TRADE-OFFS:
- Accept: [short-term cost]
- Defer: [future work]
- Avoid: [what we're NOT doing]

IMPACT: [who benefits, measurable change]
- [specific improvement]
```

### Template 2: Refactoring
```
refactor(scope): brief imperative summary

WHY: [Why is this refactor needed? Code smell, testability, performance?]
- Current state: [describe problematic pattern]
- Target state: [desired pattern]

SCOPE: [What files/modules are affected? Boundaries?]

RISK MITIGATION:
- [How was safety verified? Tests? Gradual rollout?]
- [How to roll back if needed?]

References:
- See issue #123
- See ARCHITECTURE.md section on [topic]
```

### Template 3: Bug Fix
```
fix(scope): brief imperative summary

SYMPTOM: [What broke? User-visible or metric?]
- Example: "Users saw 500 errors when..."

ROOT CAUSE: [Why did it happen?]
- Chain of events: [step 1] → [step 2] → [bug]
- Missing assumption: [what we didn't account for]

FIX: [What changed? How does it prevent recurrence?]

VERIFICATION:
- Manual: [how to reproduce before/after]
- Automated: [test added? existing test updated?]

PREVENTION: [Will this happen again? Monitoring? Tests?]
```

### Template 4: Research/Spike
```
spike(scope): brief imperative summary

QUESTION: [What unknown are we investigating?]

APPROACH: [How did we explore? Tools, prototypes, spikes?]

FINDINGS:
- [Key discovery 1]
- [Key discovery 2]

DECISION: [Based on findings, what's the next step?]
- Adopt approach X, because...
- Need more research on Y...
- Reject Z because...

EVIDENCE: [Links to spikes, PRs, docs, benchmarks]
```

---

## Examples: Bad vs Good

### Example 1: API Change

❌ **Weak**:
```
feat: update auth endpoints
```

✅ **Decision-focused**:
```
feat(auth): switch from API keys to JWTs for user auth

PROBLEM: API keys were long-lived (90 days) and couldn't be revoked per-session.
Security incident on 2026-03-15 showed compromised key needed immediate revocation.

ALTERNATIVES:
1. Short-lived API keys (1h expiry) — REJECTED: requires client refetch logic
2. OAuth2 with refresh tokens — REJECTED: too heavy for our mobile clients
3. JWT with short expiry (15m) + refresh endpoint — CHOSEN

DECISION: JWTs give per-session control via blacklist and short expiry.
Refresh tokens allow seamless UX without long-lived credentials.

TRADE-OFFS:
- Accept: Added Redis blacklist lookup on every request (+2ms latency)
- Defer: Key rotation UI for users (tracking issue #456)
- Avoid: Full OAuth2 complexity

IMPACT:
- Can revoke any session immediately on logout/compromise
- Mobile clients get transparent token refresh
- No client-side secret management

Tested load: 1000 RPS benchmark in PR #789 shows <1% latency increase.
```

### Example 2: Refactoring

❌ **Weak**:
```
refactor: move utils to lib
```

✅ **Decision-focused**:
```
refactor(utils): extract pure functions to @repo/utils package

WHY: The utils/ directory became a dumping ground (47 files, mixed concerns).
Testing was difficult because utils imported from server/, app/, tests/ inconsistently.

SCOPE: Moving only pure functions (no DB, no network) to @repo/utils.
Leaving file-system and env-dependent helpers in utils/ (future work).

RISK MITIGATION:
- Added comprehensive test coverage in @repo/utils before moving (coverage: 96%)
- Updated imports in all affected packages in same PR (no intermediate breaking state)
- Added `eslint-plugin-boundaries` to prevent future cross-import regressions

After merge, CI will run full integration tests. If boundary violations detected,
we'll add explicit public APIs in @repo/utils before removal.

Related: See ARCHITECTURE.md "Module Boundaries" section updated in this PR.
```

---

## Integration with Git Workflow

### Commit Templates

Add to `.gitmessage`:
```text
# Please enter the commit message for your changes. Lines starting
# with '#' will be ignored, and an empty message aborts the commit.
#
# On branch feature/auth
# Changes to be committed:
#   modified:   src/auth/service.ts
#
# ------------------------ JUNIOR WRITER ABOVE THIS LINE ------------------------
#
# PROBLEM: [What problem are you solving?]
#
# ALTERNATIVES CONSIDERED:
# - [Option]: [Why not?]
#
# DECISION & RATIONALE:
#
# TRADE-OFFS:
# - Accept:
# - Defer:
# - Avoid:
#
# IMPACT / VERIFICATION:
#
# ------------------------ JUNIOR WRITER BELOW THIS LINE ------------------------
```

### Pre-commit Hook

Use `commitlint` with custom rules:
- Require body for `feat`, `refactor`, `fix` unless summary ≤ 30 chars AND scope present
- Disallow vague words: "stuff", "things", "various", "update"
- Require `PROBLEM:` or `WHY:` section for non-trivial changes

Example `.commitlintrc.json`:
```json
{
  "rules": {
    "body-max-line-length": [2, "always", 100],
    "body-min-length": [1, "always", 10],
    "footer-max-line-length": [2, "always", 100],
    "header-full-stop": [2, "never", "."]
  }
}
```

### Conventional Commits with Decision Weight

Enhance conventional commits with decision clarity:

| Type | Required Body? | Must Capture Decision? |
|------|----------------|-----------------------|
| `feat` | Yes (if > trivial) | Yes — problem, alternatives, rationale |
| `fix` | Yes | Yes — root cause, verification |
| `refactor` | Yes | Yes — why refactor, risk mitigation |
| `docs` | No | No (unless architectural docs) |
| `chore` | No | No |
| `test` | No | No |
| `spike` | Yes | Yes — question, findings, decision |

---

## Decision Capture in Pull Requests

Use commits as building blocks for PR description:

1. Each commit should be a self-contained decision unit
2. PR description aggregates the decisions:
   ```
   This PR comprises N commits, each capturing a specific decision:
   - Commit abc123: "feat(auth): switch to JWTs" — Problem X, chose Y
   - Commit def456: "refactor: extract token service" — Enabled by abc123
   - Commit ghi789: "test: add JWT revocation tests" — Verification of abc123
   ```

3. Link related decisions:
   ```
   See also: #issue456 (future work deferred in commit abc123)
   ```

---

## Code Review Lens

When reviewing commits, ask:

- [ ] Does the message explain **why** or just **what**?
- [ ] Are alternatives documented (so we don't re-litigate)?
- [ ] Are trade-offs explicit?
- [ ] Would someone 6 months from now understand the reasoning?
- [ ] Does the commit stand alone as a decision record?

If answer is "no" to any, request clarification in review.

---

## Long-term Benefits

### Onboarding
New team members read commit history to understand *why* the code is this way, not just *what* it does.

### Incident Post-mortems
When something breaks, commit decisions reveal the assumptions at the time.

### Architecture Evolution
See how and why architectural decisions changed over time.

### Reducing Bus Factor
Decision capture distributes context beyond the original author.

---

## Related Skills

- `git-workflow` — Git operations, branching, PRs (use together!)
- `write-a-skill` — Create skills (meta)
- `improve-codebase-architecture` — Architecture decision records
- `request-refactor-plan` — Refactor planning with decision rationale

---

## Quick Reference Card

```
The Decision Commit Checklist:
□ Does the message explain WHY (not just what)?
□ Are alternatives considered and rejected?
□ Are trade-offs explicit (accept/defer/avoid)?
□ Is there evidence or verification described?
□ Would this be useful reading 6 months from now?

TYPES WITH DECISIONS:
✓ feat, fix, refactor, spike → MUST capture decision
✗ docs, chore, test → usually not needed (unless architectural)
```

---

**Remember**: A commit without judgment is just a changelog entry. A commit with judgment is an institutional memory. Write for the future reader.
