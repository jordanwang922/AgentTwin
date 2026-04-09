import { Injectable } from "@nestjs/common";
import {
  type AdminOverview,
  type FaqEntry,
  type GroupProfile,
  type KnowledgeArticle,
  type LearnerSegment,
  type MessageDelivery,
  type RiskRule,
  type SopTask,
  type SopTemplate,
  type TeacherDashboard,
  type TenantProfile,
  type UnifiedOpsDashboard
} from "@agenttwin/core";
import { KnowledgeCatalogService } from "./knowledge-catalog.service";
import { LearnerProfileService } from "./learner-profile.service";
import { MessageDeliveryService } from "./message-delivery.service";
import { RoutingConfigService } from "./routing-config.service";
import { SopExecutionService } from "./sop-execution.service";
import { SopTaskService } from "./sop-task.service";
import { SopTemplateService } from "./sop-template.service";
import { SopWorkerService } from "./sop-worker.service";
import { StorageService } from "./storage.service";
import { TeacherAlertService } from "./teacher-alert.service";
import { RuntimeStoreService } from "./runtime-store.service";

@Injectable()
export class AdminService {
  constructor(
    private readonly runtimeStore: RuntimeStoreService,
    private readonly knowledgeCatalog: KnowledgeCatalogService,
    private readonly routingConfig: RoutingConfigService,
    private readonly storageService: StorageService,
    private readonly sopTemplateService: SopTemplateService,
    private readonly sopTaskService: SopTaskService,
    private readonly messageDeliveryService: MessageDeliveryService,
    private readonly sopExecutionService: SopExecutionService,
    private readonly sopWorkerService: SopWorkerService,
    private readonly learnerProfileService: LearnerProfileService,
    private readonly teacherAlertService: TeacherAlertService
  ) {}

  async getOverview(): Promise<AdminOverview> {
    const tenant = await this.routingConfig.getTenantProfile();
    const channel = await this.routingConfig.getChannelProfile();
    const group = (await this.routingConfig.getGroupProfiles())[0];

    return {
      tenantName: tenant.name,
      channelName: channel.name,
      groupName: group?.name ?? "未配置群组",
      knowledgeCount: (await this.knowledgeCatalog.getArticles()).length,
      faqCount: (await this.knowledgeCatalog.getFaqEntries()).length,
      riskRuleCount: (await this.knowledgeCatalog.getRiskRules()).length,
      latestMessages: await this.runtimeStore.getLatestMessages(5)
    };
  }

  async getKnowledgeItems() {
    return {
      faq: await this.knowledgeCatalog.getFaqEntries(),
      articles: await this.knowledgeCatalog.getArticles(),
      riskRules: await this.knowledgeCatalog.getRiskRules()
    };
  }

  async getMessages() {
    return {
      messages: await this.runtimeStore.getLatestMessages(20),
      audits: await this.runtimeStore.getAuditLogs(20)
    };
  }

  async getRoutingConfig() {
    return {
      tenant: await this.routingConfig.getTenantProfile(),
      channel: await this.routingConfig.getChannelProfile(),
      groups: await this.routingConfig.getGroupProfiles()
    };
  }

  async getStorageStatus() {
    return this.storageService.getStatus();
  }

  async getTeacherDashboard(): Promise<TeacherDashboard> {
    const [templates, tasks, deliveries] = await Promise.all([
      this.sopTemplateService.list(),
      this.sopTaskService.list(),
      this.messageDeliveryService.list()
    ]);

    return {
      templateCount: templates.length,
      pendingTasks: tasks.filter((task) => task.status === "pending").length,
      failedDeliveries: deliveries.filter((delivery) => delivery.status === "failed").length,
      latestTasks: tasks.slice(0, 5),
      latestDeliveries: deliveries.slice(0, 5)
    };
  }

  async getUnifiedOpsDashboard(): Promise<UnifiedOpsDashboard> {
    const [profiles, alerts] = await Promise.all([
      this.learnerProfileService.listProfiles(),
      this.teacherAlertService.listAlerts(8)
    ]);
    const segmentCounts = profiles.reduce<Record<LearnerSegment, number>>(
      (counts, profile) => {
        counts[profile.segment] += 1;
        return counts;
      },
      {
        new: 0,
        active: 0,
        needs_follow_up: 0,
        milestone: 0
      }
    );
    const topTags = Object.entries(
      profiles.reduce<Record<string, number>>((counts, profile) => {
        for (const tag of profile.tags) {
          counts[tag] = (counts[tag] ?? 0) + 1;
        }
        return counts;
      }, {})
    )
      .sort((left, right) => right[1] - left[1])
      .slice(0, 6)
      .map(([tag, count]) => ({ tag, count }));

    return {
      totalLearners: profiles.length,
      activeLearners: segmentCounts.active,
      atRiskLearners: segmentCounts.needs_follow_up,
      milestoneLearners: segmentCounts.milestone,
      segmentCounts,
      topTags,
      recentLearners: profiles.slice(0, 6),
      alerts
    };
  }

  async listSopTemplates() {
    return this.sopTemplateService.list();
  }

  async createSopTemplate(template: Pick<SopTemplate, "id" | "name" | "channel" | "content">) {
    return this.sopTemplateService.create(template);
  }

  async updateSopTemplate(template: Pick<SopTemplate, "id"> & Partial<Pick<SopTemplate, "name" | "channel" | "content">>) {
    return this.sopTemplateService.update(template);
  }

  async deleteSopTemplate(templateId: string) {
    return this.sopTemplateService.remove(templateId);
  }

  async listSopTasks() {
    return this.sopTaskService.list();
  }

  async createSopTask(task: {
    id: string;
    templateId: string;
    scheduleAt: string;
    deliveryType: "group" | "private";
    targetGroupId?: string;
    targetUserId?: string;
    variables?: Record<string, string>;
  }) {
    return this.sopTaskService.create(task);
  }

  async updateSopTask(task: {
    id: string;
    scheduleAt?: string;
    deliveryType?: "group" | "private";
    targetGroupId?: string;
    targetUserId?: string;
    variables?: Record<string, string>;
  }) {
    return this.sopTaskService.update(task);
  }

  async deleteSopTask(taskId: string) {
    return this.sopTaskService.remove(taskId);
  }

  async executeSopTask(taskId: string) {
    return this.sopExecutionService.executeTask(taskId);
  }

  async processPendingSopTasks() {
    return this.sopWorkerService.processPendingTasks();
  }

  async listDeliveries(): Promise<MessageDelivery[]> {
    return this.messageDeliveryService.list();
  }

  async getLearnerProfile(learnerId: string) {
    return this.learnerProfileService.getProfile(learnerId);
  }

  async listLearners() {
    return this.learnerProfileService.listProfiles();
  }

  async listTeacherAlerts() {
    return this.teacherAlertService.listAlerts();
  }

  async addFaqEntry(entry: FaqEntry) {
    return this.knowledgeCatalog.addFaqEntry(entry);
  }

  async addKnowledgeArticle(article: KnowledgeArticle) {
    return this.knowledgeCatalog.addKnowledgeArticle(article);
  }

  async addRiskRule(rule: RiskRule) {
    return this.knowledgeCatalog.addRiskRule(rule);
  }

  async updateTenantProfile(profile: TenantProfile) {
    return this.routingConfig.updateTenantProfile(profile);
  }

  async updateGroupConfig(profile: GroupProfile) {
    return this.routingConfig.updateGroupConfig(profile);
  }
}
