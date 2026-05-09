# Task Plan: pi Caveman Extension

## Goal
Create a pi extension that implements caveman mode - terse communication that reduces token usage while keeping technical accuracy intact. Works with pi-coding-agent.

## Phases

### Phase 1: Requirements & Discovery
- [x] Understand caveman project from GitHub (JuliusBrussee/caveman)
- [x] Identify pi extension API and patterns
- [x] Document findings in findings.md
- **Status:** complete

### Phase 2: Planning & Structure
- [ ] Define extension architecture and interfaces
- [ ] Plan command structure (/caveman, intensity levels)
- [ ] Plan system prompt injection approach
- [ ] Document decisions with rationale
- **Status:** in_progress

### Phase 3: Implementation
- [x] Create extension file: `.pi/extensions/caveman.ts`
- [x] Implement intensity levels (lite/full/ultra/wenyan)
- [x] Implement /caveman command with mode switching
- [x] Implement system prompt modification via before_agent_start
- [x] Add status indicator (setStatus/setWidget)
- [x] Test incrementally
- **Status:** complete

### Phase 4: Testing & Verification
- [x] Test /caveman command
- [x] Test each intensity level
- [x] Verify code compiles (TypeScript check)
- **Status:** complete

### Phase 5: Delivery
- [x] Review all output files
- [x] Ensure deliverables are complete
- [x] Deliver to user
- **Status:** complete

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Use before_agent_start event | This is where we inject system prompt modifications in pi |
| Store mode in session entry | Enables persistence across agent turns |
| Support 4 intensity levels | Matches original caveman: lite, full, ultra, wenyan |
| Default to 'full' | Balanced compression without ultra-terse unreadability |

## Notes
- Update phase status as you progress: pending → in_progress → complete
- Re-read this plan before major decisions
- Log ALL errors - they help avoid repetition
