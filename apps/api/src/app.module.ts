import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { DialogueService } from "./dialogue.service";
import { KnowledgeCatalogService } from "./knowledge-catalog.service";
import { LearnerProfileService } from "./learner-profile.service";
import { MessageDeliveryService } from "./message-delivery.service";
import { Module } from "@nestjs/common";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { HealthController } from "./health.controller";
import { RoleRoutingService } from "./role-routing.service";
import { RoutingConfigService } from "./routing-config.service";
import { SopExecutionService } from "./sop-execution.service";
import { SopStateService } from "./sop-state.service";
import { SopTaskService } from "./sop-task.service";
import { SopTemplateService } from "./sop-template.service";
import { SopWorkerService } from "./sop-worker.service";
import { StorageService } from "./storage.service";
import { TeacherAlertService } from "./teacher-alert.service";
import { TemplateRendererService } from "./template-renderer.service";
import { RuntimeStoreService } from "./runtime-store.service";
import { WecomController } from "./wecom.controller";

@Module({
  controllers: [HealthController, ChatController, WecomController, AdminController],
  providers: [
    RuntimeStoreService,
    KnowledgeCatalogService,
    RoutingConfigService,
    StorageService,
    RoleRoutingService,
    DialogueService,
    LearnerProfileService,
    TeacherAlertService,
    SopStateService,
    SopTemplateService,
    SopTaskService,
    MessageDeliveryService,
    TemplateRendererService,
    SopExecutionService,
    SopWorkerService,
    ChatService,
    AdminService
  ]
})
export class AppModule {}
