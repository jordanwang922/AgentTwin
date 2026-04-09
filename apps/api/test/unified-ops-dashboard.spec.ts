import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { AdminService } from "../src/admin.service";
import { KnowledgeCatalogService } from "../src/knowledge-catalog.service";
import { LearnerProfileService } from "../src/learner-profile.service";
import { MessageDeliveryService } from "../src/message-delivery.service";
import { RoutingConfigService } from "../src/routing-config.service";
import { RuntimeStoreService } from "../src/runtime-store.service";
import { SopExecutionService } from "../src/sop-execution.service";
import { SopStateService } from "../src/sop-state.service";
import { SopTaskService } from "../src/sop-task.service";
import { SopTemplateService } from "../src/sop-template.service";
import { SopWorkerService } from "../src/sop-worker.service";
import { StorageService } from "../src/storage.service";
import { TeacherAlertService } from "../src/teacher-alert.service";
import { TemplateRendererService } from "../src/template-renderer.service";

describe("Unified operations dashboard", () => {
  it("combines learner segments and teacher alerts into a single operations summary", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "agenttwin-unified-ops-"));
    const runtimeStore = new RuntimeStoreService(path.join(tempDir, "runtime-store.json"));
    const knowledgeCatalog = new KnowledgeCatalogService(path.join(tempDir, "knowledge-catalog.json"));
    const routingConfig = new RoutingConfigService(path.join(tempDir, "routing-config.json"));
    const sopState = new SopStateService(path.join(tempDir, "sop-state.json"));
    const templateService = new SopTemplateService(sopState);
    const taskService = new SopTaskService(sopState);
    const deliveryService = new MessageDeliveryService(sopState);
    const executionService = new SopExecutionService(
      sopState,
      templateService,
      taskService,
      deliveryService,
      new TemplateRendererService()
    );
    const workerService = new SopWorkerService(taskService, executionService);
    const learnerProfiles = new LearnerProfileService(path.join(tempDir, "learner-state.json"));
    const teacherAlerts = new TeacherAlertService(learnerProfiles, runtimeStore);
    const adminService = new AdminService(
      runtimeStore,
      knowledgeCatalog,
      routingConfig,
      new StorageService(),
      templateService,
      taskService,
      deliveryService,
      executionService,
      workerService,
      learnerProfiles,
      teacherAlerts
    );

    await learnerProfiles.recordInteraction({
      learnerId: "student-101",
      sessionId: "session-101"
    });
    await learnerProfiles.recordInteraction({
      learnerId: "student-101",
      sessionId: "session-101"
    });
    await learnerProfiles.recordInteraction({
      learnerId: "student-101",
      sessionId: "session-101"
    });
    await learnerProfiles.recordProgress({
      learnerId: "student-102",
      lessonId: "lesson-01",
      status: "completed"
    });
    await runtimeStore.recordAuditEvent("tenant-demo", "chat.reply.generated", {
      traceId: "trace-risk-ops",
      userId: "student-103",
      riskFlags: ["sensitive:self_harm"]
    });

    const dashboard = await adminService.getUnifiedOpsDashboard();

    expect(dashboard.totalLearners).toBe(2);
    expect(dashboard.segmentCounts.needs_follow_up).toBe(1);
    expect(dashboard.segmentCounts.active).toBe(1);
    expect(dashboard.alerts.length).toBeGreaterThan(0);
    expect(dashboard.alerts.some((alert) => alert.type === "risk_intervention")).toBe(true);
  });
});
