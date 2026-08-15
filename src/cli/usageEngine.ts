import { GoogleGenAI } from "@google/genai";
import { loadEnvironment } from "./environment";
import { AiUsageSummary } from "../interfaces/AiUsageSummary";

// In-memory session totals — reset on process restart, never written to disk.
let _sessionRequests = 0;
let _sessionInputTokens = 0;
let _sessionOutputTokens = 0;
let _sessionModel = "";

export function addSessionTokens(
  inputTokens: number,
  outputTokens: number,
  model: string,
): void {
  _sessionRequests += 1;
  _sessionInputTokens += inputTokens;
  _sessionOutputTokens += outputTokens;
  _sessionModel = model;
}

export function getSessionStats(): Pick<
  AiUsageSummary,
  | "requestCount"
  | "totalInputTokens"
  | "totalOutputTokens"
  | "totalTokens"
  | "model"
> {
  return {
    model: _sessionModel,
    requestCount: _sessionRequests,
    totalInputTokens: _sessionInputTokens,
    totalOutputTokens: _sessionOutputTokens,
    totalTokens: _sessionInputTokens + _sessionOutputTokens,
  };
}

export function resetSessionStats(): void {
  _sessionRequests = 0;
  _sessionInputTokens = 0;
  _sessionOutputTokens = 0;
  _sessionModel = "";
}

/** Queries the provider API for real model capacity data. */
export async function queryProviderCapacity(
  rootDir: string = process.cwd(),
): Promise<
  | {
      connected: true;
      contextWindowTokens: number;
      maxOutputTokens: number;
      model: string;
    }
  | { connected: false; error: string }
> {
  const env = loadEnvironment(rootDir);
  if (!env.geminiApiKey) {
    return {
      connected: false,
      error: "No API key configured. Run: key <YOUR_GEMINI_API_KEY>",
    };
  }
  try {
    const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });
    const m = await ai.models.get({ model: env.defaultModel });
    return {
      connected: true,
      model: m.name ?? env.defaultModel,
      contextWindowTokens: m.inputTokenLimit ?? 0,
      maxOutputTokens: m.outputTokenLimit ?? 0,
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
  capacity: Awaited<ReturnType<typeof queryProviderCapacity>>,
  session: ReturnType<typeof getSessionStats>,
  budgetMonthly?: number,
): string {
  const modelLabel = capacity.connected
    ? capacity.model
    : session.model || "unknown";
  const lines: string[] = [`=== AI Usage — ${modelLabel} ===\n`];

  lines.push("[Provider]");
  if (capacity.connected) {
    lines.push(
      `Context window:   ${fmtTokens(capacity.contextWindowTokens)} tokens (input)`,
    );
    lines.push(
      `Max output:       ${fmtTokens(capacity.maxOutputTokens)} tokens`,
    );
    lines.push("API status:       ✔ Connected\n");
  } else {
    lines.push(`API status:       ✖ ${capacity.error}\n`);
  }

  lines.push("[Session usage]");
  if (session.requestCount === 0) {
    lines.push("No LLM calls in this session yet.");
  } else {
    lines.push(`Requests:         ${session.requestCount}`);
    lines.push(`Input tokens:     ${fmtTokens(session.totalInputTokens)}`);
    lines.push(`Output tokens:    ${fmtTokens(session.totalOutputTokens)}`);
    if (budgetMonthly) {
      const pct = Math.min(
        100,
        Math.round((session.totalTokens / budgetMonthly) * 100),
      );
      lines.push(
        `Total tokens:     ${fmtTokens(session.totalTokens)} / ${fmtTokens(budgetMonthly)} (${pct}%)  ${bar(pct)}`,
      );
      lines.push(
        `Remaining:        ${fmtTokens(Math.max(0, budgetMonthly - session.totalTokens))} tokens`,
      );
    } else {
      lines.push(`Total tokens:     ${fmtTokens(session.totalTokens)}`);
      lines.push(
        "\nTip: set GEMINI_TOKEN_BUDGET=500000 in .env to track remaining budget.",
      );
    }
  }

  return lines.join("\n");
}
