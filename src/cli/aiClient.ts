import { GoogleGenAI } from "@google/genai";
import { loadEnvironment, saveGeminiApiKey } from "./environment";
import { getProjectPaths, loadState } from "./context";
import { writeOutput } from "./outputRouter";
import { OutputChannelEnum } from "../enums/OutputChannelEnum";
import { getPreference, buildPreferencePromptBlock } from "./preferenceEngine";

export interface ParsedIntentResult {
  type:
    | "NEED"
    | "OFFER"
    | "DETAIL_PLAN"
    | "ANSWER"
    | "CORRECTION"
    | "QUERY"
    | "EXIT"
    | "COMMAND_SEQUENCE";
  verb?: string;
  object?: string;
  targetIdOrCode?: string;
  answerText?: string;
  correctionTopic?: string;
  correctionText?: string;
  modelType?: "Transactional" | "GiftBased";
  explanation?: string; // Direct reply to user (stdout / Descriptor 1)
  thinkingDetails?: string; // Model reasoning and step breakdown (stderr / Descriptor 2)
  debugDetails?: string; // System debug details (stderr / Descriptor 2)
  commandSequence?: string[];
  subNeeds?: { verb: string; object: string }[];
  doubts?: string[];
}

export function getStoredApiKey(rootDir: string = process.cwd()): string {
  const env = loadEnvironment(rootDir);
  return env.geminiApiKey;
}

export function saveApiKey(
  apiKey: string,
  rootDir: string = process.cwd(),
): void {
  saveGeminiApiKey(apiKey, rootDir);
}

export async function processNaturalLanguageIntent(
  userInput: string,
  rootDir: string = process.cwd(),
): Promise<ParsedIntentResult | null> {
  const env = loadEnvironment(rootDir);

  if (!env.geminiApiKey) {
    console.log(
      "\x1b[33m%s\x1b[0m",
      "[Gemini AI] Google Gemini API Key not detected.",
    );
    console.log(
      "To connect your Google Gemini credentials, set GEMINI_API_KEY in your environment or type:",
    );
    console.log("\x1b[1mkey <YOUR_GEMINI_API_KEY>\x1b[0m\n");
    return null;
  }

  const paths = getProjectPaths(rootDir);
  const state = loadState(paths.statePath);
  const modeConfig = state.operatingMode;
  const lang = modeConfig?.detectedLanguage || "en";
  const isSuccinct = modeConfig?.isSuccinctMode !== false;
  const debugLevel = env.debugLevel;
  const userId = state.activeUser?.userId ?? "user_local";
  const prefs = getPreference(userId, rootDir);
  const preferenceBlock = prefs ? buildPreferencePromptBlock(prefs) : "";

  try {
    const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });
    const prompt = `You are the INUO Interaction Engine & Command Translation AI.
The user input is: "${userInput}"
Target Interaction Language: "${lang}"
Succinct Mode: ${isSuccinct ? "ACTIVE" : "DISABLED"}
${
  preferenceBlock
    ? `
${preferenceBlock}
`
    : ""
}
CRITICAL OUTPUT SEPARATION MANDATE:
- "explanation": Direct user reply ONLY in Target Interaction Language ("${lang}"). Concise and direct.
- "thinkingDetails": Step-by-step reasoning and goal decomposition thoughts (in "${lang}").
- "debugDetails": Internal prompt classification metrics and metadata.

CRITICAL LANGUAGE MANDATE:
- You MUST generate "explanation" and "thinkingDetails" strictly in Target Interaction Language ("${lang}").

CRITICAL SUCCINCT MODE MANDATE:
${
  isSuccinct
    ? `- Succinct Mode is ACTIVE: Be extremely concise, direct, and short.
- NEVER generate markdown tables (| ... |).
- Use ONLY simple bullet lists (- item) for any multi-item descriptions.`
    : `- Provide clear, helpful explanations.`
}

SYSTEM OVERVIEW INQUIRIES ("What does INUO do?" / "¿Qué hace INUO?" / "Was macht INUO?" / "Que fait INUO?" / "O que faz o INUO?"):
If the user asks what INUO does, its purpose, or general capabilities:
- Set "type": "QUERY"
- Set "explanation" to a 4-bullet point presentation in Target Interaction Language ("${lang}") covering:
  - Intent Structuring Engine (NEED = VERB + OBJECT <-> OFFER = COMPLEMENT + OBJECT)
  - Direct Peer Matching (Request <-> Donate, Buy <-> Sell, Seek <-> Offer)
  - Recursive Goal Decomposition (Breaking down multi-step goals into executable sub-needs)
  - Decentralized Governance & Trust (Millisecond circuit breakers, multi-party threshold consensus)

Formula Baseline: NEED = (VERB) + (OBJECT) or OFFER = (COMP_VERB) + (OBJECT)

Valid Need Verbs: Request, Buy, Seek, Need, Borrow, Consult, Search, Call, Volunteer, Report, Ride, Talk, Transport, Deliver, Employ, Contract, Recruit, Construct, Design, Plan, Build, Upgrade, Evolve.
Valid Offer Complements: Donate, Sell, Offer, Fulfill, Lend, Advise, Supply, Respond, Coordinate, Action, Drive, Listen, Carry, Fetch, Teach, Nurse, Apply, Execute.

Supported CLI Commands:
- "need create --verb <Verb> --object <Object>"
- "offer create --verb <ComplementVerb> --object <Object>"
- "match"
- "detail <id> decompose <description>"
- "answer <id> <text>"
- "whoami"
- "status"
- "catalog"
- "version"
- "social broadcast --message <msg>"
- "question ask --title <Title> --options <Opt1,Opt2>"
- "mode promptMe / letMeServeYou"
- "mode succinct [on|off]"
- "mode debug <0|1|2|3>"
- "auth signin / signout"
- "gc" (Open Google Chrome Web UI)
- "exit / quit / q"


Intent Types:
- "NEED": Single simple need (e.g. "I need a food packet")
- "OFFER": Single simple offer (e.g. "I offer 10 food packets")
- "DETAIL_PLAN": Complex goal or request asking to detail/plan steps
- "ANSWER": Providing details or answering a doubt for a specific step/code
- "CORRECTION": User is correcting a misunderstanding or giving a rule directive
- "QUERY": General question about INUO or status
- "EXIT": User wants to exit, say goodbye, or terminate session in any language
- "COMMAND_SEQUENCE": For ANY complex, multi-step, or unsupported input, convert the user prompt into a sequence of real supported CLI commands in "commandSequence" array.

Return ONLY a raw JSON object with NO markdown formatting matching this structure:
{
  "type": "NEED" | "OFFER" | "DETAIL_PLAN" | "ANSWER" | "CORRECTION" | "QUERY" | "EXIT" | "COMMAND_SEQUENCE",
  "verb": "PrimaryVerb",
  "object": "PrimaryObject",
  "targetIdOrCode": "Optional target step code or ID if answering or detailing existing step",
  "answerText": "Answer details if answering a step",
  "correctionTopic": "Topic area if correcting",
  "correctionText": "Learned directive rule text if correcting",
  "modelType": "Transactional" | "GiftBased",
  "explanation": "Short direct user reply in Target Interaction Language",
  "thinkingDetails": "Model step breakdown & reasoning thoughts",
  "debugDetails": "Introspection metadata",
  "commandSequence": [
    "need create --verb Request --object Food"
  ],
  "subNeeds": [
    { "verb": "SubVerb", "object": "SubObject" }
  ],
  "doubts": [
    "Optional doubt in Target Interaction Language"
  ]
}`;

    const response = await ai.models.generateContent({
      model: env.defaultModel,
      contents: prompt,
    });

    const text = response.text?.trim() || "";
    const cleanJson = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const result = JSON.parse(cleanJson) as ParsedIntentResult;

    // Route Thinking Details to stderr (Descriptor 2)
    if (result.thinkingDetails) {
      writeOutput(
        OutputChannelEnum.THINKING,
        result.thinkingDetails,
        debugLevel,
      );
    }

    // Route Debug Details to stderr (Descriptor 2)
    if (result.debugDetails) {
      writeOutput(OutputChannelEnum.DEBUG, result.debugDetails, debugLevel);
    }

    return result;
  } catch (err: any) {
    writeOutput(
      OutputChannelEnum.DEBUG,
      `[Gemini AI Error] ${err.message}`,
      debugLevel,
    );
    return null;
  }
}
