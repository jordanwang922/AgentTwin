import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

export function loadEnvFile(baseDir = process.cwd()) {
  const envPath = path.resolve(baseDir, ".env");

  if (!fs.existsSync(envPath)) {
    return;
  }

  dotenv.config({
    path: envPath,
    override: false,
    quiet: true
  });
}
