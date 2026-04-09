import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DialogueService } from "../src/dialogue.service";

describe("DialogueService", () => {
  it("keeps the last three student turns in the conversation context", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "agenttwin-dialogue-"));
    const service = new DialogueService(path.join(tempDir, "dialogue-state.json"));

    await service.append("session-001", "孩子不听话怎么办？");
    await service.append("session-001", "他现在 11 岁。");
    await service.append("session-001", "最近还总顶嘴。");

    const turns = await service.getRecentTurns("session-001");
    expect(turns).toHaveLength(3);
  });
});
