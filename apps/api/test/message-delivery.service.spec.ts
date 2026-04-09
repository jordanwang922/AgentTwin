import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { MessageDeliveryService } from "../src/message-delivery.service";
import { SopStateService } from "../src/sop-state.service";

describe("MessageDeliveryService", () => {
  it("prepares an active wecom delivery record for a rendered SOP message", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "agenttwin-delivery-"));
    const state = new SopStateService(path.join(tempDir, "sop-state.json"));
    const service = new MessageDeliveryService(state);

    const delivery = await service.prepare({
      taskId: "task-001",
      channel: "wecom",
      targetType: "group",
      targetId: "group-demo",
      content: "测试发送内容"
    });

    expect(delivery.status).toBe("prepared");
    expect(delivery.targetType).toBe("group");
  });
});
