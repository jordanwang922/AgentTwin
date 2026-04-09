# AgentTwin Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable AgentTwin monorepo foundation with complete project documentation, a working API/admin/worker skeleton, and durable dev-log and handover mechanisms.

**Architecture:** The module uses a local monorepo split into apps, packages, workers, infra, and docs. The API owns the first executable business loop, while packages provide stable contracts for future WeCom, RAG, and LLM integrations. Documentation is treated as a maintained subsystem, not an afterthought.

**Tech Stack:** TypeScript, NestJS, React, Vite, Vitest, SQL scripts, Node.js workspaces

---

### Task 1: Documentation Foundation

**Files:**
- Create: `modules/AgentTwin/README.md`
- Create: `modules/AgentTwin/docs/specs/2026-04-09-agenttwin-monorepo-design.md`
- Create: `modules/AgentTwin/docs/architecture/overview.md`
- Create: `modules/AgentTwin/docs/runbooks/development_workflow.md`
- Create: `modules/AgentTwin/docs/handover/agenttwin_handover.md`
- Create: `modules/AgentTwin/docs/dev-logs/agenttwin_development_log.md`

- [ ] **Step 1: Write the documents with product boundaries and operating rules**

Include:

- monorepo layout
- milestone scope
- handoff expectations
- log rotation policy

- [ ] **Step 2: Review the docs for alignment with the four requirement documents**

Run: `rg -n "WeCom|tenant|knowledge|handover|development log" modules/AgentTwin/docs modules/AgentTwin/README.md`

Expected: matches in the relevant docs proving the core concepts are present.

### Task 2: Workspace and Package Skeleton

**Files:**
- Create: `modules/AgentTwin/package.json`
- Create: `modules/AgentTwin/tsconfig.base.json`
- Create: `modules/AgentTwin/.env.example`
- Create: `modules/AgentTwin/packages/core/package.json`
- Create: `modules/AgentTwin/packages/shared/package.json`
- Create: `modules/AgentTwin/packages/wecom/package.json`
- Create: `modules/AgentTwin/packages/rag/package.json`
- Create: `modules/AgentTwin/packages/llm/package.json`

- [ ] **Step 1: Write the package manifest files**

Include workspace references, build scripts, and local package names using the `@agenttwin/*` namespace.

- [ ] **Step 2: Verify the manifests are parseable**

Run: `node -e "const fs=require('fs'); ['package.json','packages/core/package.json','packages/shared/package.json','packages/wecom/package.json','packages/rag/package.json','packages/llm/package.json'].forEach(p=>JSON.parse(fs.readFileSync('modules/AgentTwin/'+p,'utf8'))); console.log('ok')"`

Expected: `ok`

### Task 3: API Skeleton

**Files:**
- Create: `modules/AgentTwin/apps/api/package.json`
- Create: `modules/AgentTwin/apps/api/tsconfig.json`
- Create: `modules/AgentTwin/apps/api/src/main.ts`
- Create: `modules/AgentTwin/apps/api/src/app.module.ts`
- Create: `modules/AgentTwin/apps/api/src/health.controller.ts`
- Create: `modules/AgentTwin/apps/api/src/wecom.controller.ts`
- Create: `modules/AgentTwin/apps/api/src/chat.controller.ts`
- Create: `modules/AgentTwin/apps/api/src/chat.service.ts`
- Create: `modules/AgentTwin/apps/api/test/chat.service.spec.ts`

- [ ] **Step 1: Write a failing service test for the chat reply contract**

The test should assert that the service returns:

- `replyText`
- `replyMode`
- `confidence`
- `traceId`

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `npm run test --workspace @agenttwin/api -- --runInBand`

Expected: failure before service implementation.

- [ ] **Step 3: Implement the minimal API to satisfy the tests**

Expose:

- `GET /health`
- `GET /wecom/callback`
- `POST /wecom/callback`
- `POST /api/chat`

- [ ] **Step 4: Re-run the API tests**

Run: `npm run test --workspace @agenttwin/api -- --runInBand`

Expected: tests pass.

### Task 4: Admin and Worker Shells

**Files:**
- Create: `modules/AgentTwin/apps/admin/package.json`
- Create: `modules/AgentTwin/apps/admin/index.html`
- Create: `modules/AgentTwin/apps/admin/src/main.tsx`
- Create: `modules/AgentTwin/apps/admin/src/App.tsx`
- Create: `modules/AgentTwin/apps/admin/src/styles.css`
- Create: `modules/AgentTwin/workers/processor/package.json`
- Create: `modules/AgentTwin/workers/processor/src/index.ts`

- [ ] **Step 1: Create a minimal admin shell**

The shell must show the planned sections:

- dashboard
- logs
- channels
- groups
- knowledge
- prompts

- [ ] **Step 2: Create a minimal worker shell**

The worker should boot, print its role, and expose the intended future responsibilities.

- [ ] **Step 3: Verify both build**

Run: `npm run build --workspace @agenttwin/admin && npm run build --workspace @agenttwin/worker`

Expected: both commands exit 0.

### Task 5: Shared Packages and Infrastructure

**Files:**
- Create: `modules/AgentTwin/packages/core/src/contracts.ts`
- Create: `modules/AgentTwin/packages/shared/src/env.ts`
- Create: `modules/AgentTwin/packages/shared/src/trace.ts`
- Create: `modules/AgentTwin/packages/wecom/src/index.ts`
- Create: `modules/AgentTwin/packages/rag/src/index.ts`
- Create: `modules/AgentTwin/packages/llm/src/index.ts`
- Create: `modules/AgentTwin/infra/sql/001_init.sql`
- Create: `modules/AgentTwin/infra/nginx/agenttwin.conf.example`
- Create: `modules/AgentTwin/infra/pm2/ecosystem.config.cjs`

- [ ] **Step 1: Create the shared contracts and stub integrations**

Keep them small and aligned to the first runtime flow.

- [ ] **Step 2: Create the SQL initialization script**

Include the core commercial tables with `tenant_id` where appropriate.

- [ ] **Step 3: Verify TypeScript package builds**

Run: `npm run build --workspace @agenttwin/core && npm run build --workspace @agenttwin/shared && npm run build --workspace @agenttwin/wecom && npm run build --workspace @agenttwin/rag && npm run build --workspace @agenttwin/llm`

Expected: all exit 0.

### Task 6: Dev-Log Rotation and Handover Continuity

**Files:**
- Create: `modules/AgentTwin/infra/scripts/rotate-dev-log.mjs`
- Modify: `modules/AgentTwin/docs/dev-logs/agenttwin_development_log.md`
- Modify: `modules/AgentTwin/docs/handover/agenttwin_handover.md`

- [ ] **Step 1: Implement the rotation script**

It should:

- count lines
- archive the current file if lines exceed 500
- reset the active file with the standard header

- [ ] **Step 2: Document how and when to use the script**

Update the runbook and handover guide.

- [ ] **Step 3: Verify the script runs without rotation**

Run: `npm run log:rotate`

Expected: a message indicating no rotation was needed or the file was rotated successfully.

### Task 7: Full Verification

**Files:**
- Modify: `modules/AgentTwin/README.md`
- Modify: `modules/AgentTwin/docs/dev-logs/agenttwin_development_log.md`
- Modify: `modules/AgentTwin/docs/handover/agenttwin_handover.md`

- [ ] **Step 1: Install dependencies**

Run: `cd modules/AgentTwin && npm install`

- [ ] **Step 2: Run the module verification suite**

Run: `cd modules/AgentTwin && npm run build && npm run test`

Expected: clean build and test exits.

- [ ] **Step 3: Record the result in the development log and handover guide**

Include exact commands run and current status.
