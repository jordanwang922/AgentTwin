import { ChatReplyMode, type ChatReply, type ChatRequest } from "@agenttwin/core";

export function generateFallbackReply(request: ChatRequest, traceId: string): ChatReply {
  return {
    replyText: `AgentTwin MVP 回复：已收到你的问题“${request.message}”，当前为演示回复，后续会接入 FAQ、RAG 和真实模型能力。`,
    replyMode: ChatReplyMode.AI,
    confidence: 0.42,
    riskFlags: [],
    citations: [],
    latencyMs: 12,
    traceId
  };
}
