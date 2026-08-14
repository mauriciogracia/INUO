export interface Environment {
  /** Google Gemini API Key */
  geminiApiKey: string;
  
  /** Specification version */
  specVersion: string;
  
  /** CLI version */
  cliVersion: string;
  
  /** Root directory of the repository */
  rootDir: string;
  
  /** Path to inuo-manifest.json */
  manifestPath: string;
  
  /** Path to INUO_SPEC.md */
  specPath: string;
  
  /** Path to .inuo-state.json */
  statePath: string;
  
  /** Path to local environment key configuration */
  configPath: string;
  
  /** Default Gemini model identifier */
  defaultModel: string;
}
