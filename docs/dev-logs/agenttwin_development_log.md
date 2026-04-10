# AgentTwin Development Log

## Active Log Policy

- Record every meaningful delivery milestone.
- Rotate this file when it exceeds 500 lines.
- Use `npm run log:rotate` from `modules/AgentTwin`.

## Entries

### 2026-04-09 16:10 CST

- Initialized AgentTwin documentation tree under `modules/AgentTwin/docs`.
- Wrote the foundation design spec and implementation plan.
- Established the development log and handover mechanism requirements.

### 2026-04-09 16:32 CST

- Scaffolded the AgentTwin module-local monorepo with `apps`, `packages`, `workers`, `infra`, and `docs`.
- Added workspace manifests, environment example, package boundaries, and root scripts.
- Wrote the first API contract test before implementing the chat service.

### 2026-04-09 16:39 CST

- Implemented the MVP API skeleton with `/health`, `GET/POST /wecom/callback`, and `POST /api/chat`.
- Added shared contracts, WeCom normalization stub, FAQ/RAG stub, and LLM fallback stub.
- Added the admin shell, worker shell, SQL initialization script, PM2 config, and Nginx example.

### 2026-04-09 16:45 CST

- Fixed workspace build sequencing so package builds happen before dependent apps.
- Verified `npm run test` passed for `@agenttwin/api`.
- Verified `npm run build` passed for the whole AgentTwin module.
- Verified `npm run log:rotate` ran successfully and reported that no archive was needed.

### 2026-04-09 16:49 CST

- Re-ran final verification after documentation completion.
- Verified `npm run build` completed successfully across `core`, `shared`, `rag`, `llm`, `wecom`, `api`, `admin`, and `worker`.
- Verified `npm run test` completed successfully with 1 passing API test suite.
- Verified `npm run log:rotate` completed successfully and reported 42 active log lines.

### 2026-04-09 17:06 CST

- Expanded the chat engine from a single fallback path to four paths: sensitive block, FAQ, RAG-style knowledge hit, and AI fallback.
- Added demo FAQ entries, demo knowledge articles, and demo risk rules under `@agenttwin/core`.
- Added runtime message and audit storage plus `/api/admin/overview`, `/api/admin/knowledge`, and `/api/admin/messages`.
- Upgraded the admin app from placeholder cards to a real operations panel that fetches overview, knowledge, risk rules, and runtime message data from the API.

### 2026-04-09 17:10 CST

- Re-ran `npm run test` and confirmed 4 passing API tests.
- Re-ran `npm run build` and confirmed all AgentTwin workspaces build cleanly.
- Re-ran `npm run log:rotate` and confirmed the active development log remains below the 500-line archive threshold at 55 lines.

### 2026-04-09 17:18 CST

- Added file-backed development persistence in `RuntimeStoreService`, writing runtime traces to `data/runtime-store.json` by default.
- Added an API unit test to verify persisted runtime data can be reloaded by a fresh service instance.
- Added `/api/admin/test-chat` and a front-end test console so operators can simulate a question from the admin panel and immediately see the reply path.
- Re-ran API tests and full workspace build successfully after the persistence and testing-console changes.
- Re-ran `npm run log:rotate` and confirmed the active development log remains below the 500-line archive threshold at 62 lines.

### 2026-04-09 17:29 CST

- Added `KnowledgeCatalogService` so FAQ, knowledge articles, and risk rules are now mutable and persisted to `data/knowledge-catalog.json`.
- Switched the chat engine and admin service from static demo arrays to the persisted knowledge catalog.
- Added admin write endpoints for FAQ, articles, and risk rules, and extended the admin UI with forms that save entries and refresh the live catalog.
- Re-ran the full test suite and confirmed 6 passing tests, including the new persisted-knowledge path.
- Re-ran `npm run log:rotate` and confirmed the active development log remains below the 500-line archive threshold at 70 lines.

### 2026-04-09 17:41 CST

- Added `RoutingConfigService` so tenant profile and group trigger rules are now persisted to `data/routing-config.json`.
- Extended the chat engine to enforce auto-reply enablement and mention-only triggering before FAQ/RAG/AI logic.
- Added admin endpoints for routing config and extended the admin UI with editable tenant brand name, bot name, trigger mode, and auto-reply toggle.
- Re-ran the full test suite and confirmed 8 passing tests, including routing-behavior coverage.
- Re-ran `npm run log:rotate` and confirmed the active development log remains below the 500-line archive threshold at 78 lines.

### 2026-04-09 17:50 CST

- Added WeCom XML parsing in the channel adapter for common text-message callback payloads.
- Updated the callback controller so XML-style inbound payloads now normalize into the same internal chat request contract as JSON test payloads.
- Re-ran the full test suite and confirmed 10 passing tests, including the WeCom XML adapter path.
- Re-ran `npm run log:rotate` and confirmed the active development log remains below the 500-line archive threshold at 85 lines.

### 2026-04-09 17:58 CST

- Added a SHA1-based WeCom signature helper for token, timestamp, and nonce verification.
- Updated API bootstrap to register an XML text body parser for `text/xml` and `application/xml`.
- Updated the WeCom verification endpoint to report `verified` when token and signature inputs are present.
- Re-ran the full test suite and confirmed 12 passing tests, including the signature-validation path.
- Re-ran `npm run log:rotate` and confirmed the active development log remains below the 500-line archive threshold at 93 lines.

### 2026-04-09 18:06 CST

- Added WeCom encrypted-message decryption with AES-256-CBC and PKCS#7 unpadding in the channel adapter.
- Verified the decrypt path against the official Enterprise WeCom documentation example payload and expected plaintext.
- Re-ran the full test suite and confirmed 13 passing tests after adding AES decrypt coverage.
- Re-ran `npm run log:rotate` and confirmed the active development log remains below the 500-line archive threshold at 100 lines.

### 2026-04-09 18:13 CST

- Added `resolveWecomCallbackPayload` so plain JSON, plain XML, and encrypted XML callbacks now share one adapter entry point.
- Updated the WeCom callback controller to pass query signature fields into the adapter resolution flow for encrypted callback handling.
- Re-ran the full test suite and confirmed 14 passing tests after covering the unified encrypted callback path.
- Re-ran `npm run log:rotate` and confirmed the active development log remains below the 500-line archive threshold at 107 lines.

### 2026-04-09 18:20 CST

- Added passive XML text reply generation and encrypted passive reply envelope generation for WeCom callbacks.
- Updated the WeCom callback controller so XML requests now return XML responses instead of JSON debug output.
- Re-ran the full test suite and confirmed 16 passing tests after adding passive reply coverage.
- Re-ran `npm run log:rotate` and confirmed the active development log remains below the 500-line archive threshold at 114 lines.

### 2026-04-09 18:31 CST

- Added storage mode resolution and `/api/admin/storage` so the current runtime profile is visible in the admin/API layer.
- Added PostgreSQL bootstrap and demo seed scripts under `infra/sql` and `infra/scripts/bootstrap-postgres.mjs`.
- Added storage-mode tests and re-ran the full suite, confirming 19 passing tests.
- Re-ran `npm run log:rotate` and confirmed the active development log remains below the 500-line archive threshold at 121 lines.

### 2026-04-09 18:38 CST

- Updated the chat engine to strip the configured bot mention before risk checks and retrieval scoring.
- Updated reply formatting so tenant brand role now prefixes generated answers, making tenant configuration visible in actual responses.
- Re-ran the full test suite and confirmed 20 passing tests after adding tenant-voice coverage.
- Re-ran `npm run log:rotate` and confirmed the active development log remains below the 500-line archive threshold at 128 lines.

### 2026-04-09 18:49 CST

- Added a storage provider abstraction with explicit `file` vs `postgres` mode resolution.
- Added backend connectivity reporting so `/api/admin/storage` now shows whether the selected backend is reachable.
- Re-ran the full test suite and confirmed 21 passing tests after adding storage-provider coverage.
- Re-ran `npm run log:rotate` and confirmed the active development log remains below the 500-line archive threshold at 135 lines.

### 2026-04-09 19:08 CST

- Refactored runtime, knowledge, and routing services onto async repository-backed persistence while keeping file-backed local development as the default mode.
- Updated the chat engine and admin service/controller layer to await the shared repository-backed service boundary instead of reading local JSON state synchronously.
- Added regression tests for custom repository injection and confirmed 24 passing API tests.
- Added `infra/sql/003_agenttwin_state.sql` and updated PostgreSQL bootstrap so `postgres` mode has a concrete state table for runtime, knowledge, and routing snapshots.

### 2026-04-09 19:19 CST

- Extended the WeCom adapter to preserve event-style callback metadata including `Event`, `ChangeType`, and `ChatId`.
- Updated the WeCom callback controller so non-text callbacks are acknowledged with `success`, recorded as audit events, and kept out of the chat engine.
- Added controller and adapter regression coverage for ignored WeCom event callbacks and confirmed 26 passing API tests.

### 2026-04-09 19:42 CST

- Read the detailed user-requirement PDF and redefined AgentTwin around direction 1 and direction 2 instead of the earlier chat-foundation-centered positioning.
- Rewrote the main spec so the official product direction is now `统一智能体 + 双角色双入口`, covering `AI 班主任助理` and `学员 AI 学习伴侣`.
- Added a separate gap-analysis and replan document that maps the current implementation against the revised product design and identifies missing domains such as SOP templates, scheduling, active send, learner profiles, and role routing.
- Updated the handover document so the next AI reads the revised spec and gap-analysis document before using the older foundation plan.

### 2026-04-09 19:51 CST

- Added a new primary implementation plan for the revised product direction: teacher-side SOP MVP first, student-side companion foundation second, unified optimization third.
- Updated the handover document so the new unified-assistant implementation plan is the primary execution reference and the old foundation plan is kept only as historical context.

### 2026-04-09 20:24 CST

- Completed the first-pass teacher-side SOP MVP backend, including role-routing service, template rendering, SOP template storage, scheduled task storage, delivery records, and execution records.
- Added teacher-side admin endpoints for template management, task management, task execution, delivery listing, and dashboard summaries.
- Reshaped the admin UI into a teacher operations surface with template creation, task creation, execution controls, delivery logs, and retained student chat testing as a supporting panel.
- Added `infra/sql/004_sop_domain.sql` and updated PostgreSQL bootstrap so SOP templates, tasks, executions, and deliveries now have an explicit schema path.
- Re-ran full verification and confirmed `npm run build` and `npm run test` both pass with 33 API tests green.

### 2026-04-09 20:46 CST

- Added a WeCom active-send helper that covers access-token retrieval and app-message sending, and wired delivery execution to attempt active send when credentials are present.
- Added the `SopWorkerService` polling-cycle processor for pending SOP tasks at the API service layer.
- Implemented student-side foundation services for dialogue continuity and learner progress profiles, and connected the chat service to persist recent turns and simple lesson-completion signals.
- Added a first-pass knowledge-domain boundary with explicit `course`, `faq`, `case`, and `sop_template` domains.
- Re-ran full verification and confirmed `npm run build` and `npm run test` both pass with 38 API tests green.

### 2026-04-09 20:58 CST

- Added a worker-package polling entry that calls the SOP processing API on an interval, so the scheduled-task flow is no longer only reachable through direct service invocation.
- Added learner-profile inspection and pending-task processing endpoints to the admin API, and updated the teacher operations UI to expose both.
- Added a chat-level regression test proving student-mode messages can update learner progress, and re-ran verification with 39 API tests passing.

### 2026-04-09 21:26 CST

- Implemented the Phase 3 linkage layer by extending learner profiles with interaction counts, derived segments, and tags, and by adding a dedicated `TeacherAlertService` that derives follow-up, milestone, and risk-intervention alerts from learner state plus runtime logs.
- Added unified operations APIs for `GET /api/admin/unified-dashboard`, `GET /api/admin/alerts`, and `GET /api/admin/learners`, then updated the admin UI to show learner segmentation, linkage alerts, and cross-role operations metrics alongside the existing SOP panels.
- Re-ran targeted Phase 3 verification with `npm run test --workspace @agenttwin/api -- learner-profile.service.spec.ts teacher-alert.service.spec.ts unified-ops-dashboard.spec.ts`, which passed with 4 tests green.
- Re-ran full verification with `npm run test --workspace @agenttwin/api`, `npm run test`, `npm run build`, and `npm run log:rotate`; the suite now passes with 42 API tests and the active development log remains below the archive threshold at 190 lines.

### 2026-04-09 21:44 CST

- Closed two remaining phase-level gaps by adding teacher-side SOP edit flows for templates and tasks, and by extending student-mode chat with a first-pass practice-feedback guidance path that uses recent dialogue context plus the next-step recommendation.
- Updated the admin surface so teacher operators can put an existing template or task back into the form and save changes without leaving the module.
- Re-ran verification with `npm run test --workspace @agenttwin/api`, `npm run test`, `npm run build`, and `npm run log:rotate`; the suite now passes with 45 API tests and the active development log remains below the archive threshold at 190 lines.

### 2026-04-10 00:18 CST

- Completed real WeCom deployment verification on `https://wecom.51winwin.com`, including HTTPS reachability, callback URL verification, and production `.env` loading on the Aliyun Ubuntu server.
- Fixed two real-integration defects discovered during deployment: `GET /wecom/callback` now returns the raw or decrypted `echostr` required by WeCom URL verification, and API/worker startup now auto-load the module root `.env` file.
- Pushed the deployment fixes to the standalone AgentTwin repository at `https://github.com/jordanwang922/AgentTwin.git` under commits `197a70d` and `7c7b0b4`.
- Verified that the official WeCom self-built app path works for app one-to-one chat: real mobile-side messages now reach AgentTwin, mention-triggered replies work, sensitive-risk interception works, and practice-feedback / next-step suggestions work.
- Verified that the current official self-built app path does **not** make external customer-group `@AgentTwin老师` messages arrive at the backend. Group toolbar entry injection works, but ordinary external-group chat messages do not appear in the app callback channel.
- Confirmed by product/technical review that the official route should now be treated as two separate MVP tracks instead of one unified “group bot” path:
  1. internal-group or official webhook bot for scheduled SOP sends
  2. separate message-receive solution for customer-group auto-reply
- Confirmed that WeCom built-in customer-contact keyword auto-reply is not acceptable for the product goal because it cannot satisfy the full flow of knowledge-base hit, AI fallback, and sensitive-keyword human handoff.
- Paused implementation at the decision point. The next restart should begin from a concrete architecture choice for customer-group auto-reply, with the current likely split being:
  1. official webhook/group-bot path for timed SOP pushing
  2. separate receive/reply path for customer-group Q&A
