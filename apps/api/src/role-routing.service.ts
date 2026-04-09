import { Injectable } from "@nestjs/common";
import type { AssistantMode, RoleRoutingInput } from "@agenttwin/core";

@Injectable()
export class RoleRoutingService {
  async resolveMode(input: RoleRoutingInput): Promise<AssistantMode> {
    if (input.channel === "admin" || input.source === "teacher-console" || input.userId.startsWith("teacher-")) {
      return "teacher";
    }

    return "student";
  }
}
