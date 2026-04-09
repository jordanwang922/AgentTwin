import { WecomController } from "../src/wecom.controller";
import type { ChatService } from "../src/chat.service";
import type { RuntimeStoreService } from "../src/runtime-store.service";
import { encryptWecomReply } from "@agenttwin/wecom";

describe("WecomController", () => {
  it("returns the raw echostr for plain URL verification", () => {
    const controller = new WecomController({ process: jest.fn() } as unknown as ChatService, {
      recordAuditEvent: jest.fn()
    } as unknown as RuntimeStoreService);

    const result = controller.verify({
      echostr: "plain-verify-token",
      msg_signature: "signature",
      timestamp: "1712659200",
      nonce: "nonce"
    });

    expect(result).toBe("plain-verify-token");
  });

  it("returns the decrypted echostr for secure URL verification", () => {
    const controller = new WecomController({ process: jest.fn() } as unknown as ChatService, {
      recordAuditEvent: jest.fn()
    } as unknown as RuntimeStoreService);

    const previousEnv = {
      WECOM_TOKEN: process.env.WECOM_TOKEN,
      WECOM_AES_KEY: process.env.WECOM_AES_KEY,
      WECOM_CORP_ID: process.env.WECOM_CORP_ID
    };

    process.env.WECOM_TOKEN = "token-demo";
    process.env.WECOM_AES_KEY = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG";
    process.env.WECOM_CORP_ID = "ww-demo-corp";

    const encryptedEchostr = encryptWecomReply({
      token: process.env.WECOM_TOKEN,
      encodingAesKey: process.env.WECOM_AES_KEY,
      receiveId: process.env.WECOM_CORP_ID,
      replyXml: "secure-verify-token",
      timestamp: "1712659200",
      nonce: "nonce-demo"
    });

    const encrypted = encryptedEchostr.match(/<Encrypt><!\[CDATA\[(.*?)\]\]><\/Encrypt>/)?.[1];
    const signature = encryptedEchostr.match(/<MsgSignature><!\[CDATA\[(.*?)\]\]><\/MsgSignature>/)?.[1];

    expect(encrypted).toBeTruthy();
    expect(signature).toBeTruthy();

    const result = controller.verify({
      echostr: encrypted,
      msg_signature: signature,
      timestamp: "1712659200",
      nonce: "nonce-demo"
    });

    expect(result).toBe("secure-verify-token");

    process.env.WECOM_TOKEN = previousEnv.WECOM_TOKEN;
    process.env.WECOM_AES_KEY = previousEnv.WECOM_AES_KEY;
    process.env.WECOM_CORP_ID = previousEnv.WECOM_CORP_ID;
  });

  it("acknowledges non-text event callbacks without invoking the chat engine", async () => {
    const chatService: Pick<ChatService, "process"> = {
      process: jest.fn()
    };
    const runtimeStore: Pick<RuntimeStoreService, "recordAuditEvent"> = {
      recordAuditEvent: jest.fn().mockResolvedValue(undefined)
    };
    const controller = new WecomController(chatService as ChatService, runtimeStore as RuntimeStoreService);
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

    const result = await controller.receive(xml, { body: xml }, {});

    expect(result).toBe("success");
    expect(chatService.process).not.toHaveBeenCalled();
    expect(runtimeStore.recordAuditEvent).toHaveBeenCalledWith(
      "demo-tenant",
      "wecom.callback.ignored",
      expect.objectContaining({
        msgType: "event",
        event: "change_external_chat",
        changeType: "add_external_contact"
      })
    );
  });
});
