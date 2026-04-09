import {
  buildWecomTextReplyXml,
  encryptWecomReply,
  decryptWecomMessage,
  isWecomTextMessage,
  normalizeWecomMessage,
  parseWecomXmlPayload,
  resolveWecomCallbackPayload,
  verifyWecomSignature
} from "@agenttwin/wecom";

describe("WeCom adapter", () => {
  it("parses enterprise wecom xml payloads into a callback object", () => {
    const xml = `
      <xml>
        <ToUserName><![CDATA[wx-group-demo]]></ToUserName>
        <FromUserName><![CDATA[parent-user-01]]></FromUserName>
        <CreateTime>1712659200</CreateTime>
        <MsgType><![CDATA[text]]></MsgType>
        <Content><![CDATA[@AgentTwin老师 上课时间怎么安排？]]></Content>
        <MsgId>90001</MsgId>
      </xml>
    `;

    const parsed = parseWecomXmlPayload(xml);

    expect(parsed.ToUserName).toBe("wx-group-demo");
    expect(parsed.FromUserName).toBe("parent-user-01");
    expect(parsed.Content).toContain("@AgentTwin老师");
    expect(parsed.MsgId).toBe("90001");
  });

  it("normalizes parsed xml payloads into the internal message contract", () => {
    const xml = `
      <xml>
        <ToUserName><![CDATA[group-demo]]></ToUserName>
        <FromUserName><![CDATA[user-demo]]></FromUserName>
        <MsgType><![CDATA[text]]></MsgType>
        <Content><![CDATA[@AgentTwin老师 孩子写作业拖拉怎么办？]]></Content>
      </xml>
    `;

    const normalized = normalizeWecomMessage(parseWecomXmlPayload(xml));

    expect(normalized.channel).toBe("wecom");
    expect(normalized.groupId).toBe("group-demo");
    expect(normalized.message).toContain("@AgentTwin老师");
    expect(normalized.traceId).toMatch(/^trace_/);
  });

  it("validates a wecom-style callback signature from token, timestamp, and nonce", () => {
    const token = "agenttwin-token";
    const timestamp = "1712659200";
    const nonce = "nonce-001";
    const signature = "bf5b495d0bc074470d5ade43f3dfa0b2c4ba3b39";

    expect(verifyWecomSignature(token, timestamp, nonce, signature)).toBe(true);
    expect(verifyWecomSignature(token, timestamp, nonce, "invalid-signature")).toBe(false);
  });

  it("decrypts an encrypted wecom callback using the official algorithm example", () => {
    const token = "QDG6eK";
    const encodingAesKey = "jWmYm7qr5nMoAUwZRjGtBxmz3KA1tkAj3ykkR6q2B2C";
    const receiveId = "wx5823bf96d3bd56c7";
    const timestamp = "1409659813";
    const nonce = "1372623149";
    const encrypted =
      "RypEvHKD8QQKFhvQ6QleEB4J58tiPdvo+rtK1I9qca6aM/wvqnLSV5zEPeusUiX5L5X/0lWfrf0QADHHhGd3QczcdCUpj911L3vg3W/sYYvuJTs3TUUkSUXxaccAS0qhxchrRYt66wiSpGLYL42aM6A8dTT+6k4aSknmPj48kzJs8qLjvd4Xgpue06DOdnLxAUHzM6+kDZ+HMZfJYuR+LtwGc2hgf5gsijff0ekUNXZiqATP7PF5mZxZ3Izoun1s4zG4LUMnvw2r+KqCKIw+3IQH03v+BCA9nMELNqbSf6tiWSrXJB3LAVGUcallcrw8V2t9EL4EhzJWrQUax5wLVMNS0+rUPA3k22Ncx4XXZS9o0MBH27Bo6BpNelZpS+/uh9KsNlY6bHCmJU9p8g7m3fVKn28H3KDYA5Pl/T8Z1ptDAVe0lXdQ2YoyyH2uyPIGHBZZIs2pDBS8R07+qN+E7Q==";
    const signature = "477715d11cdb4164915debcba66cb864d751f3e6";

    const decrypted = decryptWecomMessage({
      token,
      encodingAesKey,
      receiveId,
      msgSignature: signature,
      timestamp,
      nonce,
      encrypted
    });

    expect(decrypted).toContain("<MsgType><![CDATA[text]]></MsgType>");
    expect(decrypted).toContain("<Content><![CDATA[hello]]></Content>");
    expect(decrypted).toContain("<ToUserName><![CDATA[wx5823bf96d3bd56c7]]></ToUserName>");
  });

  it("resolves an encrypted callback xml into a plaintext callback payload", () => {
    const encryptedXml = `
      <xml>
        <ToUserName><![CDATA[wx5823bf96d3bd56c7]]></ToUserName>
        <Encrypt><![CDATA[RypEvHKD8QQKFhvQ6QleEB4J58tiPdvo+rtK1I9qca6aM/wvqnLSV5zEPeusUiX5L5X/0lWfrf0QADHHhGd3QczcdCUpj911L3vg3W/sYYvuJTs3TUUkSUXxaccAS0qhxchrRYt66wiSpGLYL42aM6A8dTT+6k4aSknmPj48kzJs8qLjvd4Xgpue06DOdnLxAUHzM6+kDZ+HMZfJYuR+LtwGc2hgf5gsijff0ekUNXZiqATP7PF5mZxZ3Izoun1s4zG4LUMnvw2r+KqCKIw+3IQH03v+BCA9nMELNqbSf6tiWSrXJB3LAVGUcallcrw8V2t9EL4EhzJWrQUax5wLVMNS0+rUPA3k22Ncx4XXZS9o0MBH27Bo6BpNelZpS+/uh9KsNlY6bHCmJU9p8g7m3fVKn28H3KDYA5Pl/T8Z1ptDAVe0lXdQ2YoyyH2uyPIGHBZZIs2pDBS8R07+qN+E7Q==]]></Encrypt>
        <AgentID><![CDATA[218]]></AgentID>
      </xml>
    `;

    const resolved = resolveWecomCallbackPayload({
      body: encryptedXml,
      msgSignature: "477715d11cdb4164915debcba66cb864d751f3e6",
      timestamp: "1409659813",
      nonce: "1372623149",
      token: "QDG6eK",
      encodingAesKey: "jWmYm7qr5nMoAUwZRjGtBxmz3KA1tkAj3ykkR6q2B2C",
      receiveId: "wx5823bf96d3bd56c7"
    });

    expect(resolved.MsgType).toBe("text");
    expect(resolved.Content).toBe("hello");
    expect(resolved.FromUserName).toBe("mycreate");
  });

  it("encrypts a passive reply xml that can be decrypted back to the original message", () => {
    const token = "agenttwin-token";
    const encodingAesKey = "jWmYm7qr5nMoAUwZRjGtBxmz3KA1tkAj3ykkR6q2B2C";
    const receiveId = "wx5823bf96d3bd56c7";
    const timestamp = "1712660000";
    const nonce = "nonce-passive-001";
    const replyXml = "<xml><Content><![CDATA[hello reply]]></Content></xml>";

    const encryptedXml = encryptWecomReply({
      token,
      encodingAesKey,
      receiveId,
      replyXml,
      timestamp,
      nonce
    });

    const encryptedPayload = parseWecomXmlPayload(encryptedXml);
    expect(encryptedPayload.Encrypt).toBeDefined();

    const msgSignature = encryptedXml.match(/<MsgSignature><!\[CDATA\[(.*?)\]\]><\/MsgSignature>/)?.[1];
    expect(msgSignature).toBeDefined();

    const decrypted = decryptWecomMessage({
      token,
      encodingAesKey,
      receiveId,
      msgSignature: msgSignature!,
      timestamp,
      nonce,
      encrypted: encryptedPayload.Encrypt!
    });

    expect(decrypted).toBe(replyXml);
  });

  it("builds a passive text reply xml by swapping sender and receiver", () => {
    const xml = buildWecomTextReplyXml({
      fromUserName: "agent-app",
      toUserName: "parent-user-01",
      content: "收到，我们会尽快回复。"
    });

    expect(xml).toContain("<ToUserName><![CDATA[parent-user-01]]></ToUserName>");
    expect(xml).toContain("<FromUserName><![CDATA[agent-app]]></FromUserName>");
    expect(xml).toContain("<MsgType><![CDATA[text]]></MsgType>");
    expect(xml).toContain("<Content><![CDATA[收到，我们会尽快回复。]]></Content>");
  });

  it("parses event-style callback xml and keeps event metadata for downstream routing", () => {
    const xml = `
      <xml>
        <ToUserName><![CDATA[ww-corp]]></ToUserName>
        <FromUserName><![CDATA[sys]]></FromUserName>
        <CreateTime>1712659200</CreateTime>
        <MsgType><![CDATA[event]]></MsgType>
        <Event><![CDATA[change_external_chat]]></Event>
        <ChangeType><![CDATA[add_external_contact]]></ChangeType>
        <ChatId><![CDATA[group-event-01]]></ChatId>
      </xml>
    `;

    const parsed = parseWecomXmlPayload(xml);
    const normalized = normalizeWecomMessage(parsed);

    expect(parsed.MsgType).toBe("event");
    expect(parsed.Event).toBe("change_external_chat");
    expect(parsed.ChangeType).toBe("add_external_contact");
    expect(normalized.groupId).toBe("group-event-01");
    expect(isWecomTextMessage(parsed)).toBe(false);
  });
});
