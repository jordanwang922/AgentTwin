export interface AgentTwinEnv {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  redisUrl: string;
  defaultTenant: string;
  defaultChannel: string;
  defaultGroup: string;
}

export function readEnv(env: NodeJS.ProcessEnv = process.env): AgentTwinEnv {
  return {
    nodeEnv: env.NODE_ENV ?? "development",
    port: Number(env.PORT ?? 3100),
    databaseUrl: env.DATABASE_URL ?? "",
    redisUrl: env.REDIS_URL ?? "",
    defaultTenant: env.AGENTTWIN_DEFAULT_TENANT ?? "demo-tenant",
    defaultChannel: env.AGENTTWIN_DEFAULT_CHANNEL ?? "wecom-demo",
    defaultGroup: env.AGENTTWIN_DEFAULT_GROUP ?? "parents-group"
  };
}
