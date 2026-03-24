---
description: Full implementation workflow - scout gathers context, planner creates plan, worker implements
---
Use the subagent tool with the chain parameter to execute this workflow for the following request:

$ARGUMENTS

1. First, use the `scout` agent to find all code relevant to `$ARGUMENTS`.
2. Then, use the `planner` agent to create an implementation plan for `$ARGUMENTS` using the context from the previous step. Use the `{previous}` placeholder.
3. Finally, use the `worker` agent to implement the plan from the previous step. Use the `{previous}` placeholder.

Execute this as a chain and pass output between steps via `{previous}`.
