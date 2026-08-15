/**
 * Comprehensive I18N Dictionary interface for system-wide multi-lingual messaging.
 */
export interface I18nDictionary {
  lang: string;
  shellBanner: {
    title: string;
    protocolSync: string;
  };
  farewell: string;
  systemOverview: {
    title: string;
    intentStructuring: string;
    peerMatching: string;
    goalDecomposition: string;
    decentralizedGovernance: string;
  };
  hostGreeting: {
    promptMe: { greetingText: string; promptWhoAreYouText: string };
    letMeServeYou: { greetingText: string; promptWhoAreYouText: string };
  };
  intentParser: {
    analyzing: string;
    commandSequence: string;
    executingCommand: string;
    parsedNeed: string;
    parsedOffer: string;
    parsedDetail: string;
    parsedAnswer: string;
    parsedCorrection: string;
  };
  mode: {
    succinctEnabled: string;
    succinctDisabled: string;
    debugLevelSet: string;
    operatingModeChanged: string;
    languageSet: string;
  };
  errors: {
    incoherenceDetected: string;
    accessRevoked: string;
    apiKeyMissing: string;
    tokenQuotaReached: string;
    networkError: string;
    invalidApiKey: string;
    serviceUnavailable: string;
    generalTechnicalError: string;
  };
  costGovernance: {
    freeTierExhaustedPrompt: string;
    allFreeModelsExhaustedPrompt: string;
    cascadingFreeModel: string;
    paidModelSelected: string;
    paidConsentGranted: string;
    paidConsentRevoked: string;
    paidConfirmationRequired: string;
    tierStatusHeader: string;
  };
}
