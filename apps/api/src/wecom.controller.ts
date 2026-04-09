import { Body, Controller, Get, Post, Query, Req } from "@nestjs/common";
import type { ChatRequest } from "@agenttwin/core";
import {
  buildWecomTextReplyXml,
  encryptWecomReply,
  isWecomTextMessage,
  normalizeWecomMessage,
  resolveWecomUrlVerification,
  resolveWecomCallbackPayload,
  verifyWecomUrl
} from "@agenttwin/wecom";
import { ChatService } from "./chat.service";
import { RuntimeStoreService } from "./runtime-store.service";

@Controller("wecom/callback")
export class WecomController {
  constructor(
    private readonly chatService: ChatService,
    private readonly runtimeStore: RuntimeStoreService
  ) {}

  @Get()
  verify(@Query() query: Record<string, string | undefined>) {
    return resolveWecomUrlVerification({
      ...verifyWecomUrl(query),
      token: process.env.WECOM_TOKEN,
      encodingAesKey: process.env.WECOM_AES_KEY,
      receiveId: process.env.WECOM_CORP_ID
    });
  }

  @Post()
  async receive(
    @Body() body: Record<string, unknown> | string,
    @Req() req: { body: unknown },
    @Query() query: Record<string, string | undefined>
  ) {
    const inboundPayload = resolveWecomCallbackPayload({
      body: typeof req.body === "string" ? req.body : typeof body === "object" && body ? body : {},
      msgSignature: query.msg_signature,
      timestamp: query.timestamp,
      nonce: query.nonce,
      token: process.env.WECOM_TOKEN,
      encodingAesKey: process.env.WECOM_AES_KEY,
      receiveId: process.env.WECOM_CORP_ID
    });

    const normalized = normalizeWecomMessage(inboundPayload);

    if (!isWecomTextMessage(inboundPayload)) {
      await this.runtimeStore.recordAuditEvent("demo-tenant", "wecom.callback.ignored", {
        traceId: normalized.traceId,
        msgType: inboundPayload.MsgType ?? "unknown",
        event: inboundPayload.Event ?? null,
        changeType: inboundPayload.ChangeType ?? null,
        fromUserName: inboundPayload.FromUserName ?? null,
        toUserName: inboundPayload.ToUserName ?? null,
        groupId: normalized.groupId
      });

      return typeof req.body === "string" ? "success" : { inbound: normalized, ignored: true };
    }

    const request: ChatRequest = {
      tenantId: normalized.tenantId,
      channel: normalized.channel,
      groupId: normalized.groupId,
      userId: normalized.userId,
      message: normalized.message,
      traceId: normalized.traceId
    };

    const reply = await this.chatService.process(request);

    if (typeof req.body === "string") {
      const plainReplyXml = buildWecomTextReplyXml({
        fromUserName: inboundPayload.ToUserName ?? "agenttwin",
        toUserName: inboundPayload.FromUserName ?? "unknown-user",
        content: reply.replyText
      });

      if (process.env.WECOM_TOKEN && process.env.WECOM_AES_KEY && process.env.WECOM_CORP_ID && query.timestamp && query.nonce) {
        return encryptWecomReply({
          token: process.env.WECOM_TOKEN,
          encodingAesKey: process.env.WECOM_AES_KEY,
          receiveId: process.env.WECOM_CORP_ID,
          replyXml: plainReplyXml,
          timestamp: query.timestamp,
          nonce: query.nonce
        });
      }

      return plainReplyXml;
    }

    return {
      inbound: normalized,
      reply
    };
  }
}
