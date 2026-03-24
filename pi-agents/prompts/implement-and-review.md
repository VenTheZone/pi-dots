---
description: Worker implements, reviewer reviews, worker applies feedback
---
Use the subagent tool with the chain parameter to execute this workflow for the user's request.

1. First, use the `worker` agent to implement the user's request.
2. Then, use the `reviewer` agent to review the implementation from the previous step. Use the `{previous}` placeholder.
3. Finally, use the `worker` agent to apply the feedback from the review. Use the `{previous}` placeholder.

Execute this as a chain and pass output between steps via `{previous}`.
