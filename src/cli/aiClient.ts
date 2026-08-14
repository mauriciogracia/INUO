import { GoogleGenAI } from '@google/genai';
import { loadEnvironment, saveGeminiApiKey } from './environment';

export interface ParsedIntentResult {
  type: 'NEED' | 'OFFER' | 'QUERY';
  verb?: string;
  object?: string;
  modelType?: 'Transactional' | 'GiftBased';
  explanation?: string;
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
    const prompt = `You are the INUO Interaction Engine intent parser.
The user prompt is: "${userInput}"

Analyze the user intent based on the INUO Global Specification:
Formula: NEED = (VERB) + (OBJECT) or OFFER = (COMP_VERB) + (OBJECT)

Valid Need Verbs: Request, Buy, Seek, Need, Borrow, Consult, Search, Call, Volunteer, Report, Ride, Talk, Transport, Deliver, Employ, Contract, Recruit.
Valid Offer Complements: Donate, Sell, Offer, Fulfill, Lend, Advise, Supply, Respond, Coordinate, Action, Drive, Listen, Carry, Fetch, Teach, Nurse, Apply.

Return ONLY a raw JSON object with NO markdown formatting matching this structure:
{
  "type": "NEED" | "OFFER" | "QUERY",
  "verb": "VerbName",
  "object": "ObjectDescription",
  "modelType": "Transactional" | "GiftBased",
  "explanation": "Short explanation"
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
