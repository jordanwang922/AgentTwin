import { TemplateRendererService } from "../src/template-renderer.service";

describe("TemplateRendererService", () => {
  it("fills SOP template variables from a learner context object", () => {
    const service = new TemplateRendererService();

    const output = service.render("您好，{{student_name}}，今天请完成 {{lesson_name}}。", {
      student_name: "李妈妈",
      lesson_name: "第 3 课"
    });

    expect(output).toBe("您好，李妈妈，今天请完成 第 3 课。");
  });
});
