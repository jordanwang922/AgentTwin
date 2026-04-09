export function createTraceId(seed = Date.now()): string {
  return `trace_${seed}_${Math.random().toString(36).slice(2, 8)}`;
}
