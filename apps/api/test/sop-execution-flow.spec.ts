import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { MessageDeliveryService } from "../src/message-delivery.service";
import { SopExecutionService } from "../src/sop-execution.service";
import { SopStateService } from "../src/sop-state.service";
import { SopTaskService } from "../src/sop-task.service";
import { SopTemplateService } from "../src/sop-template.service";
import { TemplateRendererService } from "../src/template-renderer.service";

describe("SOP execution flow", () => {
  it("marks a pending task as executed after the worker processes it", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "agenttwin-sop-execution-"));
    const state = new SopStateService(path.join(tempDir, "sop-state.json"));
    const templateService = new SopTemplateService(state);
    const taskService = new SopTaskService(state);
    const deliveryService = new MessageDeliveryService(state);
    const executionService = new SopExecutionService(state, templateService, taskService, deliveryService, new TemplateRendererService());

    await templateService.create({
      id: "tpl-weekly-review",
      name: "周复盘提醒",
      channel: "wecom",
      content: "您好，{{student_name}}，今天请完成 {{lesson_name}} 复盘。"
    });

    await taskService.create({
      id: "task-001",
      templateId: "tpl-weekly-review",
      scheduleAt: "2026-04-10T09:00:00.000Z",
      deliveryType: "group",
      targetGroupId: "group-demo",
      variables: {
        student_name: "李妈妈",
        lesson_name: "第 3 课"
      }
    });

    const result = await executionService.executeTask("task-001");

    expect(result.status).toBe("sent");
    expect(result.renderedContent).toContain("李妈妈");
  });
});
