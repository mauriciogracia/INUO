/** Provider defaults and public setup guidance for configuration clients. */
export interface LLMProviderSetup {
  engineName: string;
  defaultConfigurationName: string;
  defaultModel: string;
  defaultBaseUrl?: string;
  credentialEnvironmentVariable?: string;
  documentationUrl?: string;
}
