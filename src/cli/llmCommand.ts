import readline from "readline";
import { getProjectPaths, loadState, saveState } from "./context";
import { LLMConfiguration } from "../interfaces/LLMConfiguration";
import { LLMConfigurationInput } from "../interfaces/LLMConfigurationInput";
import { LLMConfigurationPrompter } from "../interfaces/LLMConfigurationPrompter";
import { LLMProviderSetup } from "../interfaces/LLMProviderSetup";

const PROVIDER_ALIASES: Record<string, string> = {
  google: "gemini",
  gemini: "gemini",
  gpt: "openai",
  openai: "openai",
  claude: "anthropic",
  anthropic: "anthropic",
  local: "ollama",
  ollama: "ollama",
  groq: "groq",
  deepseek: "deepseek",
  mistral: "mistral",
  openrouter: "openrouter",
  copilot: "copilot",
};

const PROVIDER_DEFAULTS: Record<
  string,
  {
    model: string;
    baseUrl?: string;
    credentialEnvironmentVariable?: string;
    documentationUrl: string;
    supportsPlanMode: boolean;
    supportsExecuteMode: boolean;
  }
> = {
  gemini: {
    model: "gemini-flash-latest",
    credentialEnvironmentVariable: "GEMINI_API_KEY",
    documentationUrl: "https://ai.google.dev/gemini-api/docs/api-key",
    supportsPlanMode: true,
    supportsExecuteMode: true,
  },
  openai: {
    model: "gpt-4o-mini",
    baseUrl: "https://api.openai.com/v1",
    credentialEnvironmentVariable: "OPENAI_API_KEY",
    documentationUrl: "https://platform.openai.com/docs/quickstart",
    supportsPlanMode: true,
    supportsExecuteMode: true,
  },
  anthropic: {
    model: "claude-3-5-sonnet-20241022",
    credentialEnvironmentVariable: "ANTHROPIC_API_KEY",
    documentationUrl: "https://docs.anthropic.com/en/api/getting-started",
    supportsPlanMode: true,
    supportsExecuteMode: true,
  },
  groq: {
    model: "llama-3.3-70b-versatile",
    baseUrl: "https://api.groq.com/openai/v1",
    credentialEnvironmentVariable: "GROQ_API_KEY",
    documentationUrl: "https://console.groq.com/docs/quickstart",
    supportsPlanMode: true,
    supportsExecuteMode: true,
  },
  deepseek: {
    model: "deepseek-chat",
    baseUrl: "https://api.deepseek.com/v1",
    credentialEnvironmentVariable: "DEEPSEEK_API_KEY",
    documentationUrl: "https://platform.deepseek.com/docs",
    supportsPlanMode: true,
    supportsExecuteMode: false,
  },
  mistral: {
    model: "mistral-large-latest",
    baseUrl: "https://api.mistral.ai/v1",
    credentialEnvironmentVariable: "MISTRAL_API_KEY",
    documentationUrl: "https://docs.mistral.ai/getting-started/quickstart/",
    supportsPlanMode: true,
    supportsExecuteMode: true,
  },
  openrouter: {
    model: "google/gemini-2.0-flash-exp:free",
    baseUrl: "https://openrouter.ai/api/v1",
    credentialEnvironmentVariable: "OPENROUTER_API_KEY",
    documentationUrl: "https://openrouter.ai/docs",
    supportsPlanMode: true,
    supportsExecuteMode: false,
  },
  copilot: {
    model: "gpt-4.1",
    documentationUrl: "https://code.visualstudio.com/docs/copilot/overview",
    supportsPlanMode: true,
    supportsExecuteMode: false,
  },
  ollama: {
    model: "llama3.2",
    baseUrl: "http://localhost:11434",
    documentationUrl: "https://ollama.com/download",
    supportsPlanMode: true,
    supportsExecuteMode: false,
  },
};

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  return ["yes", "y", "true", "on", "1"].includes(value.toLowerCase());
}

function getFlag(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function normalizeName(value: string): string {
  return value.trim();
}

function isValidConfigurationName(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(value);
}

function printCredentialGuidance(configuration: LLMConfiguration): void {
  const canonicalEngine = PROVIDER_ALIASES[configuration.engineName.toLowerCase()] || configuration.engineName.toLowerCase();
  const defaults = PROVIDER_DEFAULTS[canonicalEngine];
  console.log(`\x1b[32m✔ [Autoconfig]\x1b[0m Configuration "${configuration.configurationName}" saved with model "${configuration.model}".`);
  console.log("No API key or secret was requested or stored in public state.");
  if (configuration.credentialEnvironmentVariable) {
    console.log(
      `Ensure ${configuration.credentialEnvironmentVariable} is set in your local .env or environment.`,
    );
  } else {
    console.log(
      "This engine profile (local / zero-auth) does not require a credential environment variable.",
    );
  }
  if (defaults?.documentationUrl) {
    console.log(`Provider setup guide: ${defaults.documentationUrl}`);
  }
}

export function getLLMProviderSetup(engineNameInput: string): LLMProviderSetup {
  const raw = engineNameInput.trim().toLowerCase();
  const engineName = PROVIDER_ALIASES[raw] || raw;
  const defaults = PROVIDER_DEFAULTS[engineName];
  return {
    engineName,
    defaultConfigurationName: `${engineName}-default`,
    defaultModel: defaults?.model || "custom-model",
    defaultBaseUrl: defaults?.baseUrl,
    credentialEnvironmentVariable: defaults?.credentialEnvironmentVariable,
    documentationUrl: defaults?.documentationUrl || undefined,
  };
}

export function getLLMConfigurations(
  rootDir: string = process.cwd(),
): LLMConfiguration[] {
  const paths = getProjectPaths(rootDir);
  return loadState(paths.statePath).llmConfigurations || [];
}

export function saveLLMConfiguration(
  input: LLMConfigurationInput,
  rootDir: string = process.cwd(),
): LLMConfiguration {
  const configurationName = normalizeName(input.configurationName);
  const rawEngine = input.engineName.trim().toLowerCase();
  const engineName = PROVIDER_ALIASES[rawEngine] || rawEngine;
  const model = input.model.trim();
  const baseUrl = input.baseUrl?.trim();

  if (!engineName) throw new Error("Engine name is required.");
  if (!isValidConfigurationName(configurationName)) {
    throw new Error(
      "Configuration name must contain only letters, numbers, dots, underscores, or hyphens (maximum 64 characters).",
    );
  }
  if (!model) throw new Error("A model is required.");

  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  if (!state.llmConfigurations) state.llmConfigurations = [];
  if (
    state.llmConfigurations.some(
      (item) =>
        item.configurationName.toLowerCase() ===
        configurationName.toLowerCase(),
    )
  ) {
    throw new Error(`LLM configuration "${configurationName}" already exists.`);
  }

  const timestamp = new Date().toISOString();
  const setup = getLLMProviderSetup(engineName);
  const configuration: LLMConfiguration = {
    id: `llm_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    configurationName,
    engineName,
    model,
    baseUrl: baseUrl || setup.defaultBaseUrl || undefined,
    credentialEnvironmentVariable: setup.credentialEnvironmentVariable,
    supportsPlanMode: input.supportsPlanMode !== false,
    supportsExecuteMode: input.supportsExecuteMode === true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  state.llmConfigurations.push(configuration);
  saveState(paths.statePath, state);
  return configuration;
}

export function deleteLLMConfiguration(
  configurationName: string,
  rootDir: string = process.cwd(),
): boolean {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  const configurations = state.llmConfigurations || [];
  const index = configurations.findIndex(
    (item) =>
      item.configurationName.toLowerCase() === configurationName.toLowerCase(),
  );
  if (index < 0) return false;

  configurations.splice(index, 1);
  state.llmConfigurations = configurations;
  saveState(paths.statePath, state);
  return true;
}

async function addConfiguration(
  engineNameInput: string,
  args: string[],
  rootDir: string,
  prompter?: LLMConfigurationPrompter,
): Promise<void> {
  const rawEngine = engineNameInput.trim().toLowerCase();
  if (!rawEngine) {
    console.log("Usage: llm add <engineName> [--name <name>] [--model <model>]");
    console.log("Supported recognized engines: gemini, openai, anthropic, ollama, groq, deepseek, mistral, openrouter");
    return;
  }

  const engineName = PROVIDER_ALIASES[rawEngine] || rawEngine;
  const setup = getLLMProviderSetup(engineName);
  const defaults = PROVIDER_DEFAULTS[engineName];

  let configurationName = getFlag(args, "--name");
  let model = getFlag(args, "--model");
  let baseUrl = getFlag(args, "--base-url");
  let planMode = getFlag(args, "--plan");
  let executeMode = getFlag(args, "--execute");

  // If interactive prompter is available and no explicit flags passed, prompt with auto-filled defaults
  if (prompter && !configurationName && !model) {
    configurationName = await prompter.ask(
      "Unique configuration name",
      setup.defaultConfigurationName,
    );
    model = await prompter.ask("Model name", setup.defaultModel);
    baseUrl = await prompter.ask(
      "Base URL (leave blank for provider default)",
      setup.defaultBaseUrl || "",
    );
    planMode = await prompter.ask("Supports plan mode? (yes/no)", defaults?.supportsPlanMode ? "yes" : "no");
    executeMode = await prompter.ask("Supports execute/tool mode? (yes/no)", defaults?.supportsExecuteMode ? "yes" : "no");
  }

  // If non-interactive and no flags, autoconfigure with provider preset defaults!
  const finalName = configurationName || setup.defaultConfigurationName;
  const finalModel = model || setup.defaultModel;
  const finalBaseUrl = baseUrl || setup.defaultBaseUrl;
  const finalPlan = planMode !== undefined ? parseBoolean(planMode, true) : (defaults?.supportsPlanMode ?? true);
  const finalExecute = executeMode !== undefined ? parseBoolean(executeMode, false) : (defaults?.supportsExecuteMode ?? false);

  try {
    const configuration = saveLLMConfiguration(
      {
        configurationName: finalName,
        engineName,
        model: finalModel,
        baseUrl: finalBaseUrl,
        supportsPlanMode: finalPlan,
        supportsExecuteMode: finalExecute,
      },
      rootDir,
    );
    printCredentialGuidance(configuration);
  } catch (error) {
    console.log((error as Error).message);
  }
}

function removeConfiguration(configurationName: string, rootDir: string): void {
  if (!deleteLLMConfiguration(configurationName, rootDir)) {
    console.log(`LLM configuration "${configurationName}" not found.`);
    return;
  }
  console.log(`Removed LLM configuration "${configurationName}".`);
}

function listConfigurations(rootDir: string): void {
  const configurations = getLLMConfigurations(rootDir);
  if (configurations.length === 0) {
    console.log("No LLM configurations saved. Use: llm add <engineName> (e.g. llm add gemini, llm add openai, llm add ollama)");
    return;
  }

  console.log("=== LLM Configurations ===");
  for (const item of configurations) {
    console.log(
      `${item.configurationName} | ${item.engineName} | ${item.model} | plan=${item.supportsPlanMode ? "yes" : "no"} | execute=${item.supportsExecuteMode ? "yes" : "no"}`,
    );
  }
}

function statusConfigurations(rootDir: string): void {
  const configurations = getLLMConfigurations(rootDir);
  if (configurations.length === 0) {
    console.log("LLM status: no configurations saved.");
    console.log("Use: llm add <engineName> (e.g. llm add gemini, llm add openai, llm add anthropic, llm add ollama)");
    return;
  }

  const byEngine = new Map<string, number>();
  let planCapable = 0;
  let executeCapable = 0;

  for (const config of configurations) {
    byEngine.set(config.engineName, (byEngine.get(config.engineName) || 0) + 1);
    if (config.supportsPlanMode) planCapable += 1;
    if (config.supportsExecuteMode) executeCapable += 1;
  }

  const engineSummary = Array.from(byEngine.entries())
    .map(([engineName, count]) => `${engineName}=${count}`)
    .join(", ");

  console.log("=== LLM Status ===");
  console.log(`Total configurations: ${configurations.length}`);
  console.log(`By engine: ${engineSummary}`);
  console.log(`Plan-capable profiles: ${planCapable}`);
  console.log(`Execute-capable profiles: ${executeCapable}`);

  for (const item of configurations) {
    const env = item.credentialEnvironmentVariable || "none";
    console.log(
      `- ${item.configurationName} | engine=${item.engineName} | model=${item.model} | env=${env} | plan=${item.supportsPlanMode ? "yes" : "no"} | execute=${item.supportsExecuteMode ? "yes" : "no"}`,
    );
  }
}

export function createTerminalLLMConfigurationPrompter(): LLMConfigurationPrompter {
  const prompt = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });
  return {
    ask(question, defaultValue) {
      const suffix = defaultValue ? ` [${defaultValue}]` : "";
      return new Promise((resolve) => {
        prompt.question(`${question}${suffix}: `, (answer) => {
          resolve(answer.trim() || defaultValue || "");
        });
      });
    },
    close() {
      prompt.close();
    },
  };
}

export async function runLLMCommand(
  args: string[],
  rootDir: string = process.cwd(),
  prompter?: LLMConfigurationPrompter,
): Promise<void> {
  const subcommand = args[0]?.toLowerCase() || "list";
  if (subcommand === "add") {
    await addConfiguration(args[1] || "", args.slice(2), rootDir, prompter);
    return;
  }
  if (subcommand === "remove") {
    if (!args[1]) {
      console.log("Usage: llm remove <configurationName>");
      return;
    }
    removeConfiguration(args[1], rootDir);
    return;
  }
  if (subcommand === "list") {
    listConfigurations(rootDir);
    return;
  }
  if (subcommand === "status") {
    statusConfigurations(rootDir);
    return;
  }
  console.log(
    "Unknown llm command. Supported: llm add <engineName>, llm remove <configurationName>, llm list, llm status",
  );
}
