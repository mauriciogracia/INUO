/** Single LLM call record persisted for usage tracking. */
export interface AiUsageRecord {
  id: string;
  model: string;
  /** Truncated user input or intent type — not the full prompt. */
  command: string;
  inputTokens: number;
  outputTokens: number;
  timestamp: string;
}
