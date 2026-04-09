export interface WecomActiveSendInput {
  corpId: string;
  corpSecret: string;
  agentId: string;
  toUser: string;
  content: string;
}

export interface WecomActiveSendResult {
  ok: boolean;
  errcode?: number;
  errmsg?: string;
  msgid?: string;
}

export async function sendWecomAppMessage(
  input: WecomActiveSendInput,
  fetchImpl: typeof fetch = fetch
): Promise<WecomActiveSendResult> {
  const tokenResponse = await fetchImpl(
    `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${encodeURIComponent(input.corpId)}&corpsecret=${encodeURIComponent(input.corpSecret)}`
  );
  const tokenPayload = (await tokenResponse.json()) as { errcode?: number; errmsg?: string; access_token?: string };

  if (!tokenResponse.ok || tokenPayload.errcode || !tokenPayload.access_token) {
    return {
      ok: false,
      errcode: tokenPayload.errcode,
      errmsg: tokenPayload.errmsg ?? "failed to acquire access token"
    };
  }

  const sendResponse = await fetchImpl(
    `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${encodeURIComponent(tokenPayload.access_token)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        touser: input.toUser,
        msgtype: "text",
        agentid: input.agentId,
        text: {
          content: input.content
        },
        safe: 0
      })
    }
  );
  const sendPayload = (await sendResponse.json()) as { errcode?: number; errmsg?: string; msgid?: string };

  return {
    ok: sendResponse.ok && !sendPayload.errcode,
    errcode: sendPayload.errcode,
    errmsg: sendPayload.errmsg,
    msgid: sendPayload.msgid
  };
}
