import { getProjectPaths, loadState, saveState } from "./context";
import { AiUsageRecord } from "../interfaces/AiUsageRecord";
import { AiUsageSummary } from "../interfaces/AiUsageSummary";

const MAX_LOG = 1000;

export function recordUsage(
  record: Omit<AiUsageRecord, "id">,
  rootDir: string = process.cwd(),
): void {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  const entry: AiUsageRecord = { id: `ai_${Date.now()}`, ...record };
  state.aiUsageLog = [...(state.aiUsageLog ?? []), entry].slice(-MAX_LOG);
  saveState(paths.statePath, state);
}

export function getSummary(rootDir: string = process.cwd()): AiUsageSummary {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  const log = state.aiUsageLog ?? [];

  const totalInputTokens = log.reduce((s, r) => s + r.inputTokens, 0);
  const totalOutputTokens = log.reduce((s, r) => s + r.outputTokens, 0);

  return {
    model: log[log.length - 1]?.model ?? "unknown",
    requestCount: log.length,
    totalInputTokens,
    totalOutputTokens,
    totalTokens: totalInputTokens + totalOutputTokens,
    periodStart: log[0]?.timestamp ?? new Date().toISOString(),
  };
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function formatUsageDisplay(summary: AiUsageSummary): string {
  const {
    requestCount,
    totalInputTokens,
    totalOutputTokens,
    totalTokens,
    model,
    periodStart,
  } = summary;
  if (requestCount === 0)
    return "=== AI Usage ===\n\nNo LLM calls recorded yet.";
  return [
    `=== AI Usage — ${model} ===\n`,
    `Requests:       ${requestCount}`,
    `Input tokens:   ${fmtTokens(totalInputTokens)}`,
    `Output tokens:  ${fmtTokens(totalOutputTokens)}`,
    `Total tokens:   ${fmtTokens(totalTokens)}`,
    `\nPeriod start:   ${periodStart}`,
  ].join("\n");
}

export function resetUsage(rootDir: string = process.cwd()): void {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  state.aiUsageLog = [];
  saveState(paths.statePath, state);
}
