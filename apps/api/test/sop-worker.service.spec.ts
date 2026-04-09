import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { MessageDeliveryService } from "../src/message-delivery.service";
import { SopExecutionService } from "../src/sop-execution.service";
import { SopStateService } from "../src/sop-state.service";
import { SopTaskService } from "../src/sop-task.service";
import { SopTemplateService } from "../src/sop-template.service";
import { SopWorkerService } from "../src/sop-worker.service";
import { TemplateRendererService } from "../src/template-renderer.service";

describe("SopWorkerService", () => {
  it("processes pending tasks in a polling cycle", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "agenttwin-sop-worker-"));
    const state = new SopStateService(path.join(tempDir, "sop-state.json"));
    const templates = new SopTemplateService(state);
    const tasks = new SopTaskService(state);
    const deliveries = new MessageDeliveryService(state);
    const execution = new SopExecutionService(state, templates, tasks, deliveries, new TemplateRendererService());
    const worker = new SopWorkerService(tasks, execution);

    await templates.create({
      id: "tpl-001",
      name: "开课提醒",
      channel: "wecom",
      content: "您好，{{student_name}}，请参加 {{lesson_name}}。"
    });

    await tasks.create({
      id: "task-001",
      templateId: "tpl-001",
      scheduleAt: "2026-04-09T09:00:00.000Z",
      deliveryType: "group",
      targetGroupId: "group-demo",
      variables: {
        student_name: "李妈妈",
        lesson_name: "第 1 课"
      }
    });

    const result = await worker.processPendingTasks();

    expect(result.processed).toBe(1);
    expect((await tasks.getById("task-001"))?.status).toBe("sent");
  });

  it("only processes tasks whose schedule time has already arrived", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "agenttwin-sop-worker-due-"));
    const state = new SopStateService(path.join(tempDir, "sop-state.json"));
    const templates = new SopTemplateService(state);
    const tasks = new SopTaskService(state);
    const deliveries = new MessageDeliveryService(state);
    const execution = new SopExecutionService(state, templates, tasks, deliveries, new TemplateRendererService());
    const worker = new SopWorkerService(tasks, execution);

    await templates.create({
      id: "tpl-due",
      name: "到点提醒",
      channel: "wecom",
      content: "您好，{{student_name}}。"
    });

    await tasks.create({
      id: "task-due-001",
      templateId: "tpl-due",
      scheduleAt: "2026-04-09T09:00:00.000Z",
      deliveryType: "group",
      targetGroupId: "group-demo",
      variables: { student_name: "李妈妈" }
    });

    await tasks.create({
      id: "task-due-002",
      templateId: "tpl-due",
      scheduleAt: "2099-04-10T09:00:00.000Z",
      deliveryType: "group",
      targetGroupId: "group-demo",
      variables: { student_name: "王妈妈" }
    });

    const result = await worker.processPendingTasks();

    expect(result.processed).toBe(1);
    expect((await tasks.getById("task-due-001"))?.status).toBe("sent");
    expect((await tasks.getById("task-due-002"))?.status).toBe("pending");
  });
});
