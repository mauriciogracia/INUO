/** User-configurable, non-secret fields for an LLM provider profile. */
export interface LLMConfigurationInput {
  configurationName: string;
  engineName: string;
  model: string;
  baseUrl?: string;
  supportsPlanMode: boolean;
  supportsExecuteMode: boolean;
}
