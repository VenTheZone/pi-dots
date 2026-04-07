---
description: External research + planning workflow. Searches open source projects, clones them to /tmp/, analyzes patterns, then creates implementation plan.
---
Use the subagent tool with the chain parameter to execute this workflow for the following request:

$ARGUMENTS

1. First, use the `external-scout` agent to research external open source implementations of `$ARGUMENTS`. The agent will:
   - Search for relevant projects using exa-search MCP tools
   - Clone promising repos to /tmp/external-scout-<repo>-<timestamp>/
   - Analyze the code and produce a structured report

2. Then, use the `planner` agent to create a detailed implementation plan for `$ARGUMENTS` based on the external research report from the previous step. Use the `{previous}` placeholder to pass the scout report.

Execute this as a chain, pass output between steps via `{previous}`, and return only the final implementation plan.

Notes:
- The external-scout will leave cloned repos in /tmp/ for your review
- The planner should base its plan on the patterns found, not invent from scratch
- Include references to specific repos and code snippets in the plan where applicable