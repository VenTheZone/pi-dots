---
description: Scout gathers context, planner creates implementation plan (no implementation)
---
Use the subagent tool with the chain parameter to execute this workflow for the following request:

$ARGUMENTS

1. First, use the `scout` agent to find all code relevant to `$ARGUMENTS`.
2. Then, use the `planner` agent to create an implementation plan for `$ARGUMENTS` using the context from the previous step. Use the `{previous}` placeholder.

Execute this as a chain, pass output between steps via `{previous}`, and do not implement anything. Return only the plan.
