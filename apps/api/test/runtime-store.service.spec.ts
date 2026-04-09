import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ChatReplyMode, type ChatReply, type ChatRequest } from "@agenttwin/core";
import { RuntimeStoreService } from "../src/runtime-store.service";
import type { RuntimeStoreRepository } from "../src/storage-repositories";

describe("RuntimeStoreService", () => {
  it("persists messages and audit logs to disk so a new instance can load them", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "agenttwin-store-"));
    const filePath = path.join(tempDir, "runtime-store.json");
    const request: ChatRequest = {
      tenantId: "tenant-demo",
      channel: "wecom",
      groupId: "group-demo",
      userId: "user-demo",
      message: "上课时间怎么安排？",
      traceId: "trace_persisted"
    };
    const reply: ChatReply = {
      replyText: "演示回复",
      replyMode: ChatReplyMode.FAQ,
      confidence: 0.9,
      riskFlags: [],
      citations: ["faq://schedule"],
      latencyMs: 5,
      traceId: "trace_persisted"
    };

    const firstStore = new RuntimeStoreService(filePath);
    await firstStore.recordConversation(request, reply);

    const secondStore = new RuntimeStoreService(filePath);

    expect((await secondStore.getLatestMessages(1))[0]?.traceId).toBe("trace_persisted");
    expect((await secondStore.getAuditLogs(1))[0]?.eventType).toBe("chat.reply.generated");
  });

  it("can run on a custom runtime repository instead of direct file paths", async () => {
    const savedSnapshots: Array<{ messages: unknown[]; auditLogs: unknown[] }> = [];
    const repository: RuntimeStoreRepository = {
      load: jest.fn().mockResolvedValue({ messages: [], auditLogs: [] }),
      save: jest.fn().mockImplementation(async (snapshot) => {
        savedSnapshots.push(snapshot);
      })
    };

    const request: ChatRequest = {
      tenantId: "tenant-demo",
      channel: "wecom",
      groupId: "group-demo",
      userId: "user-demo",
      message: "测试 repository 存储",
      traceId: "trace_repository"
    };
    const reply: ChatReply = {
      replyText: "repository reply",
      replyMode: ChatReplyMode.AI,
      confidence: 0.7,
      riskFlags: [],
      citations: [],
      latencyMs: 4,
      traceId: "trace_repository"
    };

    const store = new RuntimeStoreService(repository);

    await store.recordConversation(request, reply);

    expect(repository.load).toHaveBeenCalled();
    expect(savedSnapshots).toHaveLength(1);
    expect((await store.getLatestMessages(1))[0]?.traceId).toBe("trace_repository");
  });
});
