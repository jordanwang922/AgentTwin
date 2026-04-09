import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ChatReplyMode } from "@agenttwin/core";
import { ChatService } from "../src/chat.service";
import { KnowledgeCatalogService } from "../src/knowledge-catalog.service";
import { RuntimeStoreService } from "../src/runtime-store.service";
import { RoutingConfigService } from "../src/routing-config.service";
import type { KnowledgeCatalogRepository } from "../src/storage-repositories";

describe("KnowledgeCatalogService", () => {
  it("persists newly added faq entries and lets the chat engine use them immediately", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "agenttwin-knowledge-"));
    const catalogPath = path.join(tempDir, "knowledge-catalog.json");
    const storePath = path.join(tempDir, "runtime-store.json");
    const routingPath = path.join(tempDir, "routing-config.json");
    const knowledgeCatalog = new KnowledgeCatalogService(catalogPath);
    const runtimeStore = new RuntimeStoreService(storePath);
    const routingConfig = new RoutingConfigService(routingPath);
    const chatService = new ChatService(runtimeStore, knowledgeCatalog, routingConfig);

    await knowledgeCatalog.addFaqEntry({
      id: "faq-homework-start",
      question: "孩子总是不肯开始写作业怎么办？",
      aliases: ["不肯开始写作业怎么办", "怎么让孩子开始写作业"],
      answer: "先把启动动作缩成 3 分钟任务，例如先拿出作业本、写日期、只做第一题。",
      citation: "faq://homework-start"
    });

    const result = await chatService.process({
      tenantId: "tenant-demo",
      channel: "wecom",
      groupId: "group-demo",
      userId: "user-demo",
      message: "@AgentTwin老师 孩子总是不肯开始写作业怎么办？"
    });

    expect(result.replyMode).toBe(ChatReplyMode.FAQ);
    expect(result.citations).toContain("faq://homework-start");

    const reloadedCatalog = new KnowledgeCatalogService(catalogPath);
    expect((await reloadedCatalog.getFaqEntries()).some((entry) => entry.id === "faq-homework-start")).toBe(true);
  });

  it("supports custom knowledge repositories so postgres-backed implementations can reuse the same service", async () => {
    const repository: KnowledgeCatalogRepository = {
      load: jest.fn().mockResolvedValue({
        faq: [],
        articles: [],
        riskRules: []
      }),
      save: jest.fn().mockResolvedValue(undefined)
    };

    const service = new KnowledgeCatalogService(repository);

    await service.addFaqEntry({
      id: "faq-repository",
      question: "如何走 repository？",
      aliases: [],
      answer: "通过统一仓储接口加载 FAQ。",
      citation: "faq://repository"
    });

    const faqEntries = await service.getFaqEntries();

    expect(repository.load).toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalled();
    expect(faqEntries.some((entry) => entry.id === "faq-repository")).toBe(true);
  });
});
