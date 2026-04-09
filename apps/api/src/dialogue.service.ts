import { Injectable, Optional } from "@nestjs/common";
import type { DialogueTurn } from "@agenttwin/core";
import {
  createFileStateRepository,
  resolveDefaultStateRepository,
  type StateRepository
} from "./storage-repositories";

interface DialogueSnapshot {
  sessions: Record<string, DialogueTurn[]>;
}

const defaultSnapshot: DialogueSnapshot = {
  sessions: {}
};

@Injectable()
export class DialogueService {
  private readonly repository: StateRepository<DialogueSnapshot>;
  private readonly ready: Promise<void>;
  private snapshot: DialogueSnapshot = structuredClone(defaultSnapshot);

  constructor(@Optional() repositoryOrFilePath?: StateRepository<DialogueSnapshot> | string) {
    this.repository =
      typeof repositoryOrFilePath === "string"
        ? createFileStateRepository(repositoryOrFilePath, structuredClone(defaultSnapshot))
        : repositoryOrFilePath ??
          resolveDefaultStateRepository("dialogue-state.json", "dialogue_state", structuredClone(defaultSnapshot));
    this.ready = this.hydrate();
  }

  async append(sessionId: string, message: string, role: "user" | "assistant" = "user") {
    await this.ready;
    const turns = this.snapshot.sessions[sessionId] ?? [];
    turns.push({
      role,
      message,
      createdAt: new Date().toISOString()
    });
    this.snapshot.sessions[sessionId] = turns.slice(-3);
    await this.repository.save(this.snapshot);
  }

  async getRecentTurns(sessionId: string) {
    await this.ready;
    return [...(this.snapshot.sessions[sessionId] ?? [])];
  }

  private async hydrate() {
    this.snapshot = await this.repository.load();
  }
}
