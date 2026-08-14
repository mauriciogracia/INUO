import { I18nDictionary } from '../interfaces/I18nDictionary';

export const ptDictionary: I18nDictionary = {
  lang: 'pt',
  shellBanner: {
    title: 'Shell Interativo do INUO',
    protocolSync: 'Status de Sincronização do Protocolo: Sincronizado',
  },
  farewell: 'Saindo do shell do INUO. Até logo!',
  systemOverview: {
    title: 'Visão Geral dos Recursos do INUO',
    intentStructuring: 'Motor de Estruturação de Intenções: Formula NECESSIDADE = (VERBO) + (OBJETO) emparelhado com OFERTA = (COMPLEMENTO) + (OBJETO).',
    peerMatching: 'Emparelhamento Direto: Conecta necessidades diretamente a ofertas compatíveis (Solicitar ➔ Doar, Comprar ➔ Vender) sem intermediários.',
    goalDecomposition: 'Decomposição Recursiva de Metas: Divide projetos complexos em sub-necessidades executáveis passo a passo.',
    decentralizedGovernance: 'Governança e Confiança Descentralizada: Aplica disjuntores em milissegundos e consenso multipartidário.',
  },
  hostGreeting: {
    promptMe: {
      greetingText: 'INUO (Modo Direto / promptMe) ativo. Insira seu comando.',
      promptWhoAreYouText: 'Identidade ativa:',
    },
    letMeServeYou: {
      greetingText: 'Bom dia{name}! Bem-vindo ao INUO. É uma honra servi-lo hoje.',
      promptWhoAreYouText: 'Posso saber quem está conosco hoje para oferecer um atendimento personalizado?',
    },
  },
  intentParser: {
    analyzing: '[Analisador de Intenção AI Gemini] Analisando intenção em linguagem natural...',
    commandSequence: '[Traducteur de Comandos LLM]: Prompt convertido em comando(s) CLI:',
    executingCommand: '⚡ Executando:',
    parsedNeed: '✔ Intenção de Necessidade Processada:',
    parsedOffer: '✔ Intenção de Oferta Processada:',
    parsedDetail: '✔ Meta de Detalhamento Processada:',
    parsedAnswer: '✔ Resposta de Conhecimento Processada:',
    parsedCorrection: '✔ Correção do Usuário Processada:',
  },
  mode: {
    succinctEnabled: '✔ [Modo Sucinto] ATIVADO (Respostas concisas, apenas tópicos, sem tabelas).',
    succinctDisabled: '✔ [Modo Sucinto] DESATIVADO (Respostas detalhadas padrão).',
    debugLevelSet: '✔ [Nível de Depuração] Nível de verbosidad do sistema definido para',
    operatingModeChanged: '✔ [Modo Operacional INUO Alterado] Alternado para o modo:',
    languageSet: '✔ [Determinação de Idioma] Idioma de interação definido para:',
  },
  errors: {
    incoherenceDetected: '❌ [Incoerência Detectada] Execução Bloqueada! Conflito com o Princípio Master Trainer.',
    accessRevoked: '❌ Acesso Revogado: Informações retidas devido à baixa pontuação de confiança.',
    apiKeyMissing: '[AI Gemini] Chave API não detectada. Conecte a chave via: key <API_KEY>',
  },
};
