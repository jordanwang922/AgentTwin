import type { NormalizedInboundMessage } from "@agenttwin/core";
import crypto from "node:crypto";
import { createTraceId } from "@agenttwin/shared";
export * from "./send";

export interface WecomVerificationResult {
  echostr: string;
  msgSignature?: string;
  timestamp?: string;
  nonce?: string;
}

export interface WecomUrlVerificationInput {
  echostr?: string;
  msgSignature?: string;
  timestamp?: string;
  nonce?: string;
  token?: string;
  encodingAesKey?: string;
  receiveId?: string;
}

export interface WecomCallbackPayload {
  ToUserName?: string;
  FromUserName?: string;
  Content?: string;
  MsgType?: string;
  MsgId?: string;
  CreateTime?: string;
  Encrypt?: string;
  Event?: string;
  ChangeType?: string;
  AgentID?: string;
  ChatId?: string;
  ConversationType?: string;
  raw?: unknown;
}

export interface WecomDecryptInput {
  token: string;
  encodingAesKey: string;
  receiveId: string;
  msgSignature: string;
  timestamp: string;
  nonce: string;
  encrypted: string;
}

export interface ResolveWecomCallbackInput {
  body: string | Record<string, unknown>;
  msgSignature?: string;
  timestamp?: string;
  nonce?: string;
  token?: string;
  encodingAesKey?: string;
  receiveId?: string;
}

export interface EncryptWecomReplyInput {
  token: string;
  encodingAesKey: string;
  receiveId: string;
  replyXml: string;
  timestamp: string;
  nonce: string;
}

export interface BuildWecomTextReplyInput {
  fromUserName: string;
  toUserName: string;
  content: string;
  createTime?: number;
}

export function verifyWecomUrl(query: Record<string, string | undefined>): WecomVerificationResult {
  return {
    echostr: query.echostr ?? "agenttwin-wecom-ok",
    msgSignature: query.msg_signature,
    timestamp: query.timestamp,
    nonce: query.nonce
  };
}

export function resolveWecomUrlVerification(input: WecomUrlVerificationInput): string {
  const echostr = input.echostr ?? "agenttwin-wecom-ok";

  if (
    input.echostr &&
    input.msgSignature &&
    input.timestamp &&
    input.nonce &&
    input.token &&
    input.encodingAesKey &&
    input.receiveId
  ) {
    return decryptWecomMessage({
      token: input.token,
      encodingAesKey: input.encodingAesKey,
      receiveId: input.receiveId,
      msgSignature: input.msgSignature,
      timestamp: input.timestamp,
      nonce: input.nonce,
      encrypted: input.echostr
    });
  }

  return echostr;
}

export function verifyWecomSignature(
  token: string,
  timestamp: string,
  nonce: string,
  signature: string,
  msgEncrypt?: string
): boolean {
  const sorted = [token, timestamp, nonce, msgEncrypt].filter(Boolean).sort().join("");
  const digest = crypto.createHash("sha1").update(sorted).digest("hex");
  return digest === signature;
}

export function normalizeWecomMessage(payload: WecomCallbackPayload): NormalizedInboundMessage {
  return {
    tenantId: "demo-tenant",
    channel: "wecom",
    groupId: payload.ChatId ?? payload.ToUserName ?? "unknown-group",
    userId: payload.FromUserName ?? "unknown-user",
    message: payload.Content ?? buildWecomEventSummary(payload),
    traceId: createTraceId(),
    rawPayload: payload.raw ?? payload
  };
}

export function parseWecomXmlPayload(xml: string): WecomCallbackPayload {
  const fields = [
    "ToUserName",
    "FromUserName",
    "Content",
    "MsgType",
    "MsgId",
    "CreateTime",
    "Encrypt",
    "Event",
    "ChangeType",
    "AgentID",
    "ChatId",
    "ConversationType"
  ] as const;
  const payload: WecomCallbackPayload = {
    raw: xml
  };

  for (const field of fields) {
    const value = extractXmlValue(xml, field);
    if (value) {
      payload[field] = value;
    }
  }

  return payload;
}

export function resolveWecomCallbackPayload(input: ResolveWecomCallbackInput): WecomCallbackPayload {
  if (typeof input.body !== "string") {
    return {
      ToUserName: typeof input.body.ToUserName === "string" ? input.body.ToUserName : undefined,
      FromUserName: typeof input.body.FromUserName === "string" ? input.body.FromUserName : undefined,
      Content: typeof input.body.Content === "string" ? input.body.Content : undefined,
      MsgType: typeof input.body.MsgType === "string" ? input.body.MsgType : undefined,
      MsgId: typeof input.body.MsgId === "string" ? input.body.MsgId : undefined,
      Encrypt: typeof input.body.Encrypt === "string" ? input.body.Encrypt : undefined,
      Event: typeof input.body.Event === "string" ? input.body.Event : undefined,
      ChangeType: typeof input.body.ChangeType === "string" ? input.body.ChangeType : undefined,
      AgentID: typeof input.body.AgentID === "string" ? input.body.AgentID : undefined,
      ChatId: typeof input.body.ChatId === "string" ? input.body.ChatId : undefined,
      ConversationType: typeof input.body.ConversationType === "string" ? input.body.ConversationType : undefined,
      raw: input.body
    };
  }

  const parsed = parseWecomXmlPayload(input.body);

  if (
    parsed.Encrypt &&
    input.msgSignature &&
    input.timestamp &&
    input.nonce &&
    input.token &&
    input.encodingAesKey &&
    input.receiveId
  ) {
    const decrypted = decryptWecomMessage({
      token: input.token,
      encodingAesKey: input.encodingAesKey,
      receiveId: input.receiveId,
      msgSignature: input.msgSignature,
      timestamp: input.timestamp,
      nonce: input.nonce,
      encrypted: parsed.Encrypt
    });

    return parseWecomXmlPayload(decrypted);
  }

  return parsed;
}

export function isWecomTextMessage(payload: WecomCallbackPayload): boolean {
  return payload.MsgType === "text" && Boolean(payload.Content?.trim());
}

export function buildWecomEventSummary(payload: WecomCallbackPayload): string {
  if (payload.MsgType !== "event") {
    return "";
  }

  return [payload.Event, payload.ChangeType].filter(Boolean).join(":");
}

function extractXmlValue(xml: string, tagName: string): string | undefined {
  const cdataPattern = new RegExp(`<${tagName}><!\\[CDATA\\[(.*?)\\]\\]><\\/${tagName}>`, "s");
  const textPattern = new RegExp(`<${tagName}>(.*?)<\\/${tagName}>`, "s");
  const cdataMatch = xml.match(cdataPattern);

  if (cdataMatch?.[1]) {
    return cdataMatch[1].trim();
  }

  const textMatch = xml.match(textPattern);
  return textMatch?.[1]?.trim();
}

export function decryptWecomMessage(input: WecomDecryptInput): string {
  const isValid = verifyWecomSignature(
    input.token,
    input.timestamp,
    input.nonce,
    input.msgSignature,
    input.encrypted
  );

  if (!isValid) {
    throw new Error("Invalid WeCom message signature");
  }

  const aesKey = Buffer.from(`${input.encodingAesKey}=`, "base64");
  const iv = aesKey.subarray(0, 16);
  const encryptedBuffer = Buffer.from(input.encrypted, "base64");
  const decipher = crypto.createDecipheriv("aes-256-cbc", aesKey, iv);
  decipher.setAutoPadding(false);

  const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  const unpadded = removePkcs7Padding(decrypted);
  const content = unpadded.subarray(16);
  const messageLength = content.readUInt32BE(0);
  const message = content.subarray(4, 4 + messageLength).toString("utf8");
  const receiveId = content.subarray(4 + messageLength).toString("utf8");

  if (receiveId !== input.receiveId) {
    throw new Error("Invalid WeCom receive id");
  }

  return message;
}

export function encryptWecomReply(input: EncryptWecomReplyInput): string {
  const aesKey = Buffer.from(`${input.encodingAesKey}=`, "base64");
  const iv = aesKey.subarray(0, 16);
  const randomPrefix = crypto.randomBytes(16);
  const messageBuffer = Buffer.from(input.replyXml, "utf8");
  const receiveIdBuffer = Buffer.from(input.receiveId, "utf8");
  const msgLength = Buffer.alloc(4);
  msgLength.writeUInt32BE(messageBuffer.length, 0);

  const plainBuffer = Buffer.concat([randomPrefix, msgLength, messageBuffer, receiveIdBuffer]);
  const padded = applyPkcs7Padding(plainBuffer);
  const cipher = crypto.createCipheriv("aes-256-cbc", aesKey, iv);
  cipher.setAutoPadding(false);

  const encrypted = Buffer.concat([cipher.update(padded), cipher.final()]).toString("base64");
  const signature = createWecomSignature(input.token, input.timestamp, input.nonce, encrypted);

  return [
    "<xml>",
    `<Encrypt><![CDATA[${encrypted}]]></Encrypt>`,
    `<MsgSignature><![CDATA[${signature}]]></MsgSignature>`,
    `<TimeStamp>${input.timestamp}</TimeStamp>`,
    `<Nonce><![CDATA[${input.nonce}]]></Nonce>`,
    "</xml>"
  ].join("");
}

export function buildWecomTextReplyXml(input: BuildWecomTextReplyInput): string {
  const createTime = input.createTime ?? Math.floor(Date.now() / 1000);

  return [
    "<xml>",
    `<ToUserName><![CDATA[${input.toUserName}]]></ToUserName>`,
    `<FromUserName><![CDATA[${input.fromUserName}]]></FromUserName>`,
    `<CreateTime>${createTime}</CreateTime>`,
    "<MsgType><![CDATA[text]]></MsgType>",
    `<Content><![CDATA[${input.content}]]></Content>`,
    "</xml>"
  ].join("");
}

function removePkcs7Padding(buffer: Buffer): Buffer {
  const pad = buffer[buffer.length - 1];
  const padding = pad < 1 || pad > 32 ? 0 : pad;
  return buffer.subarray(0, buffer.length - padding);
}

function applyPkcs7Padding(buffer: Buffer): Buffer {
  const blockSize = 32;
  const pad = blockSize - (buffer.length % blockSize || blockSize);
  const padding = Buffer.alloc(pad === 0 ? blockSize : pad, pad === 0 ? blockSize : pad);
  return Buffer.concat([buffer, padding]);
}

function createWecomSignature(token: string, timestamp: string, nonce: string, encrypted: string) {
  return crypto.createHash("sha1").update([token, timestamp, nonce, encrypted].sort().join("")).digest("hex");
}
