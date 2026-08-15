import { getProjectPaths, loadState, saveState } from "./context";
import { CostGovernanceConfig } from "../interfaces/CostGovernanceConfig";
import { getI18n } from "../i18n";
import { askInteractiveQuestion } from "./questionEngine";
import { writeOutput } from "./outputRouter";
import { OutputChannelEnum } from "../enums/OutputChannelEnum";

export const DEFAULT_FREE_MODEL = "gemini-flash-latest";
export const DEFAULT_PAID_MODEL = "gemini-pro-latest";

export const DEFAULT_FREE_POOL: string[] = [
  "gemini-flash-latest",
  "gemini-3.7-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3-flash-preview",
];

export const DEFAULT_PAID_POOL: string[] = [
  "gemini-pro-latest",
  "gemini-3.1-pro-preview",
];

/**
 * Loads or initializes the Cost Governance & Tier Fallback configuration.
 */
export function getCostGovernanceConfig(
  rootDir: string = process.cwd(),
): CostGovernanceConfig {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);

  if (!state.costGovernance) {
    state.costGovernance = {
      tierMode: "FreeTierFirst",
      freeTierStatus: "Available",
      paidTierConsent: false,
      preferredFreeModel: DEFAULT_FREE_MODEL,
      preferredPaidModel: DEFAULT_PAID_MODEL,
      freeModelsPool: [...DEFAULT_FREE_POOL],
      paidModelsPool: [...DEFAULT_PAID_POOL],
      exhaustedFreeModels: [],
      activeModel: DEFAULT_FREE_MODEL,
      updatedAt: new Date().toISOString(),
    };
    saveState(paths.statePath, state);
  }

  // Ensure pools exist
  if (!state.costGovernance.freeModelsPool) {
    state.costGovernance.freeModelsPool = [...DEFAULT_FREE_POOL];
  }
  if (!state.costGovernance.paidModelsPool) {
    state.costGovernance.paidModelsPool = [...DEFAULT_PAID_POOL];
  }
  if (!state.costGovernance.exhaustedFreeModels) {
    state.costGovernance.exhaustedFreeModels = [];
  }

  return state.costGovernance;
}

/**
 * Persists the Cost Governance & Tier Fallback configuration.
 */
export function saveCostGovernanceConfig(
  config: CostGovernanceConfig,
  rootDir: string = process.cwd(),
): CostGovernanceConfig {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  config.updatedAt = new Date().toISOString();
  state.costGovernance = config;
  saveState(paths.statePath, state);
  return config;
}

/**
 * Retrieves the next available (unexhausted) free model from the configured pool.
 */
export function getNextAvailableFreeModel(
  rootDir: string = process.cwd(),
): { model: string; isAvailable: boolean } {
  const config = getCostGovernanceConfig(rootDir);
  const pool = config.freeModelsPool || DEFAULT_FREE_POOL;
  const exhausted = new Set(config.exhaustedFreeModels || []);

  const candidate = pool.find((m) => !exhausted.has(m));
  if (candidate) {
    return { model: candidate, isAvailable: true };
  }

  return {
    model: config.preferredFreeModel || DEFAULT_FREE_MODEL,
    isAvailable: false,
  };
}

/**
 * Resolves the active model based on Free-Tier First policy, cascading pool health, and paid consent.
 */
export function getActiveTierModel(
  rootDir: string = process.cwd(),
): { model: string; isPaid: boolean; requiresConsent: boolean } {
  const config = getCostGovernanceConfig(rootDir);

  // If user has explicitly authorized paid models and selected one
  if (config.paidTierConsent && config.selectedPaidModel) {
    return {
      model: config.selectedPaidModel,
      isPaid: true,
      requiresConsent: false,
    };
  }

  if (config.tierMode === "PaidAllowed" && config.paidTierConsent) {
    return {
      model: config.preferredPaidModel || DEFAULT_PAID_MODEL,
      isPaid: true,
      requiresConsent: false,
    };
  }

  // Evaluate cascading free pool
  const freeCandidate = getNextAvailableFreeModel(rootDir);
  if (freeCandidate.isAvailable && config.tierMode !== "FreeOnly") {
    return {
      model: freeCandidate.model,
      isPaid: false,
      requiresConsent: false,
    };
  }

  // All free models exhausted
  if (!freeCandidate.isAvailable) {
    if (config.paidTierConsent) {
      return {
        model: config.selectedPaidModel || config.preferredPaidModel || DEFAULT_PAID_MODEL,
        isPaid: true,
        requiresConsent: false,
      };
    }
    return {
      model: config.preferredFreeModel || DEFAULT_FREE_MODEL,
      isPaid: false,
      requiresConsent: true,
    };
  }

  return {
    model: config.preferredFreeModel || DEFAULT_FREE_MODEL,
    isPaid: false,
    requiresConsent: false,
  };
}

/**
 * Records model exhaustion and cascades to the next available free model or triggers paid selection.
 */
export function recordModelExhaustion(
  modelName: string,
  lang: string = "es",
  rootDir: string = process.cwd(),
): { cascadedModel?: string; allExhausted: boolean; message: string } {
  const config = getCostGovernanceConfig(rootDir);
  if (!config.exhaustedFreeModels) config.exhaustedFreeModels = [];
  if (!config.exhaustedFreeModels.includes(modelName)) {
    config.exhaustedFreeModels.push(modelName);
  }
  saveCostGovernanceConfig(config, rootDir);

  const dict = getI18n(lang);
  const nextFree = getNextAvailableFreeModel(rootDir);

  if (nextFree.isAvailable) {
    config.activeModel = nextFree.model;
    saveCostGovernanceConfig(config, rootDir);
    const msg = `${dict.costGovernance.cascadingFreeModel} ${nextFree.model}`;
    writeOutput(OutputChannelEnum.USER_REPLY, msg);
    return {
      cascadedModel: nextFree.model,
      allExhausted: false,
      message: msg,
    };
  }

  // All free models exhausted!
  config.freeTierStatus = "Exhausted";
  config.lastExhaustedAt = new Date().toISOString();
  saveCostGovernanceConfig(config, rootDir);

  const promptMsg = triggerPaidSelectionPrompt(lang, rootDir);
  return {
    allExhausted: true,
    message: promptMsg,
  };
}

/**
 * Prompts the user with an interactive question to select from available paid models or wait.
 */
export function triggerPaidSelectionPrompt(
  lang: string = "es",
  rootDir: string = process.cwd(),
): string {
  const config = getCostGovernanceConfig(rootDir);
  const dict = getI18n(lang);
  const paidOptions = (config.paidModelsPool || DEFAULT_PAID_POOL).map(
    (m) => `tier select ${m}`,
  );
  paidOptions.push("tier consent no");

  askInteractiveQuestion(
    "SingleChoice",
    dict.costGovernance.allFreeModelsExhaustedPrompt,
    paidOptions,
    undefined,
    rootDir,
  );

  return dict.costGovernance.allFreeModelsExhaustedPrompt;
}

/**
 * Explicitly selects and authorizes a specific paid model with human confirmation.
 */
export function selectPaidModelWithConsent(
  modelName: string,
  lang: string = "es",
  rootDir: string = process.cwd(),
): string {
  const config = getCostGovernanceConfig(rootDir);
  config.paidTierConsent = true;
  config.tierMode = "PaidAllowed";
  config.selectedPaidModel = modelName;
  config.preferredPaidModel = modelName;
  config.activeModel = modelName;
  saveCostGovernanceConfig(config, rootDir);

  const dict = getI18n(lang);
  const msg = `${dict.costGovernance.paidModelSelected} ${modelName}`;
  writeOutput(OutputChannelEnum.USER_REPLY, msg);
  return msg;
}

/**
 * Updates user consent for using paid models in general.
 */
export function grantPaidTierConsent(
  allowed: boolean,
  lang: string = "es",
  rootDir: string = process.cwd(),
): string {
  const config = getCostGovernanceConfig(rootDir);
  config.paidTierConsent = allowed;
  config.tierMode = allowed ? "PaidAllowed" : "FreeOnly";
  config.activeModel = allowed
    ? config.selectedPaidModel || config.preferredPaidModel || DEFAULT_PAID_MODEL
    : config.preferredFreeModel || DEFAULT_FREE_MODEL;
  saveCostGovernanceConfig(config, rootDir);

  const dict = getI18n(lang);
  const msg = allowed
    ? `${dict.costGovernance.paidConsentGranted} (${config.activeModel})`
    : `${dict.costGovernance.paidConsentRevoked} (${config.activeModel})`;

  writeOutput(OutputChannelEnum.USER_REPLY, msg);
  return msg;
}

/**
 * Handles generic free tier exhaustion.
 */
export function handleFreeTierExhaustion(
  lang: string = "es",
  rootDir: string = process.cwd(),
): string {
  const active = getActiveTierModel(rootDir);
  const res = recordModelExhaustion(active.model, lang, rootDir);
  return res.message;
}

/**
 * Configures the preferred model for a given tier (free or paid).
 */
export function setTierModel(
  tierType: "free" | "paid",
  modelName: string,
  rootDir: string = process.cwd(),
): CostGovernanceConfig {
  const config = getCostGovernanceConfig(rootDir);
  if (tierType === "free") {
    config.preferredFreeModel = modelName;
    if (!config.paidTierConsent) config.activeModel = modelName;
  } else {
    config.preferredPaidModel = modelName;
    config.selectedPaidModel = modelName;
    if (config.paidTierConsent) config.activeModel = modelName;
  }
  return saveCostGovernanceConfig(config, rootDir);
}

/**
 * Resets the free tier status and clears the exhausted models list.
 */
export function resetFreeTierStatus(
  rootDir: string = process.cwd(),
): CostGovernanceConfig {
  const config = getCostGovernanceConfig(rootDir);
  config.freeTierStatus = "Available";
  config.exhaustedFreeModels = [];
  config.paidTierConsent = false;
  config.tierMode = "FreeTierFirst";
  config.selectedPaidModel = undefined;
  config.activeModel = config.preferredFreeModel || DEFAULT_FREE_MODEL;
  return saveCostGovernanceConfig(config, rootDir);
}

/**
 * Adds a model candidate to the free or paid pool.
 */
export function addModelToPool(
  poolType: "free" | "paid",
  modelName: string,
  rootDir: string = process.cwd(),
): CostGovernanceConfig {
  const config = getCostGovernanceConfig(rootDir);
  if (poolType === "free") {
    if (!config.freeModelsPool.includes(modelName)) {
      config.freeModelsPool.push(modelName);
    }
  } else {
    if (!config.paidModelsPool.includes(modelName)) {
      config.paidModelsPool.push(modelName);
    }
  }
  return saveCostGovernanceConfig(config, rootDir);
}

/**
 * Removes a model candidate from the free or paid pool.
 */
export function removeModelFromPool(
  poolType: "free" | "paid",
  modelName: string,
  rootDir: string = process.cwd(),
): CostGovernanceConfig {
  const config = getCostGovernanceConfig(rootDir);
  if (poolType === "free") {
    config.freeModelsPool = config.freeModelsPool.filter((m) => m !== modelName);
  } else {
    config.paidModelsPool = config.paidModelsPool.filter((m) => m !== modelName);
  }
  return saveCostGovernanceConfig(config, rootDir);
}
