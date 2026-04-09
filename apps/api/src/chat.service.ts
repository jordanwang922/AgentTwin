import { Injectable, Optional } from "@nestjs/common";
import { ChatReplyMode, detectRiskRule, type ChatReply, type ChatRequest } from "@agenttwin/core";
import { generateFallbackReply } from "@agenttwin/llm";
import { resolveKnowledge } from "@agenttwin/rag";
import { createTraceId } from "@agenttwin/shared";
import { DialogueService } from "./dialogue.service";
import { KnowledgeCatalogService } from "./knowledge-catalog.service";
import { LearnerProfileService } from "./learner-profile.service";
import { RoleRoutingService } from "./role-routing.service";
import { RoutingConfigService } from "./routing-config.service";
import { RuntimeStoreService } from "./runtime-store.service";

@Injectable()
export class ChatService {
  private readonly roleRouting: RoleRoutingService;
  private readonly dialogue: DialogueService;
  private readonly learnerProfiles: LearnerProfileService;

  constructor(
    private readonly runtimeStore: RuntimeStoreService,
    private readonly knowledgeCatalog: KnowledgeCatalogService,
    private readonly routingConfig: RoutingConfigService,
    @Optional() roleRouting?: RoleRoutingService,
    @Optional() dialogue?: DialogueService,
    @Optional() learnerProfiles?: LearnerProfileService
  ) {
    this.roleRouting = roleRouting ?? new RoleRoutingService();
    this.dialogue = dialogue ?? new DialogueService();
    this.learnerProfiles = learnerProfiles ?? new LearnerProfileService();
  }

  async process(request: ChatRequest): Promise<ChatReply> {
    const traceId = request.traceId ?? createTraceId();
    const mode = await this.roleRouting.resolveMode({
      userId: request.userId,
      channel: request.channel,
      source: typeof request.context?.source === "string" ? request.context.source : undefined
    });
    const groupConfig = await this.routingConfig.getGroupConfig(request.groupId);
    const tenantProfile = await this.routingConfig.getTenantProfile();
    const normalizedMessage = stripBotMention(request.message, groupConfig.botName);
    const sessionId =
      typeof request.context?.sessionId === "string" ? request.context.sessionId : `${mode}:${request.userId}:${request.groupId}`;

    if (mode === "student") {
      await this.dialogue.append(sessionId, normalizedMessage, "user");
      await this.learnerProfiles.recordInteraction({
        learnerId: typeof request.context?.learnerId === "string" ? request.context.learnerId : request.userId,
        sessionId
      });
    }

    if (!groupConfig.autoReplyEnabled) {
      const disabledReply: ChatReply = {
        replyText: "当前群配置为关闭自动回复，请由人工处理。",
        replyMode: ChatReplyMode.MANUAL_BLOCK,
        confidence: 0.99,
        riskFlags: ["routing:auto_reply_disabled"],
        citations: [],
        latencyMs: 2,
        traceId
      };
      await this.runtimeStore.recordConversation(request, disabledReply);
      return disabledReply;
    }

    if (groupConfig.triggerMode === "mention_only" && !request.message.includes(`@${groupConfig.botName}`)) {
      const mentionReply: ChatReply = {
        replyText: `当前群仅在 @${groupConfig.botName} 时触发自动回复。`,
        replyMode: ChatReplyMode.MANUAL_BLOCK,
        confidence: 0.99,
        riskFlags: ["routing:mention_required"],
        citations: [],
        latencyMs: 2,
        traceId
      };
      await this.runtimeStore.recordConversation(request, mentionReply);
      return mentionReply;
    }

    const normalizedRequest: ChatRequest = {
      ...request,
      message: normalizedMessage
    };
    const recentTurns = mode === "student" ? await this.dialogue.getRecentTurns(sessionId) : [];

    const riskRule = detectRiskRule(normalizedMessage, await this.knowledgeCatalog.getRiskRules());

    if (riskRule) {
      const blockedReply: ChatReply = {
        replyText: riskRule.replyText,
        replyMode: ChatReplyMode.MANUAL_BLOCK,
        confidence: 0.98,
        riskFlags: [riskRule.flag],
        citations: [],
        latencyMs: 4,
        traceId
      };

      await this.runtimeStore.recordConversation(normalizedRequest, blockedReply);
      return blockedReply;
    }

    if (mode === "student" && isPracticeFeedbackRequest(normalizedMessage)) {
      const learnerId =
        typeof request.context?.learnerId === "string" ? request.context.learnerId : request.userId;
      const learnerProfile = await this.learnerProfiles.getProfile(learnerId);
      const feedbackReply: ChatReply = {
        replyText: applyTenantVoice(
          buildPracticeFeedbackReply({
            message: normalizedMessage,
            recentTurns,
            nextLesson: learnerProfile.nextRecommendedLesson
          }),
          tenantProfile.brandName
        ),
        replyMode: ChatReplyMode.AI,
        confidence: 0.88,
        riskFlags: [],
        citations: ["practice://feedback"],
        latencyMs: 6,
        traceId
      };

      await this.runtimeStore.recordConversation(normalizedRequest, feedbackReply);
      await this.dialogue.append(sessionId, feedbackReply.replyText, "assistant");
      return feedbackReply;
    }

    const retrieval = resolveKnowledge(
      normalizedRequest,
      await this.knowledgeCatalog.getFaqEntries(),
      await this.knowledgeCatalog.getArticles()
    );

    if (retrieval.answer) {
      const knowledgeReply: ChatReply = {
        replyText: applyTenantVoice(retrieval.answer, tenantProfile.brandName),
        replyMode: retrieval.mode,
        confidence: retrieval.confidence,
        riskFlags: [],
        citations: retrieval.citations,
        latencyMs: 6,
        traceId
      };

      await this.runtimeStore.recordConversation(normalizedRequest, knowledgeReply);
      if (mode === "student") {
        await this.dialogue.append(sessionId, knowledgeReply.replyText, "assistant");
      }

      return knowledgeReply;
    }

    const reply = generateFallbackReply(normalizedRequest, traceId);
    const finalReply = {
      ...reply,
      replyText: applyTenantVoice(applyStudentContextToReply(reply.replyText, recentTurns), tenantProfile.brandName),
      replyMode: ChatReplyMode.AI
    };

    await this.runtimeStore.recordConversation(normalizedRequest, finalReply);
    if (mode === "student") {
      await this.dialogue.append(sessionId, finalReply.replyText, "assistant");
      const learnerId =
        typeof request.context?.learnerId === "string" ? request.context.learnerId : request.userId;
      if (normalizedMessage.includes("完成") && normalizedMessage.includes("第")) {
        await this.learnerProfiles.recordProgress({
          learnerId,
          lessonId: inferLessonId(normalizedMessage),
          status: "completed"
        });
      }
    }

    return finalReply;
  }
}

function stripBotMention(message: string, botName: string) {
  return message.replaceAll(`@${botName}`, "").trim();
}

function applyTenantVoice(text: string, brandName: string) {
  return `${brandName}：${text}`;
}

function inferLessonId(message: string) {
  const match = message.match(/第\s*(\d+)\s*课/);
  if (!match?.[1]) {
    return "lesson-01";
  }

  return `lesson-${match[1].padStart(2, "0")}`;
}

function isPracticeFeedbackRequest(message: string) {
  return ["反馈", "复盘", "练习", "下一步"].some((keyword) => message.includes(keyword));
}

function buildPracticeFeedbackReply(input: {
  message: string;
  recentTurns: Array<{ role: "user" | "assistant"; message: string }>;
  nextLesson: string;
}) {
  const recentUserContext = input.recentTurns
    .filter((turn) => turn.role === "user")
    .slice(-2)
    .map((turn) => turn.message)
    .join("；");

  return `练习反馈：你这次已经明确提出了具体困扰，可以先肯定孩子当下的努力，再把任务拆小一点。最近提到：${
    recentUserContext || input.message
  }。下一步：今晚先只练一个最小动作，完成后再进入 ${input.nextLesson} 对应的复盘。`;
}

function applyStudentContextToReply(replyText: string, recentTurns: Array<{ role: "user" | "assistant"; message: string }>) {
  const previousUserTurn = [...recentTurns].reverse().find((turn) => turn.role === "user");
  if (!previousUserTurn) {
    return replyText;
  }

  return `${replyText} 结合你刚才提到的“${previousUserTurn.message}”，建议先从一个最小动作开始。`;
}
