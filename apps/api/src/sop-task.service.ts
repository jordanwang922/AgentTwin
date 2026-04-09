import { Injectable } from "@nestjs/common";
import type { SopTask } from "@agenttwin/core";
import { SopStateService } from "./sop-state.service";

interface CreateSopTaskInput {
  id: string;
  templateId: string;
  scheduleAt: string;
  deliveryType: "group" | "private";
  targetGroupId?: string;
  targetUserId?: string;
  variables?: Record<string, string>;
}

interface UpdateSopTaskInput {
  id: string;
  scheduleAt?: string;
  deliveryType?: "group" | "private";
  targetGroupId?: string;
  targetUserId?: string;
  variables?: Record<string, string>;
}

@Injectable()
export class SopTaskService {
  constructor(private readonly state: SopStateService) {}

  async create(input: CreateSopTaskInput): Promise<SopTask> {
    const task: SopTask = {
      ...input,
      status: "pending",
      variables: input.variables ?? {},
      attempts: 0,
      createdAt: new Date().toISOString()
    };

    return this.state.saveTask(task);
  }

  async list() {
    const tasks = await this.state.getTasks();
    return tasks.sort((a, b) => b.scheduleAt.localeCompare(a.scheduleAt));
  }

  async getById(id: string) {
    return this.state.getTask(id);
  }

  async markSent(id: string) {
    const task = await this.state.getTask(id);
    if (!task) {
      throw new Error(`Task ${id} not found`);
    }

    return this.state.saveTask({
      ...task,
      status: "sent",
      executedAt: new Date().toISOString()
    });
  }

  async markFailed(id: string) {
    const task = await this.state.getTask(id);
    if (!task) {
      throw new Error(`Task ${id} not found`);
    }

    return this.state.saveTask({
      ...task,
      status: "failed",
      attempts: task.attempts + 1,
      executedAt: new Date().toISOString()
    });
  }

  async markPending(id: string) {
    const task = await this.state.getTask(id);
    if (!task) {
      throw new Error(`Task ${id} not found`);
    }

    return this.state.saveTask({
      ...task,
      status: "pending"
    });
  }

  async update(input: UpdateSopTaskInput) {
    const task = await this.state.getTask(input.id);
    if (!task) {
      throw new Error(`Task ${input.id} not found`);
    }

    const nextTask: SopTask = {
      ...task,
      ...input,
      variables: input.variables ?? task.variables
    };

    return this.state.saveTask(nextTask);
  }

  async remove(id: string) {
    await this.state.deleteTask(id);
  }
}
