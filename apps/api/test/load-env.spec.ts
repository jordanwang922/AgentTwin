import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadEnvFile } from "@agenttwin/shared";

describe("loadEnvFile", () => {
  it("loads values from a local .env file without overriding existing env", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "agenttwin-env-"));
    const envPath = path.join(tempDir, ".env");
    const previousNodeEnv = process.env.NODE_ENV;
    const previousPort = process.env.PORT;

    fs.writeFileSync(envPath, "NODE_ENV=production\nPORT=3200\n", "utf8");
    process.env.NODE_ENV = "test";
    delete process.env.PORT;

    loadEnvFile(tempDir);

    expect(process.env.NODE_ENV).toBe("test");
    expect(process.env.PORT).toBe("3200");

    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }

    if (previousPort === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = previousPort;
    }

    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});
