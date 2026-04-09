import { WecomController } from "../src/wecom.controller";
import type { ChatService } from "../src/chat.service";
import type { RuntimeStoreService } from "../src/runtime-store.service";

describe("WecomController", () => {
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
