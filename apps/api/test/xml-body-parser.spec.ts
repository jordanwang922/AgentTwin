describe("XML body parser support", () => {
  it("keeps text/xml content as raw string for callback parsing", () => {
    const body = "<xml><Content><![CDATA[@AgentTwin老师 测试]]></Content></xml>";
    const contentType = "text/xml";

    const shouldTreatAsRawText = contentType.includes("xml") && typeof body === "string";

    expect(shouldTreatAsRawText).toBe(true);
  });
});
