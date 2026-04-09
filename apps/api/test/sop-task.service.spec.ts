import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { SopStateService } from "../src/sop-state.service";
import { SopTaskService } from "../src/sop-task.service";

describe("SopTaskService", () => {
  it("creates a scheduled SOP task with template reference and target audience", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "agenttwin-sop-task-"));
    const state = new SopStateService(path.join(tempDir, "sop-state.json"));
    const service = new SopTaskService(state);

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

  it("updates task schedule and variables for teacher-side editing", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "agenttwin-sop-task-update-"));
    const state = new SopStateService(path.join(tempDir, "sop-state.json"));
    const service = new SopTaskService(state);

    await service.create({
      id: "task-002",
      templateId: "tpl-weekly-review",
      scheduleAt: "2026-04-10T09:00:00.000Z",
      deliveryType: "private",
      targetUserId: "student-001",
      variables: { lesson_name: "第 2 课" }
    });

    const task = await service.update({
      id: "task-002",
      scheduleAt: "2026-04-11T09:00:00.000Z",
      variables: { lesson_name: "第 3 课" }
    });

    expect(task.scheduleAt).toBe("2026-04-11T09:00:00.000Z");
    expect(task.variables.lesson_name).toBe("第 3 课");
  });

  it("deletes a scheduled task from the queue", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "agenttwin-sop-task-delete-"));
    const state = new SopStateService(path.join(tempDir, "sop-state.json"));
    const service = new SopTaskService(state);

    await service.create({
      id: "task-delete",
      templateId: "tpl-weekly-review",
      scheduleAt: "2026-04-10T09:00:00.000Z",
      deliveryType: "group",
      targetGroupId: "group-demo"
    });

    await service.remove("task-delete");

    expect(await service.getById("task-delete")).toBeUndefined();
  });
});
