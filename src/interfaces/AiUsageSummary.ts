/** Aggregated usage totals for display and budget evaluation. */
export interface AiUsageSummary {
  model: string;
  requestCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  /** ISO timestamp of the oldest record in the current log window. */
  periodStart: string;
}
