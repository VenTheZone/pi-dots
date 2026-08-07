---
name: context7-base-code-review
description: Use when reviewing code or answering programming questions - provides Context7 documentation lookup for accurate, up-to-date API references.
---

# Context7 Code Review Skill

This skill integrates Context7's code-aware search to provide accurate documentation during code reviews and programming tasks.

## Overview

Context7 (context7.com) provides fresh, code-grounded documentation for libraries and frameworks. Use this skill to fetch accurate API references during code reviews.

## Tool Priority Order

1. **Local Files** → `read`/`grep`/`find` if code is on disk
2. **Exa Search** → `exa_web_search_exa` for error messages, alternatives, general web queries
3. **Context7** → `context7_query-docs` for authoritative API documentation
4. **jcodemunch** → `jcodemunch_find_references` for cross-reference analysis

## When to Use

- Reviewing code that uses unfamiliar libraries
- Answering questions about library APIs
- Verifying correct usage of frameworks
- Checking updated documentation for breaking changes

## How It Works

**Step 1: Check Local First**
Is the code on disk? Use `read`/`grep`/`find` for fastest results.

**Step 2: Resolve Library ID**
Before querying docs, resolve the library name to a Context7-compatible ID:

```
Context7 library: /mongodb/docs
Context7 library: /vercel/next.js/v14.3.0-canary.87
```

**Step 3: Query Documentation**
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
2. If code is on disk → use `read`/`grep`/`find` first
3. If not local → use `exa_web_search_exa` to find docs/examples
4. For authoritative API docs → use `context7_resolve-library-id` then `context7_query-docs`
5. For usage patterns in your codebase → use `jcodemunch_find_references`
6. Apply findings to code review

## Best Practices

- Check local files before hitting APIs
- Be specific in queries - ask "how to" questions
- Include version if known for exact docs
- Use library ID format: `/org/project` or `/org/project/version`
- Check for breaking changes in major version upgrades
- Use Exa for discovering new libraries or troubleshooting errors
