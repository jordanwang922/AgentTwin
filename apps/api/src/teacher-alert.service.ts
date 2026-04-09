import { Injectable } from "@nestjs/common";
import type { TeacherAlert } from "@agenttwin/core";
import { LearnerProfileService } from "./learner-profile.service";
import { RuntimeStoreService } from "./runtime-store.service";

@Injectable()
export class TeacherAlertService {
  constructor(
    private readonly learnerProfiles: LearnerProfileService,
    private readonly runtimeStore: RuntimeStoreService
  ) {}

  async listAlerts(limit = 10): Promise<TeacherAlert[]> {
    const [profiles, messages, audits] = await Promise.all([
      this.learnerProfiles.listProfiles(),
      this.runtimeStore.getLatestMessages(50),
      this.runtimeStore.getAuditLogs(50)
    ]);

    const alerts = new Map<string, TeacherAlert>();

    for (const profile of profiles) {
      if (profile.segment === "needs_follow_up") {
        const alert = createAlert({
          id: `alert-follow-up-${profile.learnerId}`,
          learnerId: profile.learnerId,
          type: "learner_needs_follow_up",
          severity: "medium",
          summary: `学员 ${profile.learnerId} 互动频繁但暂无完成课时，建议班主任跟进。`,
          source: "learner_profile",
          createdAt: profile.updatedAt
        });
        alerts.set(alert.id, alert);
      }

      if (profile.segment === "milestone") {
        const alert = createAlert({
          id: `alert-milestone-${profile.learnerId}`,
          learnerId: profile.learnerId,
          type: "milestone_reached",
          severity: "low",
          summary: `学员 ${profile.learnerId} 已完成 ${profile.completedLessons.length} 节课，可安排阶段复盘。`,
          source: "learner_profile",
          createdAt: profile.updatedAt
        });
        alerts.set(alert.id, alert);
      }
    }

    for (const message of messages) {
      if (message.riskFlags.length === 0) {
        continue;
      }

      const alert = createAlert({
        id: `alert-risk-${message.userId}-${message.traceId}`,
        learnerId: message.userId,
        type: "risk_intervention",
        severity: "high",
        summary: `学员 ${message.userId} 触发敏感风险标记：${message.riskFlags.join(", ")}`,
        source: "runtime_message",
        createdAt: message.createdAt
      });
      alerts.set(alert.id, alert);
    }

    for (const audit of audits) {
      const learnerId = typeof audit.payload.userId === "string" ? audit.payload.userId : undefined;
      const riskFlags = Array.isArray(audit.payload.riskFlags)
        ? audit.payload.riskFlags.filter((value): value is string => typeof value === "string")
        : [];

      if (!learnerId || riskFlags.length === 0) {
        continue;
      }

      const alert = createAlert({
        id: `alert-audit-risk-${learnerId}-${audit.traceId}`,
        learnerId,
        type: "risk_intervention",
        severity: "high",
        summary: `学员 ${learnerId} 触发敏感风险标记：${riskFlags.join(", ")}`,
        source: "runtime_message",
        createdAt: audit.createdAt
      });
      alerts.set(alert.id, alert);
    }

    return [...alerts.values()].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, limit);
  }
}

function createAlert(alert: TeacherAlert) {
  return alert;
}
