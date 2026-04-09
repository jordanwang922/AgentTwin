import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { AdminService } from "../src/admin.service";
import { KnowledgeCatalogService } from "../src/knowledge-catalog.service";
import { MessageDeliveryService } from "../src/message-delivery.service";
import { RoutingConfigService } from "../src/routing-config.service";
import { RuntimeStoreService } from "../src/runtime-store.service";
import { SopExecutionService } from "../src/sop-execution.service";
import { SopStateService } from "../src/sop-state.service";
import { SopTaskService } from "../src/sop-task.service";
import { SopTemplateService } from "../src/sop-template.service";
import { SopWorkerService } from "../src/sop-worker.service";
import { StorageService } from "../src/storage.service";
import { TemplateRendererService } from "../src/template-renderer.service";
import { LearnerProfileService } from "../src/learner-profile.service";
import { TeacherAlertService } from "../src/teacher-alert.service";

describe("Admin teacher surface", () => {
  it("returns template, task, and delivery summaries for the teacher dashboard", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "agenttwin-admin-teacher-"));
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
    const learnerProfileService = new LearnerProfileService(path.join(tempDir, "learner-state.json"));
    const teacherAlertService = new TeacherAlertService(learnerProfileService, runtimeStore);

    await templateService.create({
      id: "tpl-001",
      name: "周复盘提醒",
      channel: "wecom",
      content: "您好，{{student_name}}，请完成复盘。"
    });

    await taskService.create({
      id: "task-001",
      templateId: "tpl-001",
      scheduleAt: "2026-04-10T09:00:00.000Z",
      deliveryType: "group",
      targetGroupId: "group-demo"
    });

    await deliveryService.record({
      id: "delivery-001",
      taskId: "task-001",
      channel: "wecom",
      targetType: "group",
      targetId: "group-demo",
      content: "测试发送内容",
      status: "failed"
    });

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
      learnerProfileService,
      teacherAlertService
    );

    const result = await adminService.getTeacherDashboard();

    expect(result).toHaveProperty("pendingTasks");
    expect(result).toHaveProperty("failedDeliveries");
    expect(result).toHaveProperty("templateCount");
    expect(result.pendingTasks).toBe(1);
    expect(result.failedDeliveries).toBe(1);
    expect(result.templateCount).toBe(1);
  });
});
