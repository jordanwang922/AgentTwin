export interface AgentTwinEnv {
    nodeEnv: string;
    port: number;
    databaseUrl: string;
    redisUrl: string;
    defaultTenant: string;
    defaultChannel: string;
    defaultGroup: string;
}
export declare function readEnv(env?: NodeJS.ProcessEnv): AgentTwinEnv;
