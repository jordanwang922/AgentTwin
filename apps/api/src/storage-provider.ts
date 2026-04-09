import { Client } from "pg";
import {
  createFileKnowledgeCatalogRepository,
  createFileRoutingConfigRepository,
  createFileRuntimeStoreRepository,
  createPostgresKnowledgeCatalogRepository,
  createPostgresRoutingConfigRepository,
  createPostgresRuntimeStoreRepository,
  type KnowledgeCatalogRepository,
  type RoutingConfigRepository,
  type RuntimeStoreRepository
} from "./storage-repositories";
import { resolveStorageMode, type AgentTwinStorageMode } from "./storage-mode";

export interface StorageProvider {
  mode: AgentTwinStorageMode;
  databaseUrl?: string;
  checkConnection(): Promise<boolean>;
  createRuntimeStoreRepository(): RuntimeStoreRepository;
  createKnowledgeCatalogRepository(): KnowledgeCatalogRepository;
  createRoutingConfigRepository(): RoutingConfigRepository;
}

class FileStorageProvider implements StorageProvider {
  readonly mode: AgentTwinStorageMode = "file";

  async checkConnection(): Promise<boolean> {
    return true;
  }

  createRuntimeStoreRepository() {
    return createFileRuntimeStoreRepository();
  }

  createKnowledgeCatalogRepository() {
    return createFileKnowledgeCatalogRepository();
  }

  createRoutingConfigRepository() {
    return createFileRoutingConfigRepository();
  }
}

class PostgresStorageProvider implements StorageProvider {
  readonly mode: AgentTwinStorageMode = "postgres";

  constructor(readonly databaseUrl: string) {}

  async checkConnection(): Promise<boolean> {
    const client = new Client({ connectionString: this.databaseUrl });

    try {
      await client.connect();
      await client.query("select 1");
      return true;
    } catch {
      return false;
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  createRuntimeStoreRepository() {
    return createPostgresRuntimeStoreRepository(this.databaseUrl);
  }

  createKnowledgeCatalogRepository() {
    return createPostgresKnowledgeCatalogRepository(this.databaseUrl);
  }

  createRoutingConfigRepository() {
    return createPostgresRoutingConfigRepository(this.databaseUrl);
  }
}

export function createStorageProvider(env: NodeJS.ProcessEnv = process.env): StorageProvider {
  const mode = resolveStorageMode(env);

  if (mode === "postgres" && env.DATABASE_URL) {
    return new PostgresStorageProvider(env.DATABASE_URL);
  }

  return new FileStorageProvider();
}
