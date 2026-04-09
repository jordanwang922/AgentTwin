import { Injectable, Optional } from "@nestjs/common";
import type { LearnerProfile, LearnerSegment } from "@agenttwin/core";
import {
  createFileStateRepository,
  resolveDefaultStateRepository,
  type StateRepository
} from "./storage-repositories";

interface LearnerProfileSnapshot {
  profiles: Record<string, LearnerProfile>;
}

const defaultSnapshot: LearnerProfileSnapshot = {
  profiles: {}
};

@Injectable()
export class LearnerProfileService {
  private readonly repository: StateRepository<LearnerProfileSnapshot>;
  private readonly ready: Promise<void>;
  private snapshot: LearnerProfileSnapshot = structuredClone(defaultSnapshot);

  constructor(@Optional() repositoryOrFilePath?: StateRepository<LearnerProfileSnapshot> | string) {
    this.repository =
      typeof repositoryOrFilePath === "string"
        ? createFileStateRepository(repositoryOrFilePath, structuredClone(defaultSnapshot))
        : repositoryOrFilePath ??
          resolveDefaultStateRepository("learner-state.json", "learner_state", structuredClone(defaultSnapshot));
    this.ready = this.hydrate();
  }

  async recordProgress(input: { learnerId: string; lessonId: string; status: "completed" | "in_progress" }) {
    await this.ready;

    const current = this.snapshot.profiles[input.learnerId] ?? createDefaultProfile(input.learnerId);

    const completedLessons =
      input.status === "completed"
        ? [...new Set([...current.completedLessons, input.lessonId])]
        : current.completedLessons;

    const profile = buildProfile({
      ...current,
      learnerId: input.learnerId,
      completedLessons,
      lastLessonId: input.lessonId
    });

    this.snapshot.profiles[input.learnerId] = profile;
    await this.repository.save(this.snapshot);
    return profile;
  }

  async recordInteraction(input: { learnerId: string; sessionId?: string }) {
    await this.ready;

    const current = this.snapshot.profiles[input.learnerId] ?? createDefaultProfile(input.learnerId);
    const profile = buildProfile({
      ...current,
      conversationCount: current.conversationCount + 1,
      lastInteractionAt: new Date().toISOString()
    });

    this.snapshot.profiles[input.learnerId] = profile;
    await this.repository.save(this.snapshot);
    return profile;
  }

  async getProfile(learnerId: string) {
    await this.ready;
    return this.snapshot.profiles[learnerId] ?? createDefaultProfile(learnerId);
  }

  async listProfiles() {
    await this.ready;
    return Object.values(this.snapshot.profiles).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  private async hydrate() {
    const snapshot = await this.repository.load();
    this.snapshot = {
      profiles: Object.fromEntries(
        Object.entries(snapshot.profiles ?? {}).map(([learnerId, profile]) => [
          learnerId,
          buildProfile({
            ...createDefaultProfile(learnerId),
            ...profile
          })
        ])
      )
    };
  }
}

function recommendNextLesson(completedLessons: string[]) {
  return `lesson-${String(completedLessons.length + 1).padStart(2, "0")}`;
}

function createDefaultProfile(learnerId: string): LearnerProfile {
  return {
    learnerId,
    completedLessons: [],
    nextRecommendedLesson: "lesson-01",
    conversationCount: 0,
    segment: "new",
    tags: ["new"],
    updatedAt: new Date().toISOString()
  };
}

function buildProfile(input: Omit<LearnerProfile, "nextRecommendedLesson" | "segment" | "tags" | "updatedAt"> & {
  updatedAt?: string;
}) {
  const segment = resolveSegment(input.completedLessons, input.conversationCount);

  return {
    ...input,
    nextRecommendedLesson: recommendNextLesson(input.completedLessons),
    segment,
    tags: deriveTags(segment, input.completedLessons, input.conversationCount),
    updatedAt: input.updatedAt ?? new Date().toISOString()
  } satisfies LearnerProfile;
}

function resolveSegment(completedLessons: string[], conversationCount: number): LearnerSegment {
  if (completedLessons.length >= 3) {
    return "milestone";
  }

  if (completedLessons.length > 0) {
    return "active";
  }

  if (conversationCount >= 3) {
    return "needs_follow_up";
  }

  return "new";
}

function deriveTags(segment: LearnerSegment, completedLessons: string[], conversationCount: number) {
  const tags = new Set<string>([segment]);

  if (conversationCount > 0) {
    tags.add("engaged");
  }

  if (completedLessons.length > 0) {
    tags.add(`completed_${completedLessons.length}_lessons`);
  }

  return [...tags];
}
