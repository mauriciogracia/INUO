import { getProjectPaths, loadState, saveState } from "./context";
import { UserPreferenceProfile } from "../interfaces/UserPreferenceProfile";
import { ResponseLength } from "../types/ResponseLength";
import { ResponseFormat } from "../types/ResponseFormat";
import { writeOutput } from "./outputRouter";
import { OutputChannelEnum } from "../enums/OutputChannelEnum";

type PreferenceDelta = Partial<
  Pick<
    UserPreferenceProfile,
    "responseLength" | "responseFormat" | "preferTables"
  >
>;

interface FormatSignal {
  delta: PreferenceDelta;
  confirmationKey: string;
}

// Multilingual patterns — EN / ES / FR / DE / PT
const SIGNAL_PATTERNS: Array<{
  test: (l: string) => boolean;
  signal: FormatSignal;
}> = [
  {
    // length: brief
    test: (l) =>
      /\b(shorter|more concise|be brief|be concise|too long|brevity|s[eé] m[aá]s corto|m[aá]s breve|demasiado largo|plus court|trop long|k[uü]rzer|zu lang|mais curto|muito longo)\b/.test(
        l,
      ),
    signal: {
      delta: { responseLength: "brief" as ResponseLength },
      confirmationKey: "brief",
    },
  },
  {
    // length: detailed
    test: (l) =>
      /\b(more details|elaborate|in depth|expand on|be detailed|m[aá]s detalles|m[aá]s detallado|plus de d[eé]tails|mehr details|mais detalhes|mais detalhado)\b/.test(
        l,
      ),
    signal: {
      delta: { responseLength: "detailed" as ResponseLength },
      confirmationKey: "detailed",
    },
  },
  {
    // format: no tables (check before "use a table" to avoid conflict)
    test: (l) =>
      /\b(no tables?|avoid tables?|without tables?|sin tablas?|pas de tableaux?|keine tabellen?|sem tabelas?)\b/.test(
        l,
      ),
    signal: { delta: { preferTables: false }, confirmationKey: "noTables" },
  },
  {
    // format: structured / tables
    test: (l) =>
      /\b(use a table|show.*table|tabular|en tabla|usa tabla|utilise un tableau|verwende eine tabelle|use uma tabela)\b/.test(
        l,
      ),
    signal: {
      delta: {
        responseFormat: "structured" as ResponseFormat,
        preferTables: true,
      },
      confirmationKey: "tables",
    },
  },
  {
    // format: bullets
    test: (l) =>
      /\b(bullets?|bullet list|use a list|bulleted|vi[ñn]etas?|lista de vi[ñn]etas?|puces?|aufz[aä]hlungszeichen|pontos?)\b/.test(
        l,
      ),
    signal: {
      delta: { responseFormat: "bullets" as ResponseFormat },
      confirmationKey: "bullets",
    },
  },
  {
    // format: prose
    test: (l) =>
      /\b(in prose|write it out|paragraph|en prosa|in prosa|en prose|flie[sß]text|em prosa)\b/.test(
        l,
      ),
    signal: {
      delta: { responseFormat: "prose" as ResponseFormat },
      confirmationKey: "prose",
    },
  },
];

const CONFIRMATIONS: Record<string, Record<string, string>> = {
  brief: {
    en: "✔ Got it — responses will be brief from now on.",
    es: "✔ Entendido — seré más conciso de ahora en adelante.",
    fr: "✔ Compris — je serai plus concis dorénavant.",
    de: "✔ Verstanden — ich antworte ab jetzt kürzer.",
    pt: "✔ Entendido — serei mais conciso daqui em diante.",
  },
  detailed: {
    en: "✔ Got it — I will give more detailed responses.",
    es: "✔ Entendido — daré respuestas más detalladas.",
    fr: "✔ Compris — je fournirai des réponses plus détaillées.",
    de: "✔ Verstanden — ich werde detailliertere Antworten geben.",
    pt: "✔ Entendido — darei respostas mais detalhadas.",
  },
  bullets: {
    en: "✔ Got it — I will use bullet lists.",
    es: "✔ Entendido — usaré listas con viñetas.",
    fr: "✔ Compris — j'utiliserai des listes à puces.",
    de: "✔ Verstanden — ich verwende Aufzählungslisten.",
    pt: "✔ Entendido — usarei listas com marcadores.",
  },
  tables: {
    en: "✔ Got it — I will use tables when appropriate.",
    es: "✔ Entendido — usaré tablas cuando corresponda.",
    fr: "✔ Compris — j'utiliserai des tableaux si approprié.",
    de: "✔ Verstanden — ich werde Tabellen verwenden, wenn sinnvoll.",
    pt: "✔ Entendido — usarei tabelas quando apropriado.",
  },
  noTables: {
    en: "✔ Got it — I will avoid tables.",
    es: "✔ Entendido — evitaré las tablas.",
    fr: "✔ Compris — j'éviterai les tableaux.",
    de: "✔ Verstanden — ich vermeide Tabellen.",
    pt: "✔ Entendido — vou evitar tabelas.",
  },
  prose: {
    en: "✔ Got it — I will write in prose.",
    es: "✔ Entendido — escribiré en prosa.",
    fr: "✔ Compris — j'écrirai en prose.",
    de: "✔ Verstanden — ich schreibe in Prosa.",
    pt: "✔ Entendido — escreverei em prosa.",
  },
};

/** Returns the matching format signal for the input, or null if none detected. */
export function detectFormatSignal(input: string): FormatSignal | null {
  const lower = input.toLowerCase();
  for (const { test, signal } of SIGNAL_PATTERNS) {
    if (test(lower)) return signal;
  }
  return null;
}

/** Merges a preference delta into the persisted profile for userId. */
export function applyPreference(
  delta: PreferenceDelta,
  userId: string,
  rootDir: string = process.cwd(),
): UserPreferenceProfile {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);

  if (!state.userPreferences) state.userPreferences = [];
  let profile = state.userPreferences.find((p) => p.userId === userId);
  if (!profile) {
    profile = { userId, signalCount: 0, updatedAt: new Date().toISOString() };
    state.userPreferences.push(profile);
  }

  Object.assign(profile, delta);
  profile.signalCount += 1;
  profile.updatedAt = new Date().toISOString();

  saveState(paths.statePath, state);
  return { ...profile };
}

/** Retrieves the stored preference profile for userId, or null if none. */
export function getPreference(
  userId: string,
  rootDir: string = process.cwd(),
): UserPreferenceProfile | null {
  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  return (state.userPreferences ?? []).find((p) => p.userId === userId) ?? null;
}

/** Converts a stored preference profile into an LLM prompt instruction block. */
export function buildPreferencePromptBlock(
  prefs: UserPreferenceProfile,
): string {
  const lines: string[] = [];

  if (prefs.responseLength === "brief")
    lines.push("Keep responses short — minimal elaboration, short sentences.");
  if (prefs.responseLength === "detailed")
    lines.push(
      "Give thorough, detailed explanations — do not omit steps or context.",
    );
  if (prefs.responseLength === "standard")
    lines.push("Use standard response length.");

  if (prefs.responseFormat === "bullets")
    lines.push("Always use bullet lists (- item) for any multi-item content.");
  if (prefs.responseFormat === "prose")
    lines.push(
      "Write in flowing prose paragraphs — no bullet lists, no fragments.",
    );
  if (prefs.responseFormat === "structured")
    lines.push("Use tables when presenting multi-column or comparative data.");

  if (prefs.preferTables === true)
    lines.push("Tables are preferred for structured output.");
  if (prefs.preferTables === false)
    lines.push("Never use tables — use plain text or bullet lists only.");

  if (lines.length === 0) return "";
  return `USER FORMAT PREFERENCES (learned — apply unconditionally):\n${lines.map((l) => `- ${l}`).join("\n")}`;
}

/**
 * Detects a format preference signal in the input, persists it, and emits a
 * localised confirmation to USER_REPLY. Returns true if a signal was handled
 * (caller should skip the LLM call for this turn).
 */
export function handleFormatSignal(
  input: string,
  userId: string,
  lang: string,
  rootDir: string = process.cwd(),
): boolean {
  const signal = detectFormatSignal(input);
  if (!signal) return false;

  applyPreference(signal.delta, userId, rootDir);

  const safeLang = ["en", "es", "fr", "de", "pt"].includes(lang) ? lang : "en";
  const msg =
    CONFIRMATIONS[signal.confirmationKey]?.[safeLang] ??
    CONFIRMATIONS[signal.confirmationKey]?.["en"] ??
    "✔ Preference saved.";

  writeOutput(OutputChannelEnum.USER_REPLY, msg);
  return true;
}
