import { createTraceId, loadEnvFile } from "@agenttwin/shared";

loadEnvFile(process.cwd());

const apiBaseUrl = process.env.AGENTTWIN_API_BASE_URL ?? "http://127.0.0.1:3100";
const pollIntervalMs = Number(process.env.AGENTTWIN_SOP_POLL_INTERVAL_MS ?? 30000);

console.log("[agenttwin-worker] booted", {
  traceId: createTraceId(),
  apiBaseUrl,
  pollIntervalMs,
  responsibilities: [
    "scheduled SOP task polling",
    "retryable task processing",
    "delivery trigger heartbeat"
  ]
});

void processPendingTasks();
setInterval(() => {
  void processPendingTasks();
}, pollIntervalMs);

async function processPendingTasks() {
  try {
    const response = await fetch(`${apiBaseUrl}/api/admin/sop/process-pending`, {
      method: "POST"
    });
    const payload = await response.json();
    console.log("[agenttwin-worker] poll cycle complete", payload);
  } catch (error) {
    console.error("[agenttwin-worker] poll cycle failed", error);
  }
}
