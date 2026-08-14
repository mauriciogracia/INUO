import { I18nDictionary } from '../interfaces/I18nDictionary';

export const enDictionary: I18nDictionary = {
  lang: 'en',
  shellBanner: {
    title: 'INUO Interactive Shell',
    protocolSync: 'Protocol Sync Status: Synced',
  },
  farewell: 'Exiting INUO shell. Goodbye!',
  systemOverview: {
    title: 'INUO Capabilities Overview',
    intentStructuring: 'Intent Structuring Engine: Formulates NEED = (VERB) + (OBJECT) paired with OFFER = (COMPLEMENT) + (OBJECT).',
    peerMatching: 'Direct Peer Matching: Connects open needs directly with matching offers (Request ➔ Donate, Buy ➔ Sell) without intermediaries.',
    goalDecomposition: 'Recursive Goal Decomposition: Automatically breaks down complex multi-step goals into executable sub-needs.',
    decentralizedGovernance: 'Decentralized Governance & Trust: Enforces millisecond circuit breakers and multi-party threshold consensus.',
  },
  hostGreeting: {
    promptMe: {
      greetingText: 'INUO (Direct Mode / promptMe) active. Enter your command or goal.',
      promptWhoAreYouText: 'Active Identity:',
    },
    letMeServeYou: {
      greetingText: 'Good day{name}! Welcome to INUO. It is an honor to serve you today.',
      promptWhoAreYouText: 'May I ask who is speaking today so I may tailor my service to you?',
    },
  },
  intentParser: {
    analyzing: '[Gemini AI Intent Parser] Analyzing natural language intent...',
    commandSequence: '[LLM Command Translator]: Converted prompt into supported CLI command(s):',
    executingCommand: '⚡ Executing:',
    parsedNeed: '✔ AI Parsed Need Intent:',
    parsedOffer: '✔ AI Parsed Offer Intent:',
    parsedDetail: '✔ AI Parsed Detailing & Planning Goal:',
    parsedAnswer: '✔ AI Parsed Knowledge Answer:',
    parsedCorrection: '✔ AI Parsed User Correction:',
  },
  mode: {
    succinctEnabled: '✔ [Succinct Mode] ENABLED (Concise responses, bullet lists only, no tables).',
    succinctDisabled: '✔ [Succinct Mode] DISABLED (Standard verbose responses).',
    debugLevelSet: '✔ [Debug Level Set] System debug verbosity set to Level',
    operatingModeChanged: '✔ [INUO Operating Mode Changed] Switched to mode:',
    languageSet: '✔ [Language Determination] Set interaction language to:',
  },
  errors: {
    incoherenceDetected: '❌ [Incoherence Detected] Execution Blocked! Prompt conflicts with Master Trainer Principle.',
    accessRevoked: '❌ Access Revoked: Information withheld due to low trust score.',
    apiKeyMissing: '[Gemini AI] Google Gemini API Key not detected. Connect key via: key <API_KEY>',
  },
};
