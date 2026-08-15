import { I18nDictionary } from '../interfaces/I18nDictionary';

export const frDictionary: I18nDictionary = {
  lang: 'fr',
  shellBanner: {
    title: 'Shell Interactif INUO',
    protocolSync: 'Statut de synchronisation du protocole : Synchronisé',
  },
  farewell: 'Fermeture du shell INUO. Au revoir !',
  systemOverview: {
    title: 'Aperçu des Capacités INUO',
    intentStructuring: 'Moteur de Structuration d\'Intentions : Formule BESOIN = (VERBE) + (OBJET) associé à OFFRE = (COMPLÉMENT) + (OBJET).',
    peerMatching: 'Mise en Relation Directe : Connecte les besoins directement avec les offres (Demander ➔ Donner, Acheter ➔ Vendre) sans intermédiaires.',
    goalDecomposition: 'Décomposition Récursive des Objectifs : Découpe automatiquement les projets complexes en sous-besoins exécutables.',
    decentralizedGovernance: 'Gouvernance et Confiance Décentralisées : Applique des disjoncteurs en millisecondes et un consensus multipartite.',
  },
  hostGreeting: {
    promptMe: {
      greetingText: 'INUO (Mode Direct / promptMe) actif. Entrez votre commande.',
      promptWhoAreYouText: 'Identité active :',
    },
    letMeServeYou: {
      greetingText: 'Bonjour{name} ! Bienvenue sur INUO. C\'est un honneur de vous servir aujourd\'hui.',
      promptWhoAreYouText: 'Puis-je savoir qui nous rejoint aujourd\'hui pour vous offrir une assistance personnalisée ?',
    },
  },
  intentParser: {
    analyzing: '[Analyseur d\'Intention AI Gemini] Analyse de l\'intention en langage naturel...',
    commandSequence: '[Traducteur de Commandes LLM] : Prompt converti en commande(s) CLI :',
    executingCommand: '⚡ Exécution :',
    parsedNeed: '✔ Intention de Besoin Traitée :',
    parsedOffer: '✔ Intention d\'Offre Traitée :',
    parsedDetail: '✔ Objectif de Détail Traité :',
    parsedAnswer: '✔ Réponse de Connaissance Traitée :',
    parsedCorrection: '✔ Correction Utilisateur Traitée :',
  },
  mode: {
    succinctEnabled: '✔ [Mode Succinct] ACTIVÉ (Réponses concises, puces uniquement, sans tableaux).',
    succinctDisabled: '✔ [Mode Succinct] DÉSACTIVÉ (Réponses détaillées standard).',
    debugLevelSet: '✔ [Niveau de Débogage] Niveau de verbosité système défini sur',
    operatingModeChanged: '✔ [Mode Opérationnel INUO Modifié] Passé au mode :',
    languageSet: '✔ [Détermination de la Langue] Langue d\'interaction définie sur :',
  },
  errors: {
    incoherenceDetected: '❌ [Incohérence Détectée] Exécution Bloquée ! Conflit avec le Principe Master Trainer.',
    accessRevoked: '❌ Accès Refusé : Informations retenues en raison d\'un faible score de confiance.',
    apiKeyMissing: '[AI Gemini] Clé API non détectée. Connectez la clé via : key <API_KEY>',
    tokenQuotaReached: '❌ [Limite de Quota] Quota de jetons ou limite de requêtes atteint pour l\'IA. Veuillez patienter un instant ou vérifier votre clé / forfait.',
    networkError: '❌ [Erreur Réseau] Impossible de contacter le service IA. Vérifiez votre connexion internet ou réessayez.',
    invalidApiKey: '❌ [Clé Invalide] La clé API Gemini est invalide ou a expiré. Configurez-la avec : key <API_KEY>',
    serviceUnavailable: '❌ [Service Indisponible] Le modèle d\'IA est temporairement surchargé. Veuillez réessayer dans quelques instants.',
    generalTechnicalError: '❌ [Erreur Technique] Une erreur est survenue lors du traitement avec le modèle d\'IA :',
  },
  costGovernance: {
    freeTierExhaustedPrompt: '⚠️ [Quota Gratuit Épuisé] Le quota du niveau gratuit a été atteint. Souhaitez-vous autoriser le passage aux modèles payants ? Répondez : tier consent yes | tier consent no',
    allFreeModelsExhaustedPrompt: '🛑 [Tous les Modèles Gratuits Épuisés] Tous les modèles gratuits ont atteint leur quota. Quel modèle payant souhaitez-vous autoriser ? Utilisez : tier select <modèle> ou tier consent no.',
    cascadingFreeModel: '🔄 [Cascade de Modèles Gratuits] Quota dépassé. Basculement automatique vers le modèle gratuit suivant :',
    paidModelSelected: '✔ [Modèle Payant Sélectionné] Modèle payant autorisé :',
    paidConsentGranted: '✔ [Gouvernance des Coûts] Consentement accordé. Modèles payants activés.',
    paidConsentRevoked: '✔ [Gouvernance des Coûts] Consentement révoqué. Fonctionnement restreint au niveau gratuit.',
    paidConfirmationRequired: '🛑 [Protection des Jetons] Exécution interrompue pour éviter la consommation non autorisée de jetons payants. Utilisez `tier select <modèle>`.',
    tierStatusHeader: '=== Gouvernance des Coûts et Cascade des Modèles ===',
  },
};
