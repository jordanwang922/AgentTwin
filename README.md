# AgentTwin

AgentTwin is a unified AI assistant module for the AI Marketing System. The current product direction is one assistant core serving two modes:

- `AI 班主任助理`
- `学员 AI 学习伴侣`

## Current MVP Capabilities

- `GET /health`: service health
- `GET /wecom/callback`: WeCom URL verification stub
- `POST /wecom/callback`: inbound callback normalization and reply generation, now supporting WeCom-style XML payload parsing
  - signature helper is now implemented for token/timestamp/nonce validation
  - encrypted callback messages can now be decrypted with the official AES-CBC flow
  - the callback controller now resolves plain and encrypted WeCom payloads through one adapter path
  - XML callbacks now receive passive reply XML, and encrypted callbacks can receive encrypted passive reply envelopes
  - non-text and `event` callbacks are now acknowledged without entering the chat engine, and an audit event is recorded instead
- `POST /api/chat`: unified chat-engine entry
- `GET /api/admin/teacher-dashboard`: teacher-side operations summary
- `GET /api/admin/unified-dashboard`: unified teacher + learner linkage dashboard
- `GET /api/admin/alerts`: derived teacher follow-up and risk alerts
- `GET /api/admin/learners`: list learner segments, tags, and progress snapshots
- `GET /api/admin/sop/templates`: list SOP templates
- `POST /api/admin/sop/templates`: create SOP templates with extracted variables
- `POST /api/admin/sop/templates/:templateId`: update SOP templates for teacher-side editing
- `GET /api/admin/sop/tasks`: list scheduled SOP tasks
- `POST /api/admin/sop/tasks`: create scheduled group or private tasks
- `POST /api/admin/sop/tasks/:taskId`: update scheduled tasks for teacher-side editing
- `POST /api/admin/sop/tasks/:taskId/execute`: execute a pending task immediately
- `POST /api/admin/sop/process-pending`: process pending and retryable tasks in one cycle
- `GET /api/admin/sop/deliveries`: list prepared and sent delivery records
- `GET /api/admin/learners/:learnerId`: inspect learner progress profile
- worker-side `SopWorkerService`: process pending SOP tasks in a polling cycle
- WeCom active-send helper: access-token fetch plus app-message send flow
- student dialogue foundation: session-based three-turn context persistence
- student practice-feedback guidance: student-mode chat can now produce structured practice feedback and next-step guidance using recent turns
- learner profile foundation: completed lessons, interaction counts, next-lesson recommendation, and derived segments/tags
- teacher alert derivation: follow-up, milestone, and risk-intervention signals derived from learner state and runtime logs
- knowledge-domain foundation: explicit `course / faq / case / sop_template` domain model
- `GET /api/admin/overview`: runtime admin overview
- `GET /api/admin/knowledge`: demo FAQ, knowledge article, and risk-rule catalog
- `GET /api/admin/messages`: runtime message and audit snapshot
- `POST /api/admin/test-chat`: admin test-console simulation endpoint
- `POST /api/admin/faq`: add a persisted FAQ entry
- `POST /api/admin/articles`: add a persisted knowledge article
- `POST /api/admin/risk-rules`: add a persisted risk rule
- `GET /api/admin/routing`: read persisted tenant and group routing config
- `POST /api/admin/tenant`: update tenant profile
- `POST /api/admin/groups`: update group routing config

## Workspace Layout

- `apps/api`: NestJS API for WeCom transport, unified assistant orchestration, and teacher-side SOP operations
- `apps/admin`: React + Vite teacher operations backend
- `workers/processor`: worker entry for scheduled SOP execution and future async jobs
- `packages/core`: shared DTOs, constants, and contracts
- `packages/shared`: common utilities and environment parsing
- `packages/wecom`: WeCom adapter contracts and placeholder implementations
- `packages/rag`: FAQ and RAG interfaces with stub implementations
- `packages/llm`: model adapter interfaces with stub implementations
- `infra`: SQL, PM2, Nginx, and helper scripts
- `docs`: specs, plans, runbooks, handover, and development logs

## Product Principles

- WeCom is only a channel adapter, not the business core.
- Tenant, channel, group, and knowledge base are first-class configuration entities.
- Logs and audit traces are required in v1.
- The first milestone is teacher-side SOP MVP, followed by the student-side companion foundation, then linkage-oriented unified operations.

## Local Development

Install dependencies:

```bash
npm install
```

Run the core services:

```bash
npm run dev:api
npm run dev:admin
npm run dev:worker
```

Bootstrap PostgreSQL demo tables and seed data:

```bash
npm run db:bootstrap
```

Run basic verification:

```bash
npm run build
npm run test
```

The admin shell expects the API at `http://127.0.0.1:3100` by default. Override with `VITE_AGENTTWIN_API_BASE_URL` if needed.

Development-time runtime data is written to `AGENTTWIN_DATA_DIR/runtime-store.json`. Mutable knowledge and risk configuration are written to `AGENTTWIN_DATA_DIR/knowledge-catalog.json`. Routing and group trigger config are written to `AGENTTWIN_DATA_DIR/routing-config.json`. The default directory is `modules/AgentTwin/data`.
SOP template, task, delivery, and execution state is written to `AGENTTWIN_DATA_DIR/sop-state.json` by default.

Set `AGENTTWIN_STORAGE_MODE=postgres` together with `DATABASE_URL` to move runtime messages, audit logs, knowledge catalog state, and routing configuration onto PostgreSQL-backed repositories. The bootstrap flow now creates `agenttwin_state`, which the repository-backed services use for JSON state persistence while the product is still in MVP mode.
The API storage status endpoint reports whether the selected backend is actually reachable.

Replies now use the configured tenant brand role as a visible prefix, and incoming `@bot` mentions are stripped before FAQ, risk, and knowledge matching so retrieval quality stays stable.
Student-side chat now also persists recent dialogue turns, can record simple lesson-completion progress into learner profiles, and can generate practice-feedback guidance that references recent student context.
Phase 3 now derives learner segments and teacher alerts from those profiles and exposes a unified operations dashboard for cross-role follow-up.

## Documentation Index

- [Product and technical spec](./docs/specs/2026-04-09-agenttwin-monorepo-design.md)
- [Gap analysis and replan](./docs/specs/2026-04-09-agenttwin-gap-analysis-and-replan.md)
- [Primary implementation plan](./docs/plans/2026-04-09-agenttwin-unified-assistant-implementation-plan.md)
- [Historical foundation plan](./docs/plans/2026-04-09-agenttwin-foundation-implementation-plan.md)
- [Architecture overview](./docs/architecture/overview.md)
- [Reference project index](./docs/runbooks/reference_projects.md)
- [Development log](./docs/dev-logs/agenttwin_development_log.md)
- [Handover guide](./docs/handover/agenttwin_handover.md)
- [Development workflow](./docs/runbooks/development_workflow.md)
