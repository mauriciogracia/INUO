import { GoogleGenAI } from '@google/genai';
import { loadEnvironment, saveGeminiApiKey } from './environment';

export interface ParsedIntentResult {
  type: 'NEED' | 'OFFER' | 'DETAIL_PLAN' | 'ANSWER' | 'CORRECTION' | 'QUERY';
  verb?: string;
  object?: string;
  targetIdOrCode?: string;
  answerText?: string;
  correctionTopic?: string;
  correctionText?: string;
  modelType?: 'Transactional' | 'GiftBased';
  explanation?: string;
  subNeeds?: { verb: string; object: string }[];
  doubts?: string[];
}

export function getStoredApiKey(rootDir: string = process.cwd()): string {
  const env = loadEnvironment(rootDir);
  return env.geminiApiKey;
}

export function saveApiKey(apiKey: string, rootDir: string = process.cwd()): void {
  saveGeminiApiKey(apiKey, rootDir);
}

export async function processNaturalLanguageIntent(
  userInput: string,
  rootDir: string = process.cwd()
): Promise<ParsedIntentResult | null> {
  const env = loadEnvironment(rootDir);

  if (!env.geminiApiKey) {
    console.log('\x1b[33m%s\x1b[0m', '[Gemini AI] Google Gemini API Key not detected.');
    console.log('To connect your Google Gemini credentials, set GEMINI_API_KEY in your environment or type:');
    console.log('\x1b[1mkey <YOUR_GEMINI_API_KEY>\x1b[0m\n');
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: env.geminiApiKey });
    const prompt = `You are the INUO Interaction Engine & Recursive Detailing intent parser.
The user prompt is: "${userInput}"

Analyze the user intent based on the INUO Global Specification:
Formula: NEED = (VERB) + (OBJECT) or OFFER = (COMP_VERB) + (OBJECT)

Valid Need Verbs: Request, Buy, Seek, Need, Borrow, Consult, Search, Call, Volunteer, Report, Ride, Talk, Transport, Deliver, Employ, Contract, Recruit, Construct, Design, Plan, Build, Upgrade, Evolve.
Valid Offer Complements: Donate, Sell, Offer, Fulfill, Lend, Advise, Supply, Respond, Coordinate, Action, Drive, Listen, Carry, Fetch, Teach, Nurse, Apply, Execute.

Intent Types:
- "NEED": Single simple need (e.g. "I need a food packet")
- "OFFER": Single simple offer (e.g. "I offer 10 food packets")
- "DETAIL_PLAN": Complex goal or request asking to detail/plan steps (e.g., "We in city A need a new road from A to city B help me plan this")
- "ANSWER": Providing details or answering a doubt for a specific step/code (e.g., "for step 1.1 width is 4 lanes")
- "CORRECTION": User is correcting a misunderstanding or giving a rule directive (e.g., "no that is wrong, for food needs always check local inventory first")
- "QUERY": General question about INUO or status

Return ONLY a raw JSON object with NO markdown formatting matching this structure:
{
  "type": "NEED" | "OFFER" | "DETAIL_PLAN" | "ANSWER" | "CORRECTION" | "QUERY",
  "verb": "PrimaryVerb",
  "object": "PrimaryObject",
  "targetIdOrCode": "Optional target step code or ID if answering or detailing existing step",
  "answerText": "Answer details if answering a step",
  "correctionTopic": "Topic area if correcting (e.g. Food Needs)",
  "correctionText": "Learned directive rule text if correcting",
  "modelType": "Transactional" | "GiftBased",
  "explanation": "Short explanation",
  "subNeeds": [
    { "verb": "SubVerb", "object": "SubObject" }
  ],
  "doubts": [
    "Optional doubt or clarifying question INUO asks user"
  ]
}`;

    const response = await ai.models.generateContent({
      model: env.defaultModel,
      contents: prompt,
    });

    const text = response.text?.trim() || '';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson) as ParsedIntentResult;
  } catch (err: any) {
    console.log('\x1b[31m%s\x1b[0m', `[Gemini AI Error] ${err.message}`);
    return null;
  }
}
