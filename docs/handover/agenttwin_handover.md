# AgentTwin Handover

## What This Module Is

AgentTwin is a standalone module under `modules/AgentTwin` for a unified AI assistant product. The current official product direction is one assistant core serving two modes:

- `AI 班主任助理`
- `学员 AI 学习伴侣`

## First Documents To Read

1. `README.md`
2. `docs/specs/2026-04-09-agenttwin-monorepo-design.md`
3. `docs/specs/2026-04-09-agenttwin-gap-analysis-and-replan.md`
4. `docs/plans/2026-04-09-agenttwin-unified-assistant-implementation-plan.md`
5. `docs/plans/2026-04-09-agenttwin-foundation-implementation-plan.md`
6. `docs/architecture/overview.md`
7. `docs/dev-logs/agenttwin_development_log.md`

## Current Scope

- unified-agent design has been rewritten around direction 1 and direction 2
- current codebase still mostly implements the old foundation layer
- runnable API skeleton
- teacher-side SOP MVP backend is now implemented in the module
- admin has been reshaped into a first-pass teacher operations surface
- worker now has a polling entry that triggers pending-task processing through the API
- WeCom active-send helper now exists in the channel adapter package
- student dialogue and learner-profile foundation services are now implemented
- Phase 3 linkage services are now implemented for learner segmentation, teacher alerts, and unified operations visibility
- admin now exposes a unified operations surface that combines SOP execution, learner segmentation, and teacher alert visibility
- teacher-side SOP templates and tasks now support update/edit flows through the API and admin surface
- student-mode chat now includes a first-pass practice-feedback reply path that uses recent turns plus next-step recommendation
- shared contracts for WeCom, RAG, and LLM layers
- SQL and infrastructure templates
- development-log rotation mechanism
- demo FAQ and knowledge retrieval flow
- sensitive question interception
- runtime admin overview, knowledge, and message endpoints
- repository-backed development persistence for messages, audits, routing, and mutable knowledge
- repository-backed SOP state for templates, tasks, deliveries, and execution records
- WeCom XML callback parsing for text-message style payloads
- WeCom SHA1 signature helper for callback verification
- WeCom AES-CBC decrypt helper verified against the official example payload
- unified callback adapter path for plain and encrypted WeCom payloads
- passive XML reply builder and encrypted reply envelope helper
- non-text WeCom callbacks are now acknowledged and audited without hitting the chat engine
- PostgreSQL bootstrap script and storage-status endpoint

## Current Status

- revised product design for direction 1 and 2: complete
- gap analysis and replan document: complete
- monorepo scaffolding: complete
- API/admin/worker runnable skeleton: complete
- teacher-side SOP MVP backend: complete
- teacher-side admin MVP surface: complete
- teacher-side worker polling entry: complete
- student-side dialogue and learner foundation: complete at service level
- unified operations linkage layer: complete at MVP level
- build verification: complete
- knowledge-first foundation flow: complete
- runtime foundation admin endpoints: complete
- repository-backed persistence boundary: complete
- student-side companion foundation: complete at first-pass backend level
- Phase 3 unified linkage dashboard and alerts: complete at MVP level
- real integrations: partially stubbed, not production-ready

## How To Continue

1. Install dependencies in `modules/AgentTwin`.
2. Run build and test.
3. Check the development log for the latest verified command output.
4. Read the revised design spec and the gap-analysis document before touching implementation plans.
5. Use `docs/plans/2026-04-09-agenttwin-unified-assistant-implementation-plan.md` as the primary execution plan.
6. Treat `docs/plans/2026-04-09-agenttwin-foundation-implementation-plan.md` as historical context only.
7. Check `docs/runbooks/reference_projects.md` before changing architecture boundaries.
8. For local trace inspection, inspect `data/runtime-store.json` or use the admin panel test console.
9. For local learner-state inspection, inspect `data/learner-state.json` or use `/api/admin/learners`.
10. For local knowledge-state inspection, inspect `data/knowledge-catalog.json` or create entries through the admin forms.
11. For local routing inspection, inspect `data/routing-config.json` or use the routing config panel in admin.
12. For deployment prep, inspect `/api/admin/storage` and run `npm run db:bootstrap` against the target database.

## Constraints

- Do not hard-code tenant or WeCom values.
- Keep WeCom as an adapter, not the core business model.
- Preserve `tenant_id` in core tables.
- Keep handover and development log updated during meaningful changes.

## Known Gaps

- production-grade scheduled worker deployment model
- production-grade active send integration with token caching and delivery reconciliation
- richer learner profile fields beyond the current derived tags and counts
- deeper multi-turn student dialogue orchestration
- knowledge domain management UI and retrieval specialization
- pgvector-backed retrieval and re-ranking
- real model provider integration
- live PostgreSQL environment verification in this repository
- auth and permissions
- materialized analytics or BI export path for Phase 3 metrics

## Latest Verified Commands

- `npm install`
- `npm run test` -> 4 tests passed on 2026-04-09
- `npm run test` -> 8 tests passed on 2026-04-09 after routing-config coverage was added
- `npm run test` -> 21 tests passed on 2026-04-09 after storage provider coverage was added
- `npm run test --workspace @agenttwin/api` -> 24 tests passed on 2026-04-09 after repository-backed service coverage was added
- `npm run test --workspace @agenttwin/api` -> 26 tests passed on 2026-04-09 after WeCom event-callback coverage was added
- `npm run test --workspace @agenttwin/api` -> 33 tests passed on 2026-04-09 after teacher-side SOP MVP coverage was added
- `npm run test --workspace @agenttwin/api` -> 38 tests passed on 2026-04-09 after active-send, dialogue, learner-profile, worker, and knowledge-domain coverage was added
- `npm run test --workspace @agenttwin/api` -> 39 tests passed on 2026-04-09 after chat-level learner progress coverage was added
- `npm run test --workspace @agenttwin/api -- learner-profile.service.spec.ts teacher-alert.service.spec.ts unified-ops-dashboard.spec.ts` -> 4 targeted Phase 3 tests passed on 2026-04-09
- `npm run test --workspace @agenttwin/api` -> 45 tests passed on 2026-04-09 after SOP edit flows and practice-feedback coverage were added
- `npm run test` -> 45 tests passed on 2026-04-09
- `npm run build` -> all workspaces built successfully on 2026-04-09
- `npm run log:rotate` -> no rotation needed, active log at 190 lines
