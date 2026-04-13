---
name: eval-harness
description: "Eval-driven development (EDD) framework for defining pass/fail criteria, measuring agent reliability with pass@k metrics, and creating regression test suites. Use when setting up evals for AI-assisted workflows, benchmarking agent performance, or tracking reliability across prompt or model changes."
---

# Eval Harness

Formal evaluation framework implementing eval-driven development (EDD) — treating evals as the unit tests of AI development.

## Workflow

1. **Define evals** — write capability and regression eval definitions with success criteria before coding
2. **Implement** — write code to pass the defined evals
3. **Evaluate** — run code-based and model-based graders against the implementation
4. **Report** — generate pass@k metrics and eval summary
5. **Iterate** — fix failures, re-run evals until pass@3 > 90% for capabilities and pass^3 = 100% for regressions

## Eval Types

### Capability Eval

Tests if the agent can accomplish a new task:

```markdown
[CAPABILITY EVAL: feature-name]
Task: Description of what should be accomplished
Success Criteria:
  - [ ] Criterion 1
  - [ ] Criterion 2
Expected Output: Description of expected result
```

### Regression Eval

Ensures changes don't break existing functionality:

```markdown
[REGRESSION EVAL: feature-name]
Baseline: SHA or checkpoint name
Tests:
  - existing-test-1: PASS/FAIL
  - existing-test-2: PASS/FAIL
Result: X/Y passed (previously Y/Y)
```

## Grader Types

### Code-Based Grader (preferred — deterministic)

```bash
# Check if file contains expected pattern
grep -q "export function handleAuth" src/auth.ts && echo "PASS" || echo "FAIL"

# Check if tests pass
npm test -- --testPathPattern="auth" && echo "PASS" || echo "FAIL"

# Check if build succeeds
npm run build && echo "PASS" || echo "FAIL"
```

### Model-Based Grader (for open-ended outputs)

```markdown
[MODEL GRADER PROMPT]
Evaluate the following code change:
1. Does it solve the stated problem?
2. Is it well-structured?
3. Are edge cases handled?
Score: 1-5 (1=poor, 5=excellent)
Reasoning: [explanation]
```

### Human Grader (for security-critical reviews)

```markdown
[HUMAN REVIEW REQUIRED]
Change: Description of what changed
Reason: Why human review is needed
Risk Level: LOW/MEDIUM/HIGH
```

## Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| pass@1 | First attempt success rate | Baseline measurement |
| pass@3 | At least one success in 3 attempts | > 90% |
| pass^3 | All 3 consecutive trials succeed | 100% for regressions |

## Integration Commands

```
/eval define feature-name    # Create eval definition at .claude/evals/feature-name.md
/eval check feature-name     # Run current evals and report status
/eval report feature-name    # Generate full eval report
```

## Eval Storage

```
.claude/
  evals/
    feature-xyz.md      # Eval definition
    feature-xyz.log     # Eval run history
    baseline.json       # Regression baselines
```

## Report Format

```markdown
EVAL REPORT: feature-xyz
========================
Capability Evals:
  create-user:     PASS (pass@1)
  validate-email:  PASS (pass@2)
  hash-password:   PASS (pass@1)
  Overall:         3/3 passed

Regression Evals:
  login-flow:      PASS
  session-mgmt:    PASS
  Overall:         2/2 passed

Metrics:
  pass@1: 67% (2/3)
  pass@3: 100% (3/3)

Status: READY FOR REVIEW
```

## Best Practices

1. **Define evals BEFORE coding** — forces clear success criteria
2. **Use code graders when possible** — deterministic beats probabilistic
3. **Run evals frequently** — catch regressions early
4. **Track pass@k over time** — monitor reliability trends
5. **Keep evals fast** — slow evals don't get run
6. **Version evals with code** — evals are first-class artifacts
7. **Human review for security** — never fully automate security checks
