import { Injectable, Optional } from "@nestjs/common";
import type { ChatReply, ChatRequest, MessageLogEntry, AuditLogEntry } from "@agenttwin/core";
import {
  createFileRuntimeStoreRepository,
  type RuntimeStoreRepository,
  type RuntimeStoreSnapshot
} from "./storage-repositories";
import { createStorageProvider } from "./storage-provider";

@Injectable()
export class RuntimeStoreService {
  private readonly repository: RuntimeStoreRepository;
  private readonly ready: Promise<void>;
  private messages: MessageLogEntry[] = [];
  private auditLogs: AuditLogEntry[] = [];

  constructor(@Optional() repositoryOrFilePath?: RuntimeStoreRepository | string) {
    this.repository =
      typeof repositoryOrFilePath === "string"
        ? createFileRuntimeStoreRepository(repositoryOrFilePath)
        : repositoryOrFilePath ?? createStorageProvider().createRuntimeStoreRepository();

    this.ready = this.hydrate();
  }

  async recordConversation(request: ChatRequest, reply: ChatReply) {
    await this.ready;

    const createdAt = new Date().toISOString();

    this.messages.unshift({
      traceId: reply.traceId,
      tenantId: request.tenantId,
      groupId: request.groupId,
      userId: request.userId,
      normalizedText: request.message,
      replyText: reply.replyText,
      replyMode: reply.replyMode,
      confidence: reply.confidence,
      citations: reply.citations,
      riskFlags: reply.riskFlags,
      createdAt
    });

    this.auditLogs.unshift({
      traceId: reply.traceId,
      tenantId: request.tenantId,
      eventType: "chat.reply.generated",
      payload: {
        userId: request.userId,
        groupId: request.groupId,
        replyMode: reply.replyMode,
        citations: reply.citations,
        riskFlags: reply.riskFlags
      },
      createdAt
    });

    await this.persist();
  }

  async getLatestMessages(limit = 10) {
    await this.ready;
    return this.messages.slice(0, limit);
  }

  async getAuditLogs(limit = 10) {
    await this.ready;
    return this.auditLogs.slice(0, limit);
  }

  async recordAuditEvent(tenantId: string, eventType: string, payload: Record<string, unknown>) {
    await this.ready;

    this.auditLogs.unshift({
      traceId: payload.traceId && typeof payload.traceId === "string" ? payload.traceId : "trace_system",
      tenantId,
      eventType,
      payload,
      createdAt: new Date().toISOString()
    });

    await this.persist();
  }

  private async hydrate() {
    const snapshot = await this.repository.load();
    this.messages = snapshot.messages ?? [];
    this.auditLogs = snapshot.auditLogs ?? [];
  }

  private async persist() {
    const snapshot: RuntimeStoreSnapshot = {
      messages: this.messages.slice(0, 200),
      auditLogs: this.auditLogs.slice(0, 200)
    };

    await this.repository.save(snapshot);
  }
}
