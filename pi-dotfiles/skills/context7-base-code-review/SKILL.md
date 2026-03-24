---
name: context7-base-code-review
description: Use when reviewing code or answering programming questions - provides Context7 documentation lookup for accurate, up-to-date API references.
---

# Context7 Code Review Skill

This skill integrates Context7's code-aware search to provide accurate documentation during code reviews and programming tasks.

## Overview

Context7 (context7.com) provides fresh, code-grounded documentation for libraries and frameworks. Use this skill to fetch accurate API references during code reviews.

## Core Integration

### When to Use

- Reviewing code that uses unfamiliar libraries
- Answering questions about library APIs
- Verifying correct usage of frameworks
- Checking updated documentation for breaking changes

### How It Works

**Step 1: Resolve Library ID**
Before querying docs, resolve the library name to a Context7-compatible ID:

```
Context7 library: /mongodb/docs
Context7 library: /vercel/next.js/v14.3.0-canary.87
```

**Step 2: Query Documentation**
Ask specific questions about the library:

```typescript
// Good question
"How to set up authentication with JWT in Express.js"

// Bad question (too vague)
"auth"
```

## Available Libraries

Context7 covers major libraries including:
- React, Next.js, Vue, Angular
- Node.js, Express, NestJS
- Python: Django, Flask, FastAPI
- Go: Standard library, Gin, Echo
- Rust: Actix, Tokio
- And many more...

## Code Review Flow

1. Identify unfamiliar libraries in code
2. If Context7 tools are available in your harness, use `context7_resolve-library-id` to find the library
3. If Context7 tools are available, use `context7_query-docs` to get specific answers
4. Otherwise, use the project's web-search or documentation workflow to fetch the same information manually
5. Apply findings to code review

## Best Practices

- Be specific in queries - ask "how to" questions
- Include version if known for exact docs
- Use library ID format: `/org/project` or `/org/project/version`
- Check for breaking changes in major version upgrades
