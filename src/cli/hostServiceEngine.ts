import { getProjectPaths, loadState, saveState } from "./context";
import { OperatingMode } from "../types/OperatingMode";
import { OperatingModeConfig } from "../interfaces/OperatingModeConfig";
import { getLocalizedHostGreeting } from "./languageEngine";
import { TOOL_NAME } from "./brand";

export function setOperatingMode(
  mode: OperatingMode,
  rootDir: string = process.cwd(),
): OperatingModeConfig {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);

  if (!state.operatingMode) {
    state.operatingMode = {
      currentMode: mode,
      detectedLanguage: "en",
      autoDetectLanguage: true,
      isSuccinctMode: true,
      debugLevel: 1,
      authRequiredOnStart: mode === "letMeServeYou",
      updatedAt: new Date().toISOString(),
    };
  } else {
    state.operatingMode.currentMode = mode;
    state.operatingMode.authRequiredOnStart = mode === "letMeServeYou";
    state.operatingMode.updatedAt = new Date().toISOString();
  }

  saveState(paths.statePath, state);
  console.log(
    `\x1b[32m✔ [${TOOL_NAME} Operating Mode Changed]\x1b[0m Switched to "\x1b[1m${mode}\x1b[0m" mode.`,
  );
  return state.operatingMode;
}

export function setInteractionLanguage(
  lang: string,
  autoDetect: boolean = false,
  rootDir: string = process.cwd(),
): OperatingModeConfig {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);

  if (!state.operatingMode) {
    state.operatingMode = {
      currentMode: "promptMe",
      detectedLanguage: lang,
      autoDetectLanguage: autoDetect,
      isSuccinctMode: true,
      debugLevel: 1,
      authRequiredOnStart: false,
      updatedAt: new Date().toISOString(),
    };
  } else {
    state.operatingMode.detectedLanguage = lang;
    state.operatingMode.autoDetectLanguage = autoDetect;
    state.operatingMode.updatedAt = new Date().toISOString();
  }

  saveState(paths.statePath, state);
  console.log(
    `\x1b[32m✔ [Language Determination]\x1b[0m Set interaction language to "\x1b[1m${lang}\x1b[0m" (Auto-detect: ${autoDetect ? "ON" : "OFF"}).`,
  );
  return state.operatingMode;
}

export function setSuccinctMode(
  enabled: boolean,
  rootDir: string = process.cwd(),
): OperatingModeConfig {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);

  if (!state.operatingMode) {
    state.operatingMode = {
      currentMode: "promptMe",
      detectedLanguage: "en",
      autoDetectLanguage: true,
      isSuccinctMode: enabled,
      debugLevel: 1,
      authRequiredOnStart: false,
      updatedAt: new Date().toISOString(),
    };
  } else {
    state.operatingMode.isSuccinctMode = enabled;
    state.operatingMode.updatedAt = new Date().toISOString();
  }

  saveState(paths.statePath, state);
  console.log(
    `\x1b[32m✔ [Succinct Mode]\x1b[0m ${enabled ? "ENABLED (Concise responses, bullet lists only, no tables)" : "DISABLED (Standard verbose responses)"}.`,
  );
  return state.operatingMode;
}

export function setDebugLevel(
  level: number,
  rootDir: string = process.cwd(),
): OperatingModeConfig {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);

  const safeLevel = Math.max(0, Math.min(3, level));

  if (!state.operatingMode) {
    state.operatingMode = {
      currentMode: "promptMe",
      detectedLanguage: "en",
      autoDetectLanguage: true,
      isSuccinctMode: true,
      debugLevel: safeLevel,
      authRequiredOnStart: false,
      updatedAt: new Date().toISOString(),
    };
  } else {
    state.operatingMode.debugLevel = safeLevel;
    state.operatingMode.updatedAt = new Date().toISOString();
  }

  saveState(paths.statePath, state);
  const levelNames = [
    "OFF (0)",
    "INFO (1) [Default]",
    "DEBUG (2)",
    "TRACE (3)",
  ];
  console.log(
    `\x1b[32m✔ [Debug Level Set]\x1b[0m System debug verbosity set to Level ${safeLevel} - ${levelNames[safeLevel] || safeLevel}.`,
  );
  return state.operatingMode;
}

export function initiateHostGreeting(rootDir: string = process.cwd()): {
  greeting: string;
  promptMessage: string;
  authRequired: boolean;
} {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  const modeConfig = state.operatingMode || {
    currentMode: "promptMe",
    detectedLanguage: "en",
    autoDetectLanguage: true,
    isSuccinctMode: true,
    debugLevel: 1,
    authRequiredOnStart: false,
    updatedAt: new Date().toISOString(),
  };

  const activeUser = state.activeUser;
  const isDefaultUser = !activeUser || activeUser.userName === "Default User";

  const localized = getLocalizedHostGreeting(
    modeConfig.currentMode,
    modeConfig.detectedLanguage,
    activeUser?.userName,
  );

  return {
    greeting: localized.greetingText,
    promptMessage: localized.promptWhoAreYouText,
    authRequired: isDefaultUser && modeConfig.currentMode === "letMeServeYou",
  };
}
