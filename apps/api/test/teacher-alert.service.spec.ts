import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { LearnerProfileService } from "../src/learner-profile.service";
import { RuntimeStoreService } from "../src/runtime-store.service";
import { TeacherAlertService } from "../src/teacher-alert.service";

describe("TeacherAlertService", () => {
  it("creates follow-up and risk alerts from learner activity", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "agenttwin-alerts-"));
    const learnerProfiles = new LearnerProfileService(path.join(tempDir, "learner-state.json"));
    const runtimeStore = new RuntimeStoreService(path.join(tempDir, "runtime-store.json"));
    const service = new TeacherAlertService(learnerProfiles, runtimeStore);

    await learnerProfiles.recordInteraction({
      learnerId: "student-010",
      sessionId: "session-010"
    });
    await learnerProfiles.recordInteraction({
      learnerId: "student-010",
      sessionId: "session-010"
    });
    await learnerProfiles.recordInteraction({
      learnerId: "student-010",
      sessionId: "session-010"
    });

    await runtimeStore.recordAuditEvent("tenant-demo", "chat.reply.generated", {
      traceId: "trace-risk-001",
      userId: "student-011",
      riskFlags: ["sensitive:self_harm"]
    });

    const alerts = await service.listAlerts();

    expect(alerts.map((alert) => alert.type)).toEqual(
      expect.arrayContaining(["learner_needs_follow_up", "risk_intervention"])
    );
    expect(alerts.find((alert) => alert.learnerId === "student-010")?.severity).toBe("medium");
    expect(alerts.find((alert) => alert.learnerId === "student-011")?.severity).toBe("high");
  });
});
