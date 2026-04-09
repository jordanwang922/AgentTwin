import fs from "node:fs";
import path from "node:path";

const logPath = path.resolve("docs/dev-logs/agenttwin_development_log.md");
const archiveDir = path.resolve("docs/dev-logs/archive");
const timestamp = new Date().toISOString().replace(/[:]/g, "-").replace(/\..+/, "");

const header = `# AgentTwin Development Log

## Active Log Policy

- Record every meaningful delivery milestone.
- Rotate this file when it exceeds 500 lines.
- Use \`npm run log:rotate\` from \`modules/AgentTwin\`.

## Entries
`;

const content = fs.readFileSync(logPath, "utf8");
const lineCount = content.split("\n").length;

if (lineCount <= 500) {
  console.log(`No rotation needed. Active log has ${lineCount} lines.`);
  process.exit(0);
}

fs.mkdirSync(archiveDir, { recursive: true });

const archivePath = path.join(archiveDir, `agenttwin_development_log-${timestamp}.md`);
fs.copyFileSync(logPath, archivePath);
fs.writeFileSync(logPath, header, "utf8");

console.log(`Rotated development log to ${archivePath}`);
