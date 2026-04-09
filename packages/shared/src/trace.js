"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTraceId = createTraceId;
function createTraceId(seed = Date.now()) {
    return `trace_${seed}_${Math.random().toString(36).slice(2, 8)}`;
}
