export interface WebUiStrings {
  tabMain: string;
  tabThinking: string;
  tabDebug: string;
  pillMode: string;
  pillSuccinct: string;
  pillDebug: string;
  pillAi: string;
  send: string;
  placeholder: string;
  thinking: string;
  thinkingHint: string;
  connected: string;
  errorServer: string;
  errorNetwork: string;
  retryBtn: string;
  modeNames: Record<string, string>;
}

const strings: Record<string, WebUiStrings> = {
  es: {
    tabMain: "💬 Conversación",
    tabThinking: "🧠 Pensando",
    tabDebug: "⚙ Depuración",
    pillMode: "Modo:",
    pillSuccinct: "Conciso:",
    pillDebug: "Nivel:",
    pillAi: "AI:",
    send: "Enviar",
    placeholder: "Hola · Hello · Bonjour · Hallo · Olá",
    thinking: "Pensando",
    thinkingHint: "ver detalles en",
    connected: "🚀 iNoU conectado. Flujo SSE en tiempo real activo.",
    errorServer:
      "Algo salió mal en iNoU — tu solicitud no fue procesada. Revisa la pestaña de Depuración para más detalles.",
    errorNetwork:
      "No se pudo conectar con iNoU — revisa tu conexión o espera un momento y vuelve a intentarlo.",
    retryBtn: "↩ Reintentar",
    modeNames: { promptMe: "Modo Directo", letMeServeYou: "Modo Servicio" },
  },
  en: {
    tabMain: "💬 Main Stream",
    tabThinking: "🧠 Thinking",
    tabDebug: "⚙ Debug Logs",
    pillMode: "Mode:",
    pillSuccinct: "Succinct:",
    pillDebug: "Level:",
    pillAi: "AI:",
    send: "Send",
    placeholder: "Hola · Hello · Bonjour · Hallo · Olá",
    thinking: "Thinking",
    thinkingHint: "see details in",
    connected: "🚀 iNoU Web UI connected. Real-time SSE stream active.",
    errorServer:
      "Something went wrong on iNoU's end — your command wasn't processed. Check the Debug tab for details.",
    errorNetwork:
      "Couldn't reach iNoU right now — check your connection or wait a moment, then retry.",
    retryBtn: "↩ Retry",
    modeNames: { promptMe: "Direct Mode", letMeServeYou: "Service Mode" },
  },
  de: {
    tabMain: "💬 Hauptstream",
    tabThinking: "🧠 Denkend",
    tabDebug: "⚙ Protokoll",
    pillMode: "Modus:",
    pillSuccinct: "Kompakt:",
    pillDebug: "Stufe:",
    pillAi: "KI:",
    send: "Senden",
    placeholder: "Hola · Hello · Bonjour · Hallo · Olá",
    thinking: "Denkend",
    thinkingHint: "Details in",
    connected: "🚀 iNoU Web UI verbunden. Echtzeit-SSE-Stream aktiv.",
    errorServer:
      "Etwas ist bei iNoU schiefgelaufen — Ihr Befehl wurde nicht verarbeitet. Prüfen Sie das Protokoll.",
    errorNetwork:
      "iNoU ist gerade nicht erreichbar — überprüfen Sie Ihre Verbindung und versuchen Sie es erneut.",
    retryBtn: "↩ Wiederholen",
    modeNames: { promptMe: "Direktmodus", letMeServeYou: "Servicemodus" },
  },
  fr: {
    tabMain: "💬 Flux Principal",
    tabThinking: "🧠 Réflexion",
    tabDebug: "⚙ Débogage",
    pillMode: "Mode :",
    pillSuccinct: "Succinct :",
    pillDebug: "Niveau :",
    pillAi: "IA :",
    send: "Envoyer",
    placeholder: "Hola · Hello · Bonjour · Hallo · Olá",
    thinking: "Réflexion",
    thinkingHint: "voir les détails dans",
    connected: "🚀 iNoU Web UI connecté. Flux SSE en temps réel actif.",
    errorServer:
      "Quelque chose s'est mal passé chez iNoU — votre commande n'a pas été traitée. Consultez l'onglet Débogage.",
    errorNetwork:
      "Impossible de joindre iNoU pour le moment — vérifiez votre connexion et réessayez.",
    retryBtn: "↩ Réessayer",
    modeNames: { promptMe: "Mode Direct", letMeServeYou: "Mode Service" },
  },
  pt: {
    tabMain: "💬 Fluxo Principal",
    tabThinking: "🧠 Pensando",
    tabDebug: "⚙ Depuração",
    pillMode: "Modo:",
    pillSuccinct: "Sucinto:",
    pillDebug: "Nível:",
    pillAi: "IA:",
    send: "Enviar",
    placeholder: "Hola · Hello · Bonjour · Hallo · Olá",
    thinking: "Pensando",
    thinkingHint: "ver detalhes em",
    connected: "🚀 iNoU Web UI conectado. Fluxo SSE em tempo real ativo.",
    errorServer:
      "Algo deu errado no iNoU — seu comando não foi processado. Verifique a aba de Depuração.",
    errorNetwork:
      "Não foi possível conectar ao iNoU agora — verifique sua conexão e tente novamente.",
    retryBtn: "↩ Tentar novamente",
    modeNames: { promptMe: "Modo Direto", letMeServeYou: "Modo Serviço" },
  },
};

export function getStrings(lang: string): WebUiStrings {
  return strings[lang] ?? strings["en"];
}
