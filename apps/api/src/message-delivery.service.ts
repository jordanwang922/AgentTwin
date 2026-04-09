import { Injectable } from "@nestjs/common";
import type { DeliveryStatus, MessageDelivery, SopDeliveryType } from "@agenttwin/core";
import { createTraceId } from "@agenttwin/shared";
import { sendWecomAppMessage } from "@agenttwin/wecom";
import { SopStateService } from "./sop-state.service";

interface PrepareDeliveryInput {
  taskId: string;
  channel: string;
  targetType: SopDeliveryType;
  targetId: string;
  content: string;
}

interface RecordDeliveryInput extends Omit<MessageDelivery, "createdAt"> {
  createdAt?: string;
}

@Injectable()
export class MessageDeliveryService {
  constructor(private readonly state: SopStateService) {}

  async prepare(input: PrepareDeliveryInput): Promise<MessageDelivery> {
    const delivery: MessageDelivery = {
      id: createTraceId(),
      taskId: input.taskId,
      channel: input.channel,
      targetType: input.targetType,
      targetId: input.targetId,
      content: input.content,
      status: "prepared",
      createdAt: new Date().toISOString()
    };

    return this.state.saveDelivery(delivery);
  }

  async record(input: RecordDeliveryInput): Promise<MessageDelivery> {
    return this.state.saveDelivery({
      ...input,
      createdAt: input.createdAt ?? new Date().toISOString()
    });
  }

  async markStatus(id: string, status: DeliveryStatus) {
    const delivery = (await this.state.getDeliveries()).find((item) => item.id === id);
    if (!delivery) {
      throw new Error(`Delivery ${id} not found`);
    }

    return this.state.saveDelivery({
      ...delivery,
      status,
      sentAt: status === "sent" ? new Date().toISOString() : delivery.sentAt
    });
  }

  async list() {
    return this.state.getDeliveries();
  }

  async sendPrepared(id: string) {
    const delivery = (await this.state.getDeliveries()).find((item) => item.id === id);
    if (!delivery) {
      throw new Error(`Delivery ${id} not found`);
    }

    const corpId = process.env.WECOM_CORP_ID;
    const corpSecret = process.env.WECOM_APP_SECRET ?? process.env.WECOM_SECRET;
    const agentId = process.env.WECOM_AGENT_ID;

    if (delivery.channel === "wecom" && corpId && corpSecret && agentId) {
      const result = await sendWecomAppMessage({
        corpId,
        corpSecret,
        agentId,
        toUser: delivery.targetId,
        content: delivery.content
      });

      if (!result.ok) {
        return this.markStatus(id, "failed");
      }
    }

    return this.markStatus(id, "sent");
  }
}
