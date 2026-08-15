/** Non-secret configuration for an LLM provider engine. */
export interface LLMConfiguration {
  id: string;
  configurationName: string;
  engineName: string;
  model: string;
  baseUrl?: string;
  credentialEnvironmentVariable?: string;
  supportsPlanMode: boolean;
  supportsExecuteMode: boolean;
  createdAt: string;
  updatedAt: string;
}
