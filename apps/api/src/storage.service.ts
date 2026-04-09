import path from "node:path";
import { Injectable } from "@nestjs/common";
import { createStorageProvider } from "./storage-provider";

@Injectable()
export class StorageService {
  async getStatus() {
    const provider = createStorageProvider();
    const dataDir = process.env.AGENTTWIN_DATA_DIR ?? path.resolve(process.cwd(), "data");

    return {
      mode: provider.mode,
      dataDir,
      databaseConfigured: Boolean(process.env.DATABASE_URL),
      databaseUrlPreview: process.env.DATABASE_URL ? maskDatabaseUrl(process.env.DATABASE_URL) : null,
      connectionReady: await provider.checkConnection()
    };
  }
}

function maskDatabaseUrl(databaseUrl: string) {
  try {
    const parsed = new URL(databaseUrl);
    if (parsed.password) {
      parsed.password = "***";
    }
    return parsed.toString();
  } catch {
    return "[invalid DATABASE_URL]";
  }
}
