import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { KnowledgeCatalogService } from "../src/knowledge-catalog.service";

describe("KnowledgeCatalogService domains", () => {
  it("separates course knowledge, faq, cases, and sop templates by domain", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "agenttwin-knowledge-domain-"));
    const service = new KnowledgeCatalogService(path.join(tempDir, "knowledge-catalog.json"));

    const domains = await service.getDomains();

    expect(domains).toContain("course");
    expect(domains).toContain("faq");
    expect(domains).toContain("case");
    expect(domains).toContain("sop_template");
  });
});
