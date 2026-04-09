export declare enum ChatReplyMode {
    FAQ = "faq",
    RAG = "rag",
    AI = "ai",
    MANUAL_BLOCK = "manual_block"
}
export interface NormalizedInboundMessage {
    tenantId: string;
    channel: string;
    groupId: string;
    userId: string;
    message: string;
    traceId: string;
    rawPayload?: unknown;
}
export interface ChatRequest {
    tenantId: string;
    channel: string;
    groupId: string;
    userId: string;
    message: string;
    context?: Record<string, unknown>;
    traceId?: string;
}
export interface ChatReply {
    replyText: string;
    replyMode: ChatReplyMode;
    confidence: number;
    riskFlags: string[];
    citations: string[];
    latencyMs: number;
    traceId: string;
}
