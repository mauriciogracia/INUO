import { getProjectPaths, loadState, saveState } from "./context";
import { getLocalizedHostGreeting } from "./languageEngine";
import { TOOL_NAME } from "./brand";

export function setOperatingMode(
  mode: string,
  rootDir: string = process.cwd(),
): any {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  const userId = state.activeUser?.userId ?? "user_local";
  const profile = (state.userPreferences ?? []).find(
    (p) => p.userId === userId,
  ) || {
    userId,
    signalCount: 0,
    updatedAt: new Date().toISOString(),
  };

  const normalizedMode =
    mode === "letMeServeYou"
      ? "letMeServeYou"
      : mode === "promptMe"
        ? "promptMe"
        : "promptMe";
  profile.interactionStyle =
    normalizedMode === "letMeServeYou" ? "conversational" : "canonical";
  if (!state.userPreferences?.some((p) => p.userId === userId)) {
    state.userPreferences = [...(state.userPreferences ?? []), profile];
  }

  state.operatingMode = {
    currentMode: normalizedMode,
    detectedLanguage:
      state.preferences?.lang || state.operatingMode?.detectedLanguage || "en",
    autoDetectLanguage: state.preferences?.autoDetectLanguage ?? true,
    isSuccinctMode: false,
    debugLevel:
      state.preferences?.debugLevel ?? state.operatingMode?.debugLevel ?? 1,
    authRequiredOnStart: normalizedMode === "letMeServeYou",
    updatedAt: new Date().toISOString(),
  };

  saveState(paths.statePath, state);
  console.log(
    `\x1b[32m✔ [${TOOL_NAME} Style Updated]\x1b[0m Learned interaction style: "\x1b[1m${profile.interactionStyle}\x1b[0m".`,
  );
  return state.operatingMode;
}

export function setInteractionLanguage(
  lang: string,
  autoDetect: boolean = false,
  rootDir: string = process.cwd(),
): any {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  state.preferences = state.preferences || {};
  state.preferences.lang = lang;
  state.preferences.autoDetectLanguage = autoDetect;
  saveState(paths.statePath, state);
  console.log(
    `\x1b[32m✔ [Language Determination]\x1b[0m Set interaction language to "\x1b[1m${lang}\x1b[0m" (Auto-detect: ${autoDetect ? "ON" : "OFF"}).`,
  );
  return state.preferences;
}

export function setSuccinctMode(
  enabled: boolean,
  rootDir: string = process.cwd(),
): any {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  const userId = state.activeUser?.userId ?? "user_local";
  let profile = (state.userPreferences ?? []).find((p) => p.userId === userId);
  if (!profile) {
    profile = { userId, signalCount: 0, updatedAt: new Date().toISOString() };
    state.userPreferences = [...(state.userPreferences ?? []), profile];
  }
  profile.interactionStyle = enabled ? "succinct" : "canonical";
  state.operatingMode = {
    currentMode: enabled ? "promptMe" : "promptMe",
    detectedLanguage:
      state.preferences?.lang || state.operatingMode?.detectedLanguage || "en",
    autoDetectLanguage: state.preferences?.autoDetectLanguage ?? true,
    isSuccinctMode: enabled,
    debugLevel:
      state.preferences?.debugLevel ?? state.operatingMode?.debugLevel ?? 1,
    authRequiredOnStart: false,
    updatedAt: new Date().toISOString(),
  };
  saveState(paths.statePath, state);
  return state.operatingMode;
}

export function setDebugLevel(
  level: number,
  rootDir: string = process.cwd(),
): any {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  state.preferences = state.preferences || {};
  state.preferences.debugLevel = Math.max(0, Math.min(3, level));
  state.operatingMode = {
    currentMode: state.operatingMode?.currentMode || "promptMe",
    detectedLanguage:
      state.preferences.lang || state.operatingMode?.detectedLanguage || "en",
    autoDetectLanguage: state.preferences.autoDetectLanguage ?? true,
    isSuccinctMode: state.operatingMode?.isSuccinctMode ?? true,
    debugLevel: state.preferences.debugLevel,
    authRequiredOnStart: state.operatingMode?.authRequiredOnStart ?? false,
    updatedAt: new Date().toISOString(),
  };
  saveState(paths.statePath, state);
  return state.operatingMode;
}

export function initiateHostGreeting(rootDir: string = process.cwd()): {
  greeting: string;
  promptMessage: string;
  authRequired: boolean;
} {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  const lang = (state as any).preferences?.lang || "en";
  const localized = getLocalizedHostGreeting(lang, state.activeUser?.userName);

  return {
    greeting: localized.greetingText,
    promptMessage: localized.promptWhoAreYouText,
    authRequired: false,
  };
}
