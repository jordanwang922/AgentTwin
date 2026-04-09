import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { SopStateService } from "../src/sop-state.service";
import { SopTemplateService } from "../src/sop-template.service";

describe("SopTemplateService", () => {
  it("stores a template with variable placeholders and returns a preview-ready model", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "agenttwin-sop-template-"));
    const state = new SopStateService(path.join(tempDir, "sop-state.json"));
    const service = new SopTemplateService(state);

    const template = await service.create({
      id: "tpl-weekly-review",
      name: "周复盘提醒",
      channel: "wecom",
      content: "您好，{{student_name}}，本周请完成 {{lesson_name}} 复盘。"
    });

    expect(template.content).toContain("{{student_name}}");
    expect(template.variables).toContain("student_name");
    expect(template.variables).toContain("lesson_name");
  });

  it("updates a template and refreshes its extracted variables", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "agenttwin-sop-template-update-"));
    const state = new SopStateService(path.join(tempDir, "sop-state.json"));
    const service = new SopTemplateService(state);

    await service.create({
      id: "tpl-update",
      name: "初版模板",
      channel: "wecom",
      content: "您好，{{student_name}}。"
    });

    const template = await service.update({
      id: "tpl-update",
      name: "新版模板",
      content: "您好，{{student_name}}，请完成 {{lesson_name}} 复盘。"
    });

    expect(template.name).toBe("新版模板");
    expect(template.variables).toEqual(expect.arrayContaining(["student_name", "lesson_name"]));
  });

  it("deletes a template from the teacher template library", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "agenttwin-sop-template-delete-"));
    const state = new SopStateService(path.join(tempDir, "sop-state.json"));
    const service = new SopTemplateService(state);

    await service.create({
      id: "tpl-delete",
      name: "删除测试模板",
      channel: "wecom",
      content: "您好，{{student_name}}。"
    });

    await service.remove("tpl-delete");

    expect(await service.getById("tpl-delete")).toBeUndefined();
  });
});
