"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readEnv = readEnv;
function readEnv(env = process.env) {
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
