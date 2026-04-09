export type AgentTwinStorageMode = "file" | "postgres";

export function resolveStorageMode(env: NodeJS.ProcessEnv = process.env): AgentTwinStorageMode {
  return env.AGENTTWIN_STORAGE_MODE === "postgres" ? "postgres" : "file";
}
