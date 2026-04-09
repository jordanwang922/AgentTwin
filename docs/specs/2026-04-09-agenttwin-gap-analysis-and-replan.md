# AgentTwin Gap Analysis And Replan

## Purpose

This document compares the current AgentTwin implementation with the revised product design defined in:

- `docs/specs/2026-04-09-agenttwin-monorepo-design.md`

Its purpose is to make the gap explicit before the next implementation round starts.

## Current Product Reality

The current module is strongest in these areas:

- WeCom callback handling
- passive reply generation
- basic FAQ and article retrieval
- risk interception
- repository-backed local persistence
- admin-side developer operations surface
- audit and message logging

This means the module is currently closer to:

- a knowledge-first messaging foundation

than to:

- a completed teacher-side SOP assistant
- or a completed unified dual-role product

## Strategic Mismatch

The largest mismatch is not code quality. It is product center mismatch.

Current center:

- inbound message handling
- passive replies
- demo knowledge interaction

Required center after the PDF:

- unified assistant orchestration
- teacher-side SOP automation
- student-side guided learning support
- role-based entry and capability routing

## Gap Summary

### Gap 1: No Role Model

Current state:

- tenant and group config exists
- no explicit teacher vs student role routing exists

Impact:

- the system cannot behave as one assistant with two service modes

Required addition:

- role model
- user-role mapping
- role-aware entrypoint and conversation routing

### Gap 2: No SOP Template Domain

Current state:

- knowledge catalog stores FAQ, articles, and risk rules
- no SOP template library exists

Impact:

- direction 1 cannot be implemented

Required addition:

- SOP template entities
- variable definitions
- template versioning
- template preview and validation

### Gap 3: No Task Scheduling Domain

Current state:

- no task tables
- no schedule engine
- no delivery queue

Impact:

- no timed group send
- no timed private send
- no teacher automation

Required addition:

- scheduled task model
- worker execution flow
- retry logic
- idempotency strategy
- execution logs

### Gap 4: No Active Messaging Capability

Current state:

- strong passive callback support
- no real active send integration

Impact:

- system can answer when asked
- system cannot proactively operate

Required addition:

- WeCom active send adapter
- delivery result capture
- send-status reconciliation

### Gap 5: Backend Is Still A Dev Console

Current state:

- current admin is useful for testing and internal inspection
- current admin is not a teacher-facing operations product

Impact:

- no teacher workflow for template management
- no task list
- no delivery monitoring
- no learner management

Required addition:

- dashboard
- templates page
- tasks page
- delivery logs page
- learners page

### Gap 6: Student-Side Dialogue Is Too Thin

Current state:

- FAQ
- simple retrieval
- fallback reply

Impact:

- insufficient for learner companionship flow described in the PDF

Required addition:

- three-turn dialogue continuity
- practice feedback flow
- recommendation flow
- progress-aware responses

### Gap 7: No Learner Profile Or Progress System

Current state:

- no structured learner profile domain
- no progress tracking domain

Impact:

- no personalized path
- no teacher insight into learner state

Required addition:

- learner profile
- tags
- learning progress
- lesson/stage state

### Gap 8: Knowledge System Too Narrow

Current state:

- one mutable catalog with FAQ, articles, risk rules

Impact:

- cannot cleanly separate course knowledge, FAQ, cases, and SOP templates

Required addition:

- multi-domain knowledge model
- source typing
- chunking and retrieval strategy
- domain-specific management flows

## Current Assets To Preserve

The redesign should not discard these completed assets:

- WeCom signature verification
- WeCom AES decrypt and encrypted reply flow
- plain and encrypted callback adapter
- runtime audit and message repository boundary
- file and postgres storage mode abstraction
- NestJS API skeleton
- React admin shell
- doc, handover, and log system

These should be treated as reusable infrastructure.

## Required Data Model Additions

The next schema revision should add:

- `roles`
- `user_roles`
- `student_profiles`
- `learning_progress`
- `conversation_sessions`
- `conversation_messages`
- `sop_templates`
- `sop_template_versions`
- `sop_tasks`
- `sop_task_targets`
- `task_executions`
- `message_deliveries`
- `knowledge_sources`
- `knowledge_chunks`
- `user_tags`

## Recommended Replan

### Track A: Teacher MVP First

Deliver first:

- SOP templates
- task scheduling
- variable filling
- active send execution
- execution logs
- backend task management

Reason:

- direction 1 is the clearest operational ROI path in the PDF
- it is also the largest gap in the current system

### Track B: Student Foundation Second

Deliver second:

- three-turn dialogue
- course FAQ and RAG
- progress tracking
- next-step recommendation

Reason:

- direction 2 already has some groundwork in the current code
- it can be expanded after direction 1 has a real operating loop

### Track C: Unified Linkage Third

Deliver third:

- teacher alerts driven by learner behavior
- learner cards and profile views
- delivery and response analytics

Reason:

- these require both tracks to exist first

## Priority Table

### P0

- role routing
- SOP templates
- scheduled tasks
- active send integration
- task execution logs
- teacher-side admin redesign

### P1

- three-turn student dialogue
- learner profile
- progress tracking
- next-step recommendation

### P2

- effect analysis
- AI copy optimization
- learner segmentation
- teacher suggestions based on learner behavior

## Planning Consequence

The existing implementation plan is now outdated as the main delivery plan.

It still describes the foundation work that was already useful, but it is no longer sufficient as the product implementation guide.

The next implementation plan should be rewritten around:

1. unified assistant role model
2. teacher-side SOP MVP
3. student-side companion foundation
4. shared data and admin evolution

## Self-Review

- This gap analysis reflects the revised product scope from the PDF.
- It separates missing product capabilities from already completed infrastructure.
- It gives a clear replan direction instead of mixing old and new priorities.
