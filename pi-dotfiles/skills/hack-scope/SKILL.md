---
name: hack-scope
description: Use when starting a bug bounty or security assessment. Reads VDP target information to gather scope details and plan the engagement.
---

# Hack-Scope

## Overview

Analyze Vulnerability Disclosure Program (VDP) targets to extract scope boundaries and plan your attack strategy.

## When to Use

**Use for:**
- Starting a new bug bounty engagement
- Reading VDP policy documents
- Understanding what assets are in/out of scope
- Planning reconnaissance strategy

**NOT for:**
- Grayhat/unrestricted testing (use hacker skill instead)
- Testing without explicit scope boundaries
- Production systems without permission

## Workflow

1. **Read VDP Document**
   - Locate the VDP page, security.txt, or policy document
   - Extract: program URL, contact method, response times

2. **Parse Scope**
   ```
   IN-SCOPE:
   - Domains: *.target.com, api.target.com
   - Applications: Mobile apps, web apps
   - APIs: REST, GraphQL endpoints
   - Infrastructure: Specific IP ranges
   
   OUT-OF-SCOPE:
   - Third-party services
   - Physical security
   - Social engineering
   - DoS/DDoS attacks
   ```

3. **Identify Constraints**
   - Rate limits
   - Testing windows
   - Required disclosure timeline
   - Reward structure

4. **Plan Approach**
   - Prioritize high-value in-scope targets
   - Map attack surface based on scope
   - Document what NOT to touch

## Output Format

```markdown
# Scope Analysis: [Target Name]

## Program Details
- URL: [VDP link]
- Contact: [security@target.com]
- Safe Harbor: [Yes/No]

## In-Scope
- Domains: [list]
- Applications: [list]
- APIs: [list]
- Infrastructure: [IP ranges]

## Out-of-Scope
- [List explicit exclusions]

## Attack Surface Map
- [Prioritized list of targets to test]

## Constraints
- Rate limit: [X req/min]
- Testing window: [if any]
- Max severity: [if capped]
```

## Key Rules

- **Respect scope absolutely** - Out-of-scope = hands off
- **Document everything** - Proof of authorized testing
- **Check for updates** - Scope changes frequently
- **Read fine print** - Subdomains, wildcards, exclusions

## Red Flags

- Vague scope definitions → Request clarification
- "Test anything" → Verify before assuming
- No safe harbor → Legal risk, proceed carefully
- Missing contact → May not accept reports
