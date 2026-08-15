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
    tokenQuotaReached: '❌ [Limite de Cota] Cota de tokens ou limite de requisições atingido para a API de IA. Por favor, aguarde um momento ou verifique sua chave / saldo.',
    networkError: '❌ [Erro de Rede] Não foi possível conectar ao serviço de IA. Verifique sua conexão com a internet ou tente novamente.',
    invalidApiKey: '❌ [Chave Inválida] A chave da API Gemini é inválida ou expirou. Configure-a com: key <API_KEY>',
    serviceUnavailable: '❌ [Serviço Indisponível] O modelo de IA está temporariamente sobrecarregado. Por favor, tente novamente em instantes.',
    generalTechnicalError: '❌ [Erro Técnico] Ocorreu um erro ao processar a solicitação com o modelo de IA:',
  },
  costGovernance: {
    freeTierExhaustedPrompt: '⚠️ [Cota Gratuita Esgotada] O limite do Nível Gratuito foi atingido. Deseja autorizar a mudança para modelos pagos (Google AI Pro)? Responda: tier consent yes | tier consent no',
    allFreeModelsExhaustedPrompt: '🛑 [Todos os Modelos Gratuitos Esgotados] Todos os modelos gratuitos atingiram a cota. Qual modelo pago você deseja autorizar? Use: tier select <modelo> ou tier consent no.',
    cascadingFreeModel: '🔄 [Cascata de Modelos Gratuitos] Cota esgotada. Alternando automaticamente para o próximo modelo gratuito:',
    paidModelSelected: '✔ [Modelo Pago Selecionado] Modelo pago autorizado:',
    paidConsentGranted: '✔ [Governança de Custos] Consentimento concedido. Modelos pagos habilitados.',
    paidConsentRevoked: '✔ [Governança de Custos] Consentimento revogado. Operação restrita ao Nível Gratuito.',
    paidConfirmationRequired: '🛑 [Proteção de Tokens] Execução pausada para evitar consumo não autorizado de tokens pagos. Use `tier select <modelo>`.',
    tierStatusHeader: '=== Governança de Custos e Cascata de Modelos ===',
  },
};
