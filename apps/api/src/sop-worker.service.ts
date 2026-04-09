import { Injectable } from "@nestjs/common";
import { SopExecutionService } from "./sop-execution.service";
import { SopTaskService } from "./sop-task.service";

@Injectable()
export class SopWorkerService {
  constructor(
    private readonly tasks: SopTaskService,
    private readonly execution: SopExecutionService
  ) {}

  async processPendingTasks() {
    const tasks = await this.tasks.list();
    const now = Date.now();
    const pending = tasks.filter((task) => task.status === "pending" && isDue(task.scheduleAt, now));
    const retryable = tasks.filter((task) => task.status === "failed" && task.attempts < 3);

    for (const task of retryable) {
      await this.tasks.markPending(task.id);
    }

    const queue = [...pending, ...retryable];

    for (const task of queue) {
      await this.execution.executeTask(task.id);
    }

    return {
      processed: queue.length
    };
  }
}

function isDue(scheduleAt: string, now: number) {
  const timestamp = new Date(scheduleAt).getTime();
  return Number.isFinite(timestamp) && timestamp <= now;
}
