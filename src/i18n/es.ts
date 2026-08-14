import { I18nDictionary } from '../interfaces/I18nDictionary';

export const esDictionary: I18nDictionary = {
  lang: 'es',
  shellBanner: {
    title: 'Shell Interactivo de INUO',
    protocolSync: 'Estado de Sincronización del Protocolo: Sincronizado',
  },
  farewell: 'Saliendo del shell de INUO. ¡Hasta luego!',
  systemOverview: {
    title: 'Resumen de Capacidades de INUO',
    intentStructuring: 'Motor de Estructuración de Intenciones: Formula NECESIDAD = (VERBO) + (OBJETO) emparejado con OFERTA = (VERBO_COMPLEMENTO) + (OBJETO).',
    peerMatching: 'Emparejamiento Directo: Conecta necesidades con ofertas compatibles (Solicitar ➔ Donar, Comprar ➔ Vender) sin intermediarios.',
    goalDecomposition: 'Descomposición Recursiva de Metas: Divide proyectos complejos en sub-necesidades ejecutables paso a paso.',
    decentralizedGovernance: 'Gobernanza y Confianza Descentralizada: Aplica cortafuegos en milisegundos y consenso multipartidario.',
  },
  hostGreeting: {
    promptMe: {
      greetingText: 'INUO (Modo Directo / promptMe) activo. Ingrese su comando o consulta.',
      promptWhoAreYouText: 'Identidad activa:',
    },
    letMeServeYou: {
      greetingText: '¡Buenos días{name}! Bienvenido a INUO. Es un honor atenderle hoy.',
      promptWhoAreYouText: '¿Me permite saber quién nos acompaña hoy para brindarle una atención personalizada?',
    },
  },
  intentParser: {
    analyzing: '[Analizador de Intención AI Gemini] Analizando intención de lenguaje natural...',
    commandSequence: '[Traductor de Comandos LLM]: Prompt convertido en comando(s) CLI soportado(s):',
    executingCommand: '⚡ Ejecutando:',
    parsedNeed: '✔ Intención de Necesidad Procesada:',
    parsedOffer: '✔ Intención de Oferta Procesada:',
    parsedDetail: '✔ Meta de Detallado Procesada:',
    parsedAnswer: '✔ Respuesta de Conocimiento Procesada:',
    parsedCorrection: '✔ Corrección de Usuario Procesada:',
  },
  mode: {
    succinctEnabled: '✔ [Modo Sucinto] ACTIVADO (Respuestas concisas, solo viñetas, sin tablas).',
    succinctDisabled: '✔ [Modo Sucinto] DESACTIVADO (Respuestas estándar detalladas).',
    debugLevelSet: '✔ [Nivel de Depuración] Nivel de verbosidad del sistema configurado a:',
    operatingModeChanged: '✔ [Modo Operativo INUO Cambiado] Cambiado al modo:',
    languageSet: '✔ [Determinación de Idioma] Idioma de interacción establecido en:',
  },
  errors: {
    incoherenceDetected: '❌ [Incoherencia Detectada] ¡Ejecución Bloqueada! Conflicto con Principio de Master Trainer.',
    accessRevoked: '❌ Acceso Revocado: Información denegada por bajo nivel de confianza.',
    apiKeyMissing: '[AI Gemini] Clave de API no detectada. Configure su clave mediante: key <API_KEY>',
  },
};
