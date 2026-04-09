# AgentTwin Unified Assistant Design

## Goal

Redefine AgentTwin as a unified AI product serving two business directions from one core system:

- Direction 1: `AI 班主任助理`
- Direction 2: `学员 AI 学习伴侣`

The product is no longer defined as a single WeCom group auto-reply bot. It is a unified assistant platform with dual-role entrypoints, one shared intelligence core, one shared knowledge system, and one shared operations backend.

## Source Inputs

This design consolidates:

- `/Users/jordanwang/Downloads/AgentTwin_Codex_Brief.md`
- `/Users/jordanwang/Downloads/AgentTwin_Codex_开发文档_商用版.docx`
- `/Users/jordanwang/Downloads/AgentTwin_开源项目参考文档.docx`
- `/Users/jordanwang/Downloads/AgentTwin_终极版Codex开发文档.docx`
- `/Users/jordanwang/Downloads/智慧父母AI产品设计方案-精美版.pdf`

It continues to use these external references as architecture guidance, not as product requirements:

- HuixiangDou: staged group-chat handling, refusal boundaries, conversation hygiene
- LangBot: adapter mindset for future multi-channel support
- ChatGPT-on-WeChat: plugin ergonomics, not business-core design
- FastGPT and MaxKB: knowledge management, retrieval workflow, admin expectations
- wecom-bot-mcp-server documentation: WeCom transport and callback concerns

## Product Positioning

AgentTwin is the implementation carrier for `智慧父母 AI 助手`.

The product serves two kinds of users:

- `班主任`
  Needs standardized SOP automation, task scheduling, message delivery, learner follow-up, and execution visibility.
- `学员`
  Needs always-on parenting guidance, course Q&A, practice feedback, progress support, and lightweight emotional companionship.

These are not two independent products. They are two service modes of one unified assistant brand.

## Core Product Decision

AgentTwin adopts `统一智能体 + 双角色双入口` as the official product direction.

This means:

- one core assistant engine
- one shared knowledge system
- one shared user and learner data layer
- one shared message and audit layer
- different entrypoints, permissions, tasks, and interfaces for teacher-side and student-side users

This follows the PDF conclusion that direction 1 and direction 2 should be merged into one intelligent system instead of being built as isolated agents.

## Scope

This design covers only the first two business directions:

- Direction 1: `AI 班主任助理`
- Direction 2: `学员 AI 学习伴侣`

This design does not yet cover:

- Direction 3: intelligent content operations platform as a standalone product
- Direction 4: learner mutual-help community as a standalone product

Those directions may later reuse the same data and assistant core, but they are out of scope for this design revision.

## Product Structure

### Teacher-Side Product

The teacher-side product is an operations assistant for class teachers and operators.

Its core objective is to remove repetitive SOP execution work so human staff can focus on high-value intervention and personalized care.

The teacher-side P0 capabilities are:

- SOP template library
- scheduled task creation and editing
- group or private message delivery
- variable filling
- execution logs
- failure visibility
- basic teacher-facing operations dashboard

### Student-Side Product

The student-side product is an always-on AI companion for parents and learners in the parenting education flow.

Its core objective is to provide timely course-grounded guidance and lightweight personalized support.

The student-side P0 capabilities are:

- course knowledge Q&A
- FAQ and case-based guidance
- three-turn dialogue continuity
- practice feedback assistance
- basic study-progress tracking
- next-step content recommendation

## Unified Architecture Decision

The module-local monorepo structure remains valid:

```text
AgentTwin/
  apps/
    api/
    admin/
  workers/
    processor/
  packages/
    core/
    shared/
    wecom/
    rag/
    llm/
  infra/
  docs/
```

What changes is the product meaning of the modules:

- `apps/api` is no longer just a chat API. It becomes the unified assistant orchestration layer.
- `apps/admin` is no longer just a developer console. It becomes the teacher-side operations backend.
- `workers/processor` is no longer only a placeholder. It becomes the future execution layer for scheduling, retries, recommendation jobs, and knowledge refresh.

## Runtime Layers

### Entry Layer

Entry layer separates access channels by role:

- teacher entrypoints
  - admin backend
  - enterprise WeCom workbench or operator tooling
- student entrypoints
  - WeCom group and private chat
  - official account or H5
  - future mini program

### Role Routing Layer

This is a new required layer missing in the old design.

It determines:

- who the current user is
- what role the user has
- whether the conversation is in teacher mode or student mode
- which capability chain should run

Without this layer, the product cannot satisfy the merged-agent requirement from the PDF.

### Assistant Core Layer

The unified assistant core contains:

- NLU
- intent classification
- dialogue management
- task execution orchestration
- retrieval and generation

This layer must support both:

- operational intents
  - create task
  - preview template
  - execute send
  - check failed jobs
- learning intents
  - ask course questions
  - request parenting advice
  - ask for next lesson or practice guidance

### Data and Knowledge Layer

The data layer must expand beyond message and FAQ storage.

The required first-class domains are:

- course knowledge base
- SOP template base
- learner profile and progress base
- conversation and audit base
- task and delivery base

### Management Layer

Management becomes a real product layer, not a development-only surface.

The first backend information architecture should include:

- teacher dashboard
- SOP template management
- scheduled task management
- execution log view
- learner profile list
- knowledge management
- message delivery monitor

## Core User Flows

### Teacher Flow

1. Teacher enters admin backend or teacher-side tool.
2. System identifies teacher role.
3. Teacher creates or selects an SOP template.
4. System fills variables such as learner name, stage, lesson, progress, and send time.
5. Teacher schedules or confirms a task.
6. Worker executes delivery at the correct time.
7. System records execution status and exposes result in dashboard and logs.

### Student Flow

1. Student enters WeCom group, private chat, or future learner endpoint.
2. System identifies student role and conversation context.
3. Assistant checks risk and guardrails.
4. Assistant retrieves course knowledge, FAQ, and cases.
5. Assistant returns a branded personalized answer.
6. System stores conversation, audit, and progress signals.
7. Recommendation or follow-up jobs can use those signals later.

## Required Capability Modules

### P0 for Direction 1

- SOP template management
- variable schema and variable filling
- scheduled task management
- message send execution
- delivery result logging
- failure retry and operator visibility

### P0 for Direction 2

- knowledge-grounded Q&A
- three-turn dialogue context
- practice feedback assistance
- basic learner progress recording
- next-step recommendation stub

### Shared P0 Capabilities

- role routing
- tenant and channel configuration
- audit logging
- knowledge management
- WeCom transport
- repository-backed persistence

## Data Model Redesign

The original base tables remain useful:

- `tenants`
- `channels`
- `groups`
- `users`
- `messages`
- `knowledge_bases`
- `knowledge_items`
- `audit_logs`

But they are no longer sufficient for the new product direction.

The redesign requires these additional entities:

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
- `user_tags`
- `knowledge_sources`
- `knowledge_chunks`

The design intent is:

- teacher-side automation uses templates, tasks, and delivery records
- student-side assistance uses sessions, learner profiles, and progress records
- both sides reuse one knowledge and audit system

## Knowledge System Design

The previous design treated knowledge mainly as FAQ plus article retrieval. That is too narrow now.

AgentTwin must support at least these knowledge domains:

- `课程知识库`
  structured curriculum content and standard parenting guidance
- `FAQ 库`
  high-frequency learner questions and standard answers
- `案例库`
  real parenting practice cases and recommended patterns
- `SOP 模板库`
  teacher-side outreach templates for reminders, homework follow-up, care messages, and weekly review

These knowledge domains share one management surface but have different retrieval and usage paths.

## Message and Task System

This is the biggest gap between the old design and the new requirements.

The platform must support both passive and active messaging:

- passive reply
  inbound student message triggers immediate response
- active private send
  teacher or system sends scheduled or manual direct messages
- active group send
  teacher or system sends scheduled or manual group messages

The system therefore needs:

- schedule definition
- execution worker
- idempotency
- retry policy
- execution logs
- send result records

Without this, direction 1 is not implemented in any meaningful sense.

## Backend Design Implications

The admin backend must be redesigned away from a developer test console.

The first backend navigation should become:

- Dashboard
- SOP Templates
- SOP Tasks
- Delivery Logs
- Learners
- Knowledge
- Settings

The backend can still keep an internal test console, but it must no longer be the product center.

## Phase Plan

### Phase 1: Direction 1 MVP

Target:
deliver a real `AI 班主任助理` MVP

Includes:

- SOP template library
- task scheduling
- variable filling
- active send execution
- execution logs
- basic teacher dashboard
- minimal student knowledge Q&A so sent messages and inbound questions are not disconnected

### Phase 2: Direction 2 Foundation

Target:
deliver a real `学员 AI 学习伴侣` foundation

Includes:

- course FAQ and RAG
- three-turn dialogue context
- practice feedback
- basic learner progress tracking
- next-step recommendation

### Phase 3: Unified Optimization

Target:
connect teacher-side and student-side data loops

Includes:

- learner profile generation
- operator alerts for stalled learners
- message effect analysis
- knowledge-card push
- behavior-driven recommendation

## What Changes Relative To The Old Design

The old design over-centered on chat replies and WeCom callback closure.

The new design changes the product center to:

- role-aware unified assistant orchestration
- teacher-side SOP automation
- student-side course-grounded companionship

The previous WeCom callback, audit, routing, and repository work still matters, but it is now infrastructure, not the whole product.

## Quality Bar

- The design must treat teacher-side and student-side as one product with two modes.
- SOP automation is a first-class capability, not a future extra.
- Student Q&A is grounded in course knowledge, not general-purpose chatting.
- Active messaging and task execution are required platform capabilities.
- Role routing and learner data are required architecture elements.
- Documentation, handover, and implementation plans must now align with the unified-agent product direction.

## Self-Review

- The new design follows the PDF requirements for direction 1 and direction 2.
- The design explicitly changes the product center from chat-only to unified assistant orchestration.
- Scope is still controlled: directions 3 and 4 remain out of scope for this revision.
- No placeholder sections remain.
