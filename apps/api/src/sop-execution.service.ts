import { Injectable } from "@nestjs/common";
import type { SopExecutionRecord } from "@agenttwin/core";
import { createTraceId } from "@agenttwin/shared";
import { MessageDeliveryService } from "./message-delivery.service";
import { SopStateService } from "./sop-state.service";
import { SopTaskService } from "./sop-task.service";
import { SopTemplateService } from "./sop-template.service";
import { TemplateRendererService } from "./template-renderer.service";

@Injectable()
export class SopExecutionService {
  constructor(
    private readonly state: SopStateService,
    private readonly templates: SopTemplateService,
    private readonly tasks: SopTaskService,
    private readonly deliveries: MessageDeliveryService,
    private readonly renderer: TemplateRendererService
  ) {}

  async executeTask(taskId: string): Promise<SopExecutionRecord> {
    const task = await this.tasks.getById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const template = await this.templates.getById(task.templateId);
    if (!template) {
      await this.tasks.markFailed(taskId);
      throw new Error(`Template ${task.templateId} not found`);
    }

    const renderedContent = this.renderer.render(template.content, task.variables);
    const delivery = await this.deliveries.prepare({
      taskId: task.id,
      channel: template.channel,
      targetType: task.deliveryType,
      targetId: task.targetGroupId ?? task.targetUserId ?? "unknown-target",
      content: renderedContent
    });

    const finalDelivery = await this.deliveries.sendPrepared(delivery.id);

    if (finalDelivery.status === "failed") {
      await this.tasks.markFailed(task.id);
    } else {
      await this.tasks.markSent(task.id);
    }

    const execution: SopExecutionRecord = {
      id: createTraceId(),
      taskId: task.id,
      deliveryId: delivery.id,
      status: finalDelivery.status,
      renderedContent,
      createdAt: new Date().toISOString()
    };

    await this.state.saveExecution(execution);
    return execution;
  }
}
