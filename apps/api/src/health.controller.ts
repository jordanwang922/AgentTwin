import { Controller, Get } from "@nestjs/common";
import { readEnv } from "@agenttwin/shared";

@Controller("health")
export class HealthController {
  @Get()
  getHealth() {
    const env = readEnv();

    return {
      service: "agenttwin-api",
      status: "ok",
      nodeEnv: env.nodeEnv,
      version: "0.1.0"
    };
  }
}
