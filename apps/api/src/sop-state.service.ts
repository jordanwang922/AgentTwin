import { Injectable, Optional } from "@nestjs/common";
import type { MessageDelivery, SopExecutionRecord, SopTask, SopTemplate } from "@agenttwin/core";
import {
  createFileStateRepository,
  resolveDefaultStateRepository,
  type StateRepository
} from "./storage-repositories";

export interface SopStateSnapshot {
  templates: SopTemplate[];
  tasks: SopTask[];
  deliveries: MessageDelivery[];
  executions: SopExecutionRecord[];
}

const defaultSnapshot: SopStateSnapshot = {
  templates: [],
  tasks: [],
  deliveries: [],
  executions: []
};

@Injectable()
export class SopStateService {
  private readonly repository: StateRepository<SopStateSnapshot>;
  private readonly ready: Promise<void>;
  private snapshot: SopStateSnapshot = structuredClone(defaultSnapshot);

  constructor(@Optional() repositoryOrFilePath?: StateRepository<SopStateSnapshot> | string) {
    this.repository =
      typeof repositoryOrFilePath === "string"
        ? createFileStateRepository(repositoryOrFilePath, structuredClone(defaultSnapshot))
        : repositoryOrFilePath ??
          resolveDefaultStateRepository("sop-state.json", "sop_state", structuredClone(defaultSnapshot));

    this.ready = this.hydrate();
  }

  async getTemplates() {
    await this.ready;
    return [...this.snapshot.templates];
  }

  async saveTemplate(template: SopTemplate) {
    await this.ready;
    this.snapshot.templates = [template, ...this.snapshot.templates.filter((item) => item.id !== template.id)];
    await this.persist();
    return template;
  }

  async deleteTemplate(id: string) {
    await this.ready;
    this.snapshot.templates = this.snapshot.templates.filter((item) => item.id !== id);
    await this.persist();
  }

  async getTask(id: string) {
    await this.ready;
    return this.snapshot.tasks.find((task) => task.id === id);
  }

  async getTasks() {
    await this.ready;
    return [...this.snapshot.tasks];
  }

  async saveTask(task: SopTask) {
    await this.ready;
    this.snapshot.tasks = [task, ...this.snapshot.tasks.filter((item) => item.id !== task.id)];
    await this.persist();
    return task;
  }

  async deleteTask(id: string) {
    await this.ready;
    this.snapshot.tasks = this.snapshot.tasks.filter((item) => item.id !== id);
    this.snapshot.deliveries = this.snapshot.deliveries.filter((item) => item.taskId !== id);
    this.snapshot.executions = this.snapshot.executions.filter((item) => item.taskId !== id);
    await this.persist();
  }

  async getDeliveries() {
    await this.ready;
    return [...this.snapshot.deliveries];
  }

  async saveDelivery(delivery: MessageDelivery) {
    await this.ready;
    this.snapshot.deliveries = [delivery, ...this.snapshot.deliveries.filter((item) => item.id !== delivery.id)];
    await this.persist();
    return delivery;
  }

  async getExecutions() {
    await this.ready;
    return [...this.snapshot.executions];
  }

  async saveExecution(execution: SopExecutionRecord) {
    await this.ready;
    this.snapshot.executions = [execution, ...this.snapshot.executions.filter((item) => item.id !== execution.id)];
    await this.persist();
    return execution;
  }

  private async hydrate() {
    this.snapshot = await this.repository.load();
  }

  private async persist() {
    await this.repository.save(this.snapshot);
  }
}
