/** Interactive prompt surface used by the LLM configuration wizard. */
export interface LLMConfigurationPrompter {
  ask(question: string, defaultValue?: string): Promise<string>;
  close?(): void;
}
