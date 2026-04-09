import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ChatReplyMode } from "@agenttwin/core";
import { ChatService } from "../src/chat.service";
import { DialogueService } from "../src/dialogue.service";
import { KnowledgeCatalogService } from "../src/knowledge-catalog.service";
import { LearnerProfileService } from "../src/learner-profile.service";
import { RoleRoutingService } from "../src/role-routing.service";
import { RuntimeStoreService } from "../src/runtime-store.service";
import { RoutingConfigService } from "../src/routing-config.service";

describe("ChatService", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "agenttwin-chat-"));
  const runtimeStore = new RuntimeStoreService(path.join(tempDir, "runtime-store.json"));
  const knowledgeCatalog = new KnowledgeCatalogService(path.join(tempDir, "knowledge-catalog.json"));
  const routingConfig = new RoutingConfigService(path.join(tempDir, "routing-config.json"));
  const service = new ChatService(runtimeStore, knowledgeCatalog, routingConfig);

  it("returns a structured fallback reply for the MVP flow", async () => {
    const result = await service.process({
      tenantId: "tenant-demo",
      channel: "wecom",
      groupId: "group-demo",
      userId: "user-demo",
      message: "@AgentTwin老师 孩子不愿意写作业怎么办？"
    });

    expect(result.replyText).toContain("AgentTwin");
    expect(result.replyMode).toBe(ChatReplyMode.AI);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.traceId).toMatch(/^trace_/);
  });

  it("returns faq mode for an exact high-frequency question", async () => {
    const result = await service.process({
      tenantId: "tenant-demo",
      channel: "wecom",
      groupId: "group-demo",
      userId: "user-demo",
      message: "@AgentTwin老师 上课时间怎么安排？"
    });

    expect(result.replyMode).toBe(ChatReplyMode.FAQ);
    expect(result.citations).toContain("faq://schedule");
    expect(result.replyText).toContain("每周");
  });

  it("returns manual block for sensitive questions", async () => {
    const result = await service.process({
      tenantId: "tenant-demo",
      channel: "wecom",
      groupId: "group-demo",
      userId: "user-demo",
      message: "@AgentTwin老师 孩子有自杀倾向怎么办？"
    });

    expect(result.replyMode).toBe(ChatReplyMode.MANUAL_BLOCK);
    expect(result.riskFlags).toContain("sensitive:self_harm");
  });

  it("returns rag mode when a knowledge article is a better match than fallback", async () => {
    const result = await service.process({
      tenantId: "tenant-demo",
      channel: "wecom",
      groupId: "group-demo",
      userId: "user-demo",
      message: "@AgentTwin老师 孩子写作业拖拉，总是分心，有什么陪伴步骤？"
    });

    expect(result.replyMode).toBe(ChatReplyMode.RAG);
    expect(result.citations).toContain("doc://homework-coaching");
    expect(result.replyText).toContain("拆成");
  });

  it("does not auto reply when the target group is configured as disabled", async () => {
    await routingConfig.updateGroupConfig({
      id: "group-demo",
      groupId: "group-demo",
      name: "家长群演示组",
      autoReplyEnabled: false,
      triggerMode: "mention_only",
      botName: "AgentTwin老师"
    });

    const result = await service.process({
      tenantId: "tenant-demo",
      channel: "wecom",
      groupId: "group-demo",
      userId: "user-demo",
      message: "@AgentTwin老师 上课时间怎么安排？"
    });

    expect(result.replyMode).toBe(ChatReplyMode.MANUAL_BLOCK);
    expect(result.riskFlags).toContain("routing:auto_reply_disabled");
  });

  it("requires a mention when the group trigger mode is mention_only", async () => {
    await routingConfig.updateGroupConfig({
      id: "group-demo",
      groupId: "group-demo",
      name: "家长群演示组",
      autoReplyEnabled: true,
      triggerMode: "mention_only",
      botName: "AgentTwin老师"
    });

    const result = await service.process({
      tenantId: "tenant-demo",
      channel: "wecom",
      groupId: "group-demo",
      userId: "user-demo",
      message: "上课时间怎么安排？"
    });

    expect(result.replyMode).toBe(ChatReplyMode.MANUAL_BLOCK);
    expect(result.riskFlags).toContain("routing:mention_required");
  });

  it("formats replies with the tenant brand role after stripping the bot mention", async () => {
    await routingConfig.updateTenantProfile({
      id: "tenant-demo",
      name: "AgentTwin Demo Tenant",
      brandName: "成长顾问小A",
      replyStyle: "共情 -> 判断 -> 2到3条建议 -> 收尾"
    });
    await routingConfig.updateGroupConfig({
      id: "group-demo",
      groupId: "group-demo",
      name: "家长群演示组",
      autoReplyEnabled: true,
      triggerMode: "mention_only",
      botName: "成长顾问小A"
    });

    const result = await service.process({
      tenantId: "tenant-demo",
      channel: "wecom",
      groupId: "group-demo",
      userId: "user-demo",
      message: "@成长顾问小A 上课时间怎么安排？"
    });

    expect(result.replyMode).toBe(ChatReplyMode.FAQ);
    expect(result.replyText.startsWith("成长顾问小A：")).toBe(true);
    expect(result.replyText).not.toContain("@成长顾问小A");
  });

  it("records conversation logs even when all dependencies are custom async repositories", async () => {
    const customRuntimeStore = new RuntimeStoreService({
      load: jest.fn().mockResolvedValue({ messages: [], auditLogs: [] }),
      save: jest.fn().mockResolvedValue(undefined)
    });
    const customKnowledgeCatalog = new KnowledgeCatalogService({
      load: jest.fn().mockResolvedValue({
        faq: [
          {
            id: "faq-custom",
            question: "怎么测试自定义仓储？",
            aliases: [],
            answer: "先写失败测试，再接统一 repository。",
            citation: "faq://custom"
          }
        ],
        articles: [],
        riskRules: []
      }),
      save: jest.fn().mockResolvedValue(undefined)
    });
    const customRoutingConfig = new RoutingConfigService({
      load: jest.fn().mockResolvedValue({
        tenant: {
          id: "tenant-demo",
          name: "AgentTwin Demo Tenant",
          brandName: "顾问Bot",
          replyStyle: "direct"
        },
        channel: {
          id: "channel-demo",
          type: "wecom",
          name: "企业微信"
        },
        groups: [
          {
            id: "group-demo",
            groupId: "group-demo",
            name: "测试群",
            autoReplyEnabled: true,
            triggerMode: "always",
            botName: "顾问Bot"
          }
        ]
      }),
      save: jest.fn().mockResolvedValue(undefined)
    });
    const customService = new ChatService(customRuntimeStore, customKnowledgeCatalog, customRoutingConfig);

    const result = await customService.process({
      tenantId: "tenant-demo",
      channel: "wecom",
      groupId: "group-demo",
      userId: "user-demo",
      message: "怎么测试自定义仓储？"
    });

    expect(result.replyMode).toBe(ChatReplyMode.FAQ);
    expect((await customRuntimeStore.getLatestMessages(1))[0]?.traceId).toBe(result.traceId);
  });

  it("persists student dialogue turns and lesson progress for student-mode sessions", async () => {
    const studentDialogue = new DialogueService(path.join(tempDir, "dialogue-state.json"));
    const learnerProfiles = new LearnerProfileService(path.join(tempDir, "learner-state.json"));
    const roleRouting = new RoleRoutingService();
    const studentService = new ChatService(
      runtimeStore,
      knowledgeCatalog,
      routingConfig,
      roleRouting,
      studentDialogue,
      learnerProfiles
    );

    await studentService.process({
      tenantId: "tenant-demo",
      channel: "wecom",
      groupId: "group-demo",
      userId: "student-001",
      message: "@成长顾问小A 我已经完成第 3 课了",
      context: {
        sessionId: "session-student-001"
      }
    });

    const turns = await studentDialogue.getRecentTurns("session-student-001");
    const profile = await learnerProfiles.getProfile("student-001");

    expect(turns.length).toBeGreaterThan(0);
    expect(profile.completedLessons).toContain("lesson-03");
  });

  it("uses recent student context and returns structured practice feedback guidance", async () => {
    const dialogue = new DialogueService(path.join(tempDir, "dialogue-feedback-state.json"));
    const learnerProfiles = new LearnerProfileService(path.join(tempDir, "learner-feedback-state.json"));
    const roleRouting = new RoleRoutingService();
    const studentService = new ChatService(runtimeStore, knowledgeCatalog, routingConfig, roleRouting, dialogue, learnerProfiles);

    await studentService.process({
      tenantId: "tenant-demo",
      channel: "wecom",
      groupId: "group-demo",
      userId: "student-009",
      message: "@成长顾问小A 我家孩子 11 岁，最近总拖拉",
      context: {
        sessionId: "session-student-009"
      }
    });

    const result = await studentService.process({
      tenantId: "tenant-demo",
      channel: "wecom",
      groupId: "group-demo",
      userId: "student-009",
      message: "@成长顾问小A 请给我一个练习反馈和下一步建议",
      context: {
        sessionId: "session-student-009"
      }
    });

    expect(result.replyMode).toBe(ChatReplyMode.AI);
    expect(result.replyText).toContain("练习反馈");
    expect(result.replyText).toContain("最近提到");
    expect(result.replyText).toContain("下一步");
  });
});
