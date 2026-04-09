import fs from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";
import type {
  AuditLogEntry,
  ChannelProfile,
  FaqEntry,
  GroupProfile,
  KnowledgeArticle,
  MessageLogEntry,
  RiskRule,
  TenantProfile
} from "@agenttwin/core";
import {
  demoChannelProfile,
  demoFaqEntries,
  demoGroupProfile,
  demoKnowledgeArticles,
  demoRiskRules,
  demoTenantProfile
} from "@agenttwin/core";

export interface RuntimeStoreSnapshot {
  messages: MessageLogEntry[];
  auditLogs: AuditLogEntry[];
}

export interface KnowledgeCatalogSnapshot {
  faq: FaqEntry[];
  articles: KnowledgeArticle[];
  riskRules: RiskRule[];
}

export interface RoutingConfigSnapshot {
  tenant: TenantProfile;
  channel: ChannelProfile;
  groups: GroupProfile[];
}

export interface RuntimeStoreRepository {
  load(): Promise<RuntimeStoreSnapshot>;
  save(snapshot: RuntimeStoreSnapshot): Promise<void>;
}

export interface KnowledgeCatalogRepository {
  load(): Promise<KnowledgeCatalogSnapshot>;
  save(snapshot: KnowledgeCatalogSnapshot): Promise<void>;
}

export interface RoutingConfigRepository {
  load(): Promise<RoutingConfigSnapshot>;
  save(snapshot: RoutingConfigSnapshot): Promise<void>;
}

export interface StateRepository<T> {
  load(): Promise<T>;
  save(snapshot: T): Promise<void>;
}

export function createFileRuntimeStoreRepository(filePath = resolveDataFile("runtime-store.json")): RuntimeStoreRepository {
  return createJsonFileRepository(filePath, { messages: [], auditLogs: [] });
}

export function createFileKnowledgeCatalogRepository(
  filePath = resolveDataFile("knowledge-catalog.json")
): KnowledgeCatalogRepository {
  return createJsonFileRepository(filePath, {
    faq: [...demoFaqEntries],
    articles: [...demoKnowledgeArticles],
    riskRules: [...demoRiskRules]
  });
}

export function createFileRoutingConfigRepository(filePath = resolveDataFile("routing-config.json")): RoutingConfigRepository {
  return createJsonFileRepository(filePath, {
    tenant: demoTenantProfile,
    channel: demoChannelProfile,
    groups: [demoGroupProfile]
  });
}

export function createPostgresRuntimeStoreRepository(databaseUrl: string): RuntimeStoreRepository {
  return createPostgresJsonRepository(databaseUrl, "runtime_store", { messages: [], auditLogs: [] });
}

export function createPostgresKnowledgeCatalogRepository(databaseUrl: string): KnowledgeCatalogRepository {
  return createPostgresJsonRepository(databaseUrl, "knowledge_catalog", {
    faq: [...demoFaqEntries],
    articles: [...demoKnowledgeArticles],
    riskRules: [...demoRiskRules]
  });
}

export function createPostgresRoutingConfigRepository(databaseUrl: string): RoutingConfigRepository {
  return createPostgresJsonRepository(databaseUrl, "routing_config", {
    tenant: demoTenantProfile,
    channel: demoChannelProfile,
    groups: [demoGroupProfile]
  });
}

function createJsonFileRepository<T>(filePath: string, fallback: T) {
  return {
    async load(): Promise<T> {
      try {
        const content = await fs.readFile(filePath, "utf8");
        if (!content.trim()) {
          await ensureDirectory(filePath);
          await fs.writeFile(filePath, JSON.stringify(fallback, null, 2), "utf8");
          return structuredClone(fallback);
        }
        return JSON.parse(content) as T;
      } catch {
        await ensureDirectory(filePath);
        await fs.writeFile(filePath, JSON.stringify(fallback, null, 2), "utf8");
        return structuredClone(fallback);
      }
    },
    async save(snapshot: T) {
      await ensureDirectory(filePath);
      await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2), "utf8");
    }
  };
}

function createPostgresJsonRepository<T>(databaseUrl: string, stateKey: string, fallback: T) {
  return {
    async load(): Promise<T> {
      const client = new Client({ connectionString: databaseUrl });

      try {
        await client.connect();
        const result = await client.query<{ payload: T }>(
          "select payload from agenttwin_state where state_key = $1",
          [stateKey]
        );

        if (result.rows[0]?.payload) {
          return result.rows[0].payload;
        }

        await client.query(
          "insert into agenttwin_state (state_key, payload) values ($1, $2::jsonb) on conflict (state_key) do nothing",
          [stateKey, JSON.stringify(fallback)]
        );
        return structuredClone(fallback);
      } finally {
        await client.end().catch(() => undefined);
      }
    },
    async save(snapshot: T) {
      const client = new Client({ connectionString: databaseUrl });

      try {
        await client.connect();
        await client.query(
          `insert into agenttwin_state (state_key, payload)
           values ($1, $2::jsonb)
           on conflict (state_key) do update
           set payload = excluded.payload,
               updated_at = now()`,
          [stateKey, JSON.stringify(snapshot)]
        );
      } finally {
        await client.end().catch(() => undefined);
      }
    }
  };
}

export function createFileStateRepository<T>(filePath: string, fallback: T): StateRepository<T> {
  return createJsonFileRepository(filePath, fallback);
}

export function createPostgresStateRepository<T>(
  databaseUrl: string,
  stateKey: string,
  fallback: T
): StateRepository<T> {
  return createPostgresJsonRepository(databaseUrl, stateKey, fallback);
}

export function resolveDefaultStateRepository<T>(
  fileName: string,
  stateKey: string,
  fallback: T,
  env: NodeJS.ProcessEnv = process.env
): StateRepository<T> {
  if (env.AGENTTWIN_STORAGE_MODE === "postgres" && env.DATABASE_URL) {
    return createPostgresStateRepository(env.DATABASE_URL, stateKey, fallback);
  }

  return createFileStateRepository(resolveDataFile(fileName), fallback);
}

async function ensureDirectory(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

function resolveDataFile(fileName: string) {
  const dataDir = process.env.AGENTTWIN_DATA_DIR ?? path.resolve(process.cwd(), "data");
  return path.join(dataDir, fileName);
}

export { resolveDataFile };
