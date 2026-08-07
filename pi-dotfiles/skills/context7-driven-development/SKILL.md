---
name: context7-driven-development
description: Use when implementing features or debugging issues that involve external libraries, frameworks, or APIs. Always verify with Context7 before writing code.
---

# Context7-Driven Development

## Overview

**Never assume you know the API. Always verify before writing code.**

## Tool Priority Order

Use tools in this order based on what's available locally:

### 1. Local Files (Fastest - use when code exists on disk)
```bash
read /path/to/file          # Read specific files
grep -rn "pattern" dir/     # Search code patterns
find . -name "*.ts"         # Find files by name
bash "ls -la dir/"          # Quick directory listing
```
**Use when:** Repo is cloned, you're working in a project, or files are in `/tmp`

### 2. Exa Web Search (For discovery & solutions)
```
exa_web_search_exa    → General web/code search
exa_crawling_exa      → Read specific URLs
exa_get_code_context_exa → Code examples & docs
```
**Use when:** Finding solutions, discovering repos, searching for error fixes, general web queries

### 3. Context7 (For official library documentation)
```
context7_resolve-library-id → Find library
context7_query-docs → Query specific docs
```
**Use when:** You need authoritative API docs for a known library

### 4. jcodemunch (For deep code analysis)
```
jcodemunch_index_repo → Index a repo for analysis
jcodemunch_search_symbols → Find symbols across codebase
jcodemunch_find_references → Find all usages
jcodemunch_get_dependency_graph → Analyze dependencies
```
**Use when:** Complex cross-reference analysis, find dead code, symbol importance

## When to Use

Use Context7-Driven Development when:
- Writing code that uses external libraries/frameworks
- Fixing bugs involving external code
- Integrating with third-party services
- Upgrading library versions
- Debugging library-specific errors

## Core Workflow

### Implementation Workflow

1. **Check Local First**
   - Is the code already on disk? Use `read`/`grep`/`find`
   - If not, consider `exa_crawling_exa` to fetch the repo or docs page
   - Only then use Context7 for authoritative API docs

2. **Identify Dependencies**
   - Check package.json, Cargo.toml, imports
   - List all external libraries being used

3. **Resolve Library IDs or Documentation Sources**
   - If Context7 tools are available, use:
   ```
   context7_resolve-library-id(libraryName, query)
   ```
   - Otherwise resolve the official docs source manually via project docs, web search, or package documentation
   - Include version if known: `/org/project/v1.2.3`

4. **Query Documentation**
   - If Context7 tools are available, use:
   ```
   context7_query-docs(libraryId, "How to [specific operation]")
   ```
   - Otherwise query the docs manually using your available search/documentation workflow
   - Query BEFORE writing code
   - Query AFTER writing code to verify
   - Be specific: "How to authenticate with JWT in NextAuth.js" not "auth"

5. **Apply to Implementation**
   - Follow documentation patterns exactly
   - Check version compatibility
   - Note breaking changes

### Debugging Workflow

1. **Reproduce & Isolate**
   - Understand error message
   - Identify which library is involved

2. **Search for Solutions**
   - First: `exa_web_search_exa` for error message + fix
   - Second: `context7_query-docs` for official troubleshooting
   - Third: `jcodemunch_find_references` to see how project uses it

3. **Verify Fix**
   - Apply suggested fix
   - Test thoroughly
   - Check for related issues

## Clone-and-Explore Pattern

For deep inspection of external repos:
```bash
# Clone to /tmp for temporary analysis
git clone --depth 1 https://github.com/org/repo /tmp/repo

# Then use local tools
read /tmp/repo/src/important.ts
grep -rn "pattern" /tmp/repo/
find /tmp/repo -name "*.test.ts"
```
**Clean up after:** `rm -rf /tmp/repo`

## Query Best Practices

| Bad Query | Good Query |
|-----------|------------|
| "auth" | "How to authenticate users with JWT in Express.js" |
| "hooks" | "React useEffect cleanup function examples" |
| "database" | "How to connect to PostgreSQL with Prisma ORM" |
| "error" | "Fix ECONNREFUSED in node-fetch retry logic" |

## Red Flags - STOP and Query

- "I know how this works" → You don't. Query docs.
- "This is a common pattern" → Patterns change. Verify.
- "I've used this before" → Memory fails. Check docs.
- "The API is intuitive" → Assumptions cause bugs. Look it up.
- "I'll check after writing" → No. Query first. Always.

## Verification Checklist

Before submitting code:
- [ ] Checked local files first (read/grep/find)
- [ ] Used Exa search for error messages or alternatives
- [ ] Resolved the correct library or docs source
- [ ] Queried Context7 if available, otherwise checked the official docs manually
- [ ] Followed documentation patterns exactly
- [ ] Checked version compatibility
- [ ] Verified again after implementation

## Maximum Queries

- Exa search: use freely for discovery
- Context7: max 3 queries per question
- jcodemunch: index once, then query as needed
- If you still can't find what you need, note the uncertainty

## Examples

### Before (Hallucination Risk)
```typescript
// Assuming API from memory - WRONG
const client = new SomeClient({ apiKey: process.env.KEY });
await client.doSomething({ option: "value" }); // Might not exist!
```

### After (Docs-Driven)
```typescript
// After querying Context7 for SomeClient API
// Learned: v2.0 changed constructor signature
const client = SomeClient.create({
  apiKey: process.env.KEY,
  region: "us-east-1" // Required in v2.0+
});
await client.executeAction({ option: "value" }); // Correct method name
```
