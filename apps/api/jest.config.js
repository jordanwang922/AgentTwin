module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["<rootDir>/test/**/*.spec.ts"],
  moduleNameMapper: {
    "^@agenttwin/core$": "<rootDir>/../../packages/core/src/index.ts",
    "^@agenttwin/shared$": "<rootDir>/../../packages/shared/src/index.ts",
    "^@agenttwin/wecom$": "<rootDir>/../../packages/wecom/src/index.ts",
    "^@agenttwin/rag$": "<rootDir>/../../packages/rag/src/index.ts",
    "^@agenttwin/llm$": "<rootDir>/../../packages/llm/src/index.ts"
  }
};
