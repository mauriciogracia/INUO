import { GoogleGenAI } from "@google/genai";
import { getProjectPaths, loadState, saveState } from "./context";
import { loadEnvironment } from "./environment";
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
  const env = loadEnvironment(rootDir);
  const log = state.aiUsageLog ?? [];

  const totalInputTokens = log.reduce((s, r) => s + r.inputTokens, 0);
  const totalOutputTokens = log.reduce((s, r) => s + r.outputTokens, 0);
  const totalTokens = totalInputTokens + totalOutputTokens;

  const summary: AiUsageSummary = {
    model: log[log.length - 1]?.model ?? env.defaultModel,
    requestCount: log.length,
    totalInputTokens,
    totalOutputTokens,
    totalTokens,
    periodStart: log[0]?.timestamp ?? new Date().toISOString(),
  };

  if (env.tokenBudgetMonthly) {
    summary.budgetMonthly = env.tokenBudgetMonthly;
    summary.budgetUsedPct = Math.min(
      100,
      Math.round((totalTokens / env.tokenBudgetMonthly) * 100),
    );
  }

  return summary;
}

/** Queries the provider API for real model capacity data. Returns null if no key is configured. */
export async function queryProviderCapacity(
  rootDir: string = process.cwd(),
): Promise<
  | { contextWindowTokens: number; maxOutputTokens: number; connected: true }
  | { connected: false; error: string }
> {
  const env = loadEnvironment(rootDir);
  if (!env.geminiApiKey)
    return {
      connected: false,
      error: "No API key configured. Run: key <YOUR_GEMINI_API_KEY>",
    };
  try {
    const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });
    const model = await ai.models.get({ model: env.defaultModel });
    return {
      connected: true,
      contextWindowTokens: model.inputTokenLimit ?? 0,
      maxOutputTokens: model.outputTokenLimit ?? 0,
    };
  } catch (err: any) {
    return { connected: false, error: err.message ?? "Unknown error" };
  }
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function bar(pct: number, width = 10): string {
  const filled = Math.round((pct / 100) * width);
  return "▓".repeat(filled) + "░".repeat(width - filled);
}

export function formatUsageDisplay(
  summary: AiUsageSummary,
  capacity?: {
    connected: boolean;
    contextWindowTokens?: number;
    maxOutputTokens?: number;
    error?: string;
  },
): string {
  const lines: string[] = [`=== AI Usage — ${summary.model} ===\n`];

  // Provider section
  if (capacity) {
    lines.push("[Provider]");
    if (capacity.connected) {
      lines.push(
        `Context window:   ${fmtTokens(capacity.contextWindowTokens!)} tokens (input)`,
      );
      lines.push(
        `Max output:       ${fmtTokens(capacity.maxOutputTokens!)} tokens`,
      );
      lines.push("API status:       ✔ Connected\n");
    } else {
      lines.push(`API status:       ✖ ${capacity.error}\n`);
    }
  }

  // Local tracking
  lines.push("[Session usage]");
  if (summary.requestCount === 0) {
    lines.push("No LLM calls recorded yet.");
  } else {
    lines.push(`Requests:         ${summary.requestCount}`);
    lines.push(`Input tokens:     ${fmtTokens(summary.totalInputTokens)}`);
    lines.push(`Output tokens:    ${fmtTokens(summary.totalOutputTokens)}`);
    if (summary.budgetMonthly) {
      const pct = summary.budgetUsedPct!;
      lines.push(
        `Total tokens:     ${fmtTokens(summary.totalTokens)} / ${fmtTokens(summary.budgetMonthly)} (${pct}%)  ${bar(pct)}`,
      );
      lines.push(
        `Remaining:        ${fmtTokens(summary.budgetMonthly - summary.totalTokens)} tokens`,
      );
    } else {
      lines.push(`Total tokens:     ${fmtTokens(summary.totalTokens)}`);
    }
    lines.push(`\nPeriod start:     ${summary.periodStart}`);
  }

  if (summary.budgetMonthly === undefined) {
    lines.push(
      "\nTip: set GEMINI_TOKEN_BUDGET=500000 in .env to track remaining budget.",
    );
  }

  return lines.join("\n");
}

export function resetUsage(rootDir: string = process.cwd()): void {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  state.aiUsageLog = [];
  saveState(paths.statePath, state);
}
