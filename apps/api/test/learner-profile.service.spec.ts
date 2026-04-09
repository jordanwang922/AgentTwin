import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { LearnerProfileService } from "../src/learner-profile.service";

describe("LearnerProfileService", () => {
  it("stores learner progress and returns the next recommended lesson stub", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "agenttwin-learner-"));
    const service = new LearnerProfileService(path.join(tempDir, "learner-state.json"));

    await service.recordProgress({
      learnerId: "student-001",
      lessonId: "lesson-03",
      status: "completed"
    });

    const profile = await service.getProfile("student-001");
    expect(profile.completedLessons).toContain("lesson-03");
    expect(profile.nextRecommendedLesson).toBeDefined();
  });

  it("derives learner segment, tags, and interaction stats for unified operations", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "agenttwin-learner-segments-"));
    const service = new LearnerProfileService(path.join(tempDir, "learner-state.json"));

    await service.recordInteraction({
      learnerId: "student-002",
      sessionId: "session-002"
    });
    await service.recordInteraction({
      learnerId: "student-002",
      sessionId: "session-002"
    });
    await service.recordInteraction({
      learnerId: "student-002",
      sessionId: "session-002"
    });

    const needsFollowUp = await service.getProfile("student-002");
    expect(needsFollowUp.conversationCount).toBe(3);
    expect(needsFollowUp.segment).toBe("needs_follow_up");
    expect(needsFollowUp.tags).toContain("needs_follow_up");

    await service.recordProgress({
      learnerId: "student-003",
      lessonId: "lesson-01",
      status: "completed"
    });
    await service.recordProgress({
      learnerId: "student-003",
      lessonId: "lesson-02",
      status: "completed"
    });
    await service.recordProgress({
      learnerId: "student-003",
      lessonId: "lesson-03",
      status: "completed"
    });

    const milestone = await service.getProfile("student-003");
    expect(milestone.segment).toBe("milestone");
    expect(milestone.tags).toContain("milestone");

    const learners = await service.listProfiles();
    expect(learners.map((profile) => profile.learnerId)).toEqual(
      expect.arrayContaining(["student-002", "student-003"])
    );
  });
});
