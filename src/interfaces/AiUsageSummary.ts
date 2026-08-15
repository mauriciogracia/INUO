/** Aggregated usage totals combined with live provider capacity data. */
export interface AiUsageSummary {
  model: string;
  requestCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  /** Live from provider API — input context window size in tokens. */
  contextWindowTokens?: number;
  /** Live from provider API — max output tokens per call. */
  maxOutputTokens?: number;
  /** Configured token budget (from GEMINI_TOKEN_BUDGET). */
  budgetMonthly?: number;
  /** 0–100, only present when budgetMonthly is set. */
  budgetUsedPct?: number;
}
