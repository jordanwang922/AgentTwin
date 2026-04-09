import { createStorageProvider } from "../src/storage-provider";
import { resolveStorageMode } from "../src/storage-mode";

describe("storage mode resolution", () => {
  it("defaults to file mode when nothing is configured", () => {
    expect(resolveStorageMode({})).toBe("file");
  });

  it("accepts postgres mode when explicitly configured", () => {
    expect(resolveStorageMode({ AGENTTWIN_STORAGE_MODE: "postgres" })).toBe("postgres");
  });

  it("falls back to file mode for unknown values", () => {
    expect(resolveStorageMode({ AGENTTWIN_STORAGE_MODE: "unknown" })).toBe("file");
  });

  it("creates a postgres storage provider when postgres mode is configured", () => {
    const provider = createStorageProvider({
      AGENTTWIN_STORAGE_MODE: "postgres",
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/agenttwin"
    });

    expect(provider.mode).toBe("postgres");
  });
});
