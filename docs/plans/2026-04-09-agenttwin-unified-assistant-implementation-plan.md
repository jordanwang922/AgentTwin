# AgentTwin Unified Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild AgentTwin around a unified assistant core that first delivers the teacher-side SOP MVP and then extends into the student-side learning companion foundation.

**Architecture:** Keep the existing monorepo and infrastructure foundation, but change the business center from passive chat handling to role-aware orchestration. The API becomes a unified assistant coordinator, the admin becomes a teacher operations backend, and the worker becomes the execution engine for scheduled tasks, retries, and follow-up jobs.

**Tech Stack:** TypeScript, NestJS, React, Vite, PostgreSQL, Node.js workspaces, enterprise messaging adapters, worker-based scheduling

---

### Task 1: Freeze The New Product Baseline

**Files:**
- Modify: `docs/specs/2026-04-09-agenttwin-monorepo-design.md`
- Create: `docs/specs/2026-04-09-agenttwin-gap-analysis-and-replan.md`
- Modify: `docs/handover/agenttwin_handover.md`
- Modify: `docs/dev-logs/agenttwin_development_log.md`

- [ ] **Step 1: Confirm the revised product center is reflected in docs**

Required themes:

- unified assistant
- teacher mode
- student mode
- SOP automation
- learner companion

- [ ] **Step 2: Verify the revised docs mention the new product center**

Run: `rg -n "统一智能体|班主任|学员 AI 学习伴侣|SOP|role routing" docs/specs docs/handover`

Expected: matches in the revised spec and handover docs.

### Task 2: Introduce Role Routing As A First-Class Domain

**Files:**
- Modify: `apps/api/src/chat.service.ts`
- Create: `apps/api/src/role-routing.service.ts`
- Create: `apps/api/src/role-routing.types.ts`
- Modify: `packages/core/src/contracts.ts`
- Test: `apps/api/test/role-routing.service.spec.ts`

- [ ] **Step 1: Write the failing role-routing test**

```ts
it("routes teacher requests into teacher mode and student requests into student mode", async () => {
  const service = new RoleRoutingService();

  expect(await service.resolveMode({ userId: "teacher-001", channel: "admin" })).toBe("teacher");
  expect(await service.resolveMode({ userId: "student-001", channel: "wecom" })).toBe("student");
});
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `npm run test --workspace @agenttwin/api -- --runInBand test/role-routing.service.spec.ts`

Expected: FAIL because the role-routing service does not exist yet.

- [ ] **Step 3: Implement the minimal role-routing contract**

Create explicit mode types:

```ts
export type AssistantMode = "teacher" | "student";

export interface RoleRoutingInput {
  userId: string;
  channel: string;
  source?: string;
}
```

- [ ] **Step 4: Re-run the targeted test**

Run: `npm run test --workspace @agenttwin/api -- --runInBand test/role-routing.service.spec.ts`

Expected: PASS

### Task 3: Create The Teacher-Side SOP Template Domain

**Files:**
- Modify: `packages/core/src/contracts.ts`
- Create: `apps/api/src/sop-template.service.ts`
- Create: `apps/api/src/sop-template.types.ts`
- Create: `apps/api/test/sop-template.service.spec.ts`
- Modify: `apps/api/src/admin.controller.ts`

- [ ] **Step 1: Write the failing SOP-template test**

```ts
it("stores a template with variable placeholders and returns a preview-ready model", async () => {
  const service = new SopTemplateService();

  const template = await service.create({
    id: "tpl-weekly-review",
    name: "周复盘提醒",
    channel: "wecom",
    content: "您好，{{student_name}}，本周请完成 {{lesson_name}} 复盘。"
  });

  expect(template.content).toContain("{{student_name}}");
  expect(template.variables).toContain("student_name");
});
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `npm run test --workspace @agenttwin/api -- --runInBand test/sop-template.service.spec.ts`

Expected: FAIL because the service and template contract do not exist.

- [ ] **Step 3: Implement the minimal template parsing and storage logic**

The service should:

- accept template content
- extract `{{variable_name}}` placeholders
- persist the template through the shared repository boundary

- [ ] **Step 4: Re-run the targeted test**

Run: `npm run test --workspace @agenttwin/api -- --runInBand test/sop-template.service.spec.ts`

Expected: PASS

### Task 4: Add Scheduled Task And Execution Entities

**Files:**
- Modify: `infra/sql/001_init.sql`
- Create: `infra/sql/004_sop_domain.sql`
- Create: `apps/api/src/sop-task.service.ts`
- Create: `apps/api/src/sop-task.types.ts`
- Create: `apps/api/test/sop-task.service.spec.ts`

- [ ] **Step 1: Write the failing SOP-task test**

```ts
it("creates a scheduled SOP task with template reference and target audience", async () => {
  const service = new SopTaskService();

  const task = await service.create({
    id: "task-001",
    templateId: "tpl-weekly-review",
    scheduleAt: "2026-04-10T09:00:00.000Z",
    deliveryType: "group",
    targetGroupId: "group-demo"
  });

  expect(task.status).toBe("pending");
  expect(task.deliveryType).toBe("group");
});
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `npm run test --workspace @agenttwin/api -- --runInBand test/sop-task.service.spec.ts`

Expected: FAIL because the task service does not exist yet.

- [ ] **Step 3: Add the first task-domain schema**

Include:

- `sop_templates`
- `sop_template_versions`
- `sop_tasks`
- `task_executions`
- `message_deliveries`

- [ ] **Step 4: Re-run the targeted test**

Run: `npm run test --workspace @agenttwin/api -- --runInBand test/sop-task.service.spec.ts`

Expected: PASS

### Task 5: Add Variable Filling And Message Rendering

**Files:**
- Create: `apps/api/src/template-renderer.service.ts`
- Create: `apps/api/test/template-renderer.service.spec.ts`
- Modify: `packages/core/src/contracts.ts`

- [ ] **Step 1: Write the failing renderer test**

```ts
it("fills SOP template variables from a learner context object", () => {
  const service = new TemplateRendererService();

  const output = service.render(
    "您好，{{student_name}}，今天请完成 {{lesson_name}}。",
    { student_name: "李妈妈", lesson_name: "第 3 课" }
  );

  expect(output).toBe("您好，李妈妈，今天请完成 第 3 课。");
});
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `npm run test --workspace @agenttwin/api -- --runInBand test/template-renderer.service.spec.ts`

Expected: FAIL because the renderer does not exist yet.

- [ ] **Step 3: Implement minimal variable substitution**

Render only named placeholders in the first version. Missing variables should remain visible or be rejected explicitly.

- [ ] **Step 4: Re-run the targeted test**

Run: `npm run test --workspace @agenttwin/api -- --runInBand test/template-renderer.service.spec.ts`

Expected: PASS

### Task 6: Add Teacher-Side Active Send Pipeline

**Files:**
- Modify: `packages/wecom/src/index.ts`
- Create: `packages/wecom/src/send.ts`
- Create: `apps/api/src/message-delivery.service.ts`
- Create: `apps/api/test/message-delivery.service.spec.ts`

- [ ] **Step 1: Write the failing delivery test**

```ts
it("prepares an active wecom delivery record for a rendered SOP message", async () => {
  const service = new MessageDeliveryService();

  const delivery = await service.prepare({
    taskId: "task-001",
    channel: "wecom",
    targetType: "group",
    targetId: "group-demo",
    content: "测试发送内容"
  });

  expect(delivery.status).toBe("prepared");
  expect(delivery.targetType).toBe("group");
});
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `npm run test --workspace @agenttwin/api -- --runInBand test/message-delivery.service.spec.ts`

Expected: FAIL because no active send preparation flow exists.

- [ ] **Step 3: Implement the minimal active-delivery preparation layer**

The first version may still stub the external send, but it must create:

- delivery intent
- delivery status
- delivery audit trail

- [ ] **Step 4: Re-run the targeted test**

Run: `npm run test --workspace @agenttwin/api -- --runInBand test/message-delivery.service.spec.ts`

Expected: PASS

### Task 7: Make The Worker Execute Pending SOP Tasks

**Files:**
- Modify: `workers/processor/src/index.ts`
- Create: `workers/processor/src/sop-executor.ts`
- Create: `workers/processor/src/worker-context.ts`
- Test: `apps/api/test/sop-execution-flow.spec.ts`

- [ ] **Step 1: Write the failing execution-flow test**

```ts
it("marks a pending task as executed after the worker processes it", async () => {
  const result = await executePendingSopTask({
    taskId: "task-001",
    content: "您好，李妈妈，今天请完成第 3 课复盘。"
  });

  expect(result.status).toBe("sent");
});
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `npm run test --workspace @agenttwin/api -- --runInBand test/sop-execution-flow.spec.ts`

Expected: FAIL because no execution flow exists.

- [ ] **Step 3: Implement the minimal execution worker flow**

The worker should:

- load pending tasks
- render content
- call delivery preparation or send
- store execution result

- [ ] **Step 4: Re-run the targeted test**

Run: `npm run test --workspace @agenttwin/api -- --runInBand test/sop-execution-flow.spec.ts`

Expected: PASS

### Task 8: Redesign The Admin Into A Teacher Operations Backend

**Files:**
- Modify: `apps/admin/src/App.tsx`
- Modify: `apps/admin/src/styles.css`
- Create: `apps/admin/src/types.ts`
- Modify: `apps/api/src/admin.controller.ts`
- Test: `apps/api/test/admin-teacher-surface.spec.ts`

- [ ] **Step 1: Write the failing backend-surface test**

```ts
it("returns template, task, and delivery summaries for the teacher dashboard", async () => {
  const result = await adminService.getTeacherDashboard();

  expect(result).toHaveProperty("pendingTasks");
  expect(result).toHaveProperty("failedDeliveries");
  expect(result).toHaveProperty("templateCount");
});
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `npm run test --workspace @agenttwin/api -- --runInBand test/admin-teacher-surface.spec.ts`

Expected: FAIL because the teacher dashboard contract does not exist.

- [ ] **Step 3: Implement the first teacher-facing admin information architecture**

Sections:

- Dashboard
- SOP Templates
- SOP Tasks
- Delivery Logs
- Learners
- Knowledge

- [ ] **Step 4: Re-run the targeted test**

Run: `npm run test --workspace @agenttwin/api -- --runInBand test/admin-teacher-surface.spec.ts`

Expected: PASS

### Task 9: Add The Student-Side Conversation Foundation

**Files:**
- Modify: `apps/api/src/chat.service.ts`
- Create: `apps/api/src/dialogue.service.ts`
- Create: `apps/api/src/dialogue.types.ts`
- Modify: `apps/api/src/runtime-store.service.ts`
- Test: `apps/api/test/student-dialogue.service.spec.ts`

- [ ] **Step 1: Write the failing three-turn dialogue test**

```ts
it("keeps the last three student turns in the conversation context", async () => {
  const service = new DialogueService();

  await service.append("session-001", "孩子不听话怎么办？");
  await service.append("session-001", "他现在 11 岁。");
  await service.append("session-001", "最近还总顶嘴。");

  const turns = await service.getRecentTurns("session-001");
  expect(turns).toHaveLength(3);
});
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `npm run test --workspace @agenttwin/api -- --runInBand test/student-dialogue.service.spec.ts`

Expected: FAIL because no dialogue service exists.

- [ ] **Step 3: Implement minimal session-based dialogue continuity**

The first version should:

- create session ids
- keep the latest turns
- pass recent turns into the chat engine

- [ ] **Step 4: Re-run the targeted test**

Run: `npm run test --workspace @agenttwin/api -- --runInBand test/student-dialogue.service.spec.ts`

Expected: PASS

### Task 10: Add Learner Profile And Progress Foundation

**Files:**
- Create: `apps/api/src/learner-profile.service.ts`
- Create: `apps/api/src/learner-profile.types.ts`
- Create: `apps/api/test/learner-profile.service.spec.ts`
- Modify: `infra/sql/004_sop_domain.sql`

- [ ] **Step 1: Write the failing learner-profile test**

```ts
it("stores learner progress and returns the next recommended lesson stub", async () => {
  const service = new LearnerProfileService();

  await service.recordProgress({
    learnerId: "student-001",
    lessonId: "lesson-03",
    status: "completed"
  });

  const profile = await service.getProfile("student-001");
  expect(profile.completedLessons).toContain("lesson-03");
  expect(profile.nextRecommendedLesson).toBeDefined();
});
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `npm run test --workspace @agenttwin/api -- --runInBand test/learner-profile.service.spec.ts`

Expected: FAIL because learner profile storage does not exist.

- [ ] **Step 3: Implement minimal learner profile and progress storage**

Include:

- profile shell
- lesson progress list
- recommendation stub

- [ ] **Step 4: Re-run the targeted test**

Run: `npm run test --workspace @agenttwin/api -- --runInBand test/learner-profile.service.spec.ts`

Expected: PASS

### Task 11: Update Knowledge Management To Match The New Product Domains

**Files:**
- Modify: `apps/api/src/knowledge-catalog.service.ts`
- Modify: `packages/core/src/contracts.ts`
- Create: `apps/api/test/knowledge-domain.service.spec.ts`

- [ ] **Step 1: Write the failing knowledge-domain test**

```ts
it("separates course knowledge, faq, cases, and sop templates by domain", async () => {
  const service = new KnowledgeCatalogService();

  const domains = await service.getDomains();

  expect(domains).toContain("course");
  expect(domains).toContain("faq");
  expect(domains).toContain("case");
  expect(domains).toContain("sop_template");
});
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `npm run test --workspace @agenttwin/api -- --runInBand test/knowledge-domain.service.spec.ts`

Expected: FAIL because domain separation is not implemented.

- [ ] **Step 3: Implement domain-aware knowledge storage**

Keep the current repository approach, but split the catalog by domain so teacher-side and student-side retrieval stop sharing one undifferentiated list.

- [ ] **Step 4: Re-run the targeted test**

Run: `npm run test --workspace @agenttwin/api -- --runInBand test/knowledge-domain.service.spec.ts`

Expected: PASS

### Task 12: Full Verification And Transition

**Files:**
- Modify: `README.md`
- Modify: `docs/handover/agenttwin_handover.md`
- Modify: `docs/dev-logs/agenttwin_development_log.md`

- [ ] **Step 1: Run module verification**

Run: `npm run build && npm run test`

Expected: all workspaces build and all test suites pass.

- [ ] **Step 2: Run development-log rotation check**

Run: `npm run log:rotate`

Expected: script reports no rotation or rotates successfully.

- [ ] **Step 3: Update docs with the new implementation baseline**

Record:

- what parts of teacher MVP are complete
- what parts of student foundation are complete
- what still remains for unified optimization
