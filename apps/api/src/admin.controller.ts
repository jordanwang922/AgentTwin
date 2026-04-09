import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import type {
  ChatRequest,
  FaqEntry,
  GroupProfile,
  KnowledgeArticle,
  RiskRule,
  SopTask,
  SopTemplate,
  TenantProfile
} from "@agenttwin/core";
import { ChatService } from "./chat.service";
import { AdminService } from "./admin.service";

@Controller("api/admin")
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly chatService: ChatService
  ) {}

  @Get("overview")
  async getOverview() {
    return this.adminService.getOverview();
  }

  @Get("knowledge")
  async getKnowledge() {
    return this.adminService.getKnowledgeItems();
  }

  @Get("messages")
  async getMessages() {
    return this.adminService.getMessages();
  }

  @Get("routing")
  async getRouting() {
    return this.adminService.getRoutingConfig();
  }

  @Get("storage")
  async getStorageStatus() {
    return this.adminService.getStorageStatus();
  }

  @Get("teacher-dashboard")
  async getTeacherDashboard() {
    return this.adminService.getTeacherDashboard();
  }

  @Get("unified-dashboard")
  async getUnifiedOpsDashboard() {
    return this.adminService.getUnifiedOpsDashboard();
  }

  @Get("alerts")
  async getTeacherAlerts() {
    return this.adminService.listTeacherAlerts();
  }

  @Get("learners")
  async getLearners() {
    return this.adminService.listLearners();
  }

  @Get("sop/templates")
  async getSopTemplates() {
    return this.adminService.listSopTemplates();
  }

  @Post("sop/templates")
  async createSopTemplate(@Body() body: Pick<SopTemplate, "id" | "name" | "channel" | "content">) {
    return this.adminService.createSopTemplate(body);
  }

  @Post("sop/templates/:templateId")
  async updateSopTemplate(
    @Param("templateId") templateId: string,
    @Body() body: Partial<Pick<SopTemplate, "name" | "channel" | "content">>
  ) {
    return this.adminService.updateSopTemplate({
      id: templateId,
      ...body
    });
  }

  @Delete("sop/templates/:templateId")
  async deleteSopTemplate(@Param("templateId") templateId: string) {
    return this.adminService.deleteSopTemplate(templateId);
  }

  @Get("sop/tasks")
  async getSopTasks() {
    return this.adminService.listSopTasks();
  }

  @Post("sop/tasks")
  async createSopTask(
    @Body()
    body: Pick<SopTask, "id" | "templateId" | "scheduleAt" | "deliveryType" | "targetGroupId" | "targetUserId" | "variables">
  ) {
    return this.adminService.createSopTask(body);
  }

  @Post("sop/tasks/:taskId")
  async updateSopTask(
    @Param("taskId") taskId: string,
    @Body()
    body: Partial<Pick<SopTask, "scheduleAt" | "deliveryType" | "targetGroupId" | "targetUserId" | "variables">>
  ) {
    return this.adminService.updateSopTask({
      id: taskId,
      ...body
    });
  }

  @Delete("sop/tasks/:taskId")
  async deleteSopTask(@Param("taskId") taskId: string) {
    return this.adminService.deleteSopTask(taskId);
  }

  @Post("sop/tasks/:taskId/execute")
  async executeSopTask(@Param("taskId") taskId: string) {
    return this.adminService.executeSopTask(taskId);
  }

  @Post("sop/process-pending")
  async processPendingSopTasks() {
    return this.adminService.processPendingSopTasks();
  }

  @Get("sop/deliveries")
  async getDeliveries() {
    return this.adminService.listDeliveries();
  }

  @Get("learners/:learnerId")
  async getLearnerProfile(@Param("learnerId") learnerId: string) {
    return this.adminService.getLearnerProfile(learnerId);
  }

  @Post("test-chat")
  async testChat(@Body() body: Partial<ChatRequest>) {
    return this.chatService.process({
      tenantId: body.tenantId ?? "tenant-demo",
      channel: body.channel ?? "wecom",
      groupId: body.groupId ?? "group-demo",
      userId: body.userId ?? "operator-demo",
      message: body.message ?? "",
      context: {
        source: "admin-test-console"
      }
    });
  }

  @Post("faq")
  async createFaq(@Body() body: FaqEntry) {
    return this.adminService.addFaqEntry(body);
  }

  @Post("articles")
  async createArticle(@Body() body: KnowledgeArticle) {
    return this.adminService.addKnowledgeArticle(body);
  }

  @Post("risk-rules")
  async createRiskRule(@Body() body: RiskRule) {
    return this.adminService.addRiskRule(body);
  }

  @Post("tenant")
  async updateTenant(@Body() body: TenantProfile) {
    return this.adminService.updateTenantProfile(body);
  }

  @Post("groups")
  async updateGroup(@Body() body: GroupProfile) {
    return this.adminService.updateGroupConfig(body);
  }
}
