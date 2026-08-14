import { I18nDictionary } from '../interfaces/I18nDictionary';

export const deDictionary: I18nDictionary = {
  lang: 'de',
  shellBanner: {
    title: 'Interaktive INUO-Shell',
    protocolSync: 'Protokoll-Synchronisationsstatus: Synchronisiert',
  },
  farewell: 'INUO-Shell wird beendet. Auf Wiedersehen!',
  systemOverview: {
    title: 'Übersicht der INUO-Funktionen',
    intentStructuring: 'Absichts-Strukturierungs-Engine: Formuliert BEDARF = (VERB) + (OBJEKT) gepaart mit ANGEBOT = (KOMPLEMENT) + (OBJEKT).',
    peerMatching: 'Direktes Matching: Verbindet offene Bedürfnisse direkt mit passenden Angeboten (Anfragen ➔ Spenden, Kaufen ➔ Verkaufen) ohne Zwischenhändler.',
    goalDecomposition: 'Rekursive Zielzerlegung: Zerlegt komplexe Mehretappen-Projekte automatisch in ausführbare Teilbedürfnisse.',
    decentralizedGovernance: 'Dezentrale Governance & Vertrauen: Erzwingt Millisekunden-Schutzschalter und Konsensprüfungen.',
  },
  hostGreeting: {
    promptMe: {
      greetingText: 'INUO (Direkter Modus / promptMe) aktiv. Geben Sie Ihren Befehl ein.',
      promptWhoAreYouText: 'Aktive Identität:',
    },
    letMeServeYou: {
      greetingText: 'Guten Tag{name}! Willkommen bei INUO. Es ist mir eine Ehre, Ihnen heute zu dienen.',
      promptWhoAreYouText: 'Darf ich erfahren, wer heute bei uns ist, um Ihnen persönlichen Service zu bieten?',
    },
  },
  intentParser: {
    analyzing: '[Gemini AI Absichts-Parser] Analysiere natürliche Sprachabsicht...',
    commandSequence: '[LLM Befehlsübersetzer]: Prompt in unterstützte CLI-Befehle umgewandelt:',
    executingCommand: '⚡ Ausführen:',
    parsedNeed: '✔ AI Verarbeitete Bedarfsabsicht:',
    parsedOffer: '✔ AI Verarbeitete Angebotsabsicht:',
    parsedDetail: '✔ AI Verarbeitetes Detailziel:',
    parsedAnswer: '✔ AI Verarbeitete Wissensantwort:',
    parsedCorrection: '✔ AI Verarbeitete Korrektur:',
  },
  mode: {
    succinctEnabled: '✔ [Prägnanter Modus] AKTIVIERT (Kurze Antworten, nur Aufzählungspunkte, keine Tabellen).',
    succinctDisabled: '✔ [Prägnanter Modus] DEAKTIVIERT (Standardmäßige ausführliche Antworten).',
    debugLevelSet: '✔ [Debug-Stufe eingestellt] System-Debug-Ausführlichkeit eingestellt auf Stufe',
    operatingModeChanged: '✔ [INUO-Betriebsmodus geändert] Gewechselt zu Modus:',
    languageSet: '✔ [Sprachbestimmung] Interaktionssprache eingestellt auf:',
  },
  errors: {
    incoherenceDetected: '❌ [Inkonsistenz erkannt] Ausführung blockiert! Konflikt mit Master-Trainer-Prinzip.',
    accessRevoked: '❌ Zugriff verweigert: Informationen aufgrund niedriger Vertrauensstufe zurückgehalten.',
    apiKeyMissing: '[Gemini AI] Google Gemini API-Schlüssel nicht erkannt. Schlüssel verbinden über: key <API_KEY>',
  },
};
