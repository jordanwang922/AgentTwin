import { sendWecomAppMessage } from "@agenttwin/wecom";

describe("active wecom send", () => {
  it("sends a message through the wecom active-send helper with access token flow", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          errcode: 0,
          access_token: "mock-token"
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          errcode: 0,
          msgid: "msg-001"
        })
      });

    const result = await sendWecomAppMessage(
      {
        corpId: "corp-demo",
        corpSecret: "secret-demo",
        agentId: "1000001",
        toUser: "teacher-001",
        content: "测试主动发送"
      },
      fetchMock as typeof fetch
    );

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
