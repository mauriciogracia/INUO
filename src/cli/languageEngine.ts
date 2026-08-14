import { OperatingMode } from '../types/OperatingMode';

export function detectLanguage(text: string): string {
  const lower = text.toLowerCase();

  // Spanish detection cues
  if (
    lower.includes('hola') ||
    lower.includes('buenos dias') ||
    lower.includes('buenas noches') ||
    lower.includes('necesito') ||
    lower.includes('como estas') ||
    lower.includes('quien eres') ||
    lower.includes('gracias') ||
    lower.includes('por favor')
  ) {
    return 'es';
  }

  // French detection cues
  if (
    lower.includes('bonjour') ||
    lower.includes('salut') ||
    lower.includes('merci') ||
    lower.includes('s\'il vous plait') ||
    lower.includes('qui es-tu')
  ) {
    return 'fr';
  }

  // German detection cues
  if (
    lower.includes('hallo') ||
    lower.includes('guten tag') ||
    lower.includes('danke') ||
    lower.includes('wer bist du')
  ) {
    return 'de';
  }

  // Portuguese detection cues
  if (
    lower.includes('olá') ||
    lower.includes('bom dia') ||
    lower.includes('obrigado') ||
    lower.includes('quem é você')
  ) {
    return 'pt';
  }

  return 'en';
}

export function getLocalizedHostGreeting(
  mode: OperatingMode,
  lang: string = 'en',
  userName?: string
): { greetingText: string; promptWhoAreYouText: string } {
  if (mode === 'promptMe') {
    switch (lang) {
      case 'es':
        return {
          greetingText: 'INUO (Modo Directo / promptMe) activo. Ingrese su comando o consulta.',
          promptWhoAreYouText: 'Identidad activa:',
        };
      case 'fr':
        return {
          greetingText: 'INUO (Mode Direct / promptMe) actif. Entrez votre commande.',
          promptWhoAreYouText: 'Identité active:',
        };
      case 'de':
        return {
          greetingText: 'INUO (Direkter Modus / promptMe) aktiv. Geben Sie Ihren Befehl ein.',
          promptWhoAreYouText: 'Aktive Identität:',
        };
      case 'pt':
        return {
          greetingText: 'INUO (Modo Direto / promptMe) ativo. Insira seu comando.',
          promptWhoAreYouText: 'Identidade ativa:',
        };
      default:
        return {
          greetingText: 'INUO (Direct Mode / promptMe) active. Enter your command or goal.',
          promptWhoAreYouText: 'Active Identity:',
        };
    }
  }

  // mode === 'letMeServeYou' (Proactive Host)
  const nameStr = userName && userName !== 'Default User' ? ` ${userName}` : '';

  switch (lang) {
    case 'es':
      return {
        greetingText: `¡Buenos días${nameStr}! Bienvenido a INUO. Es un honor atenderle hoy.`,
        promptWhoAreYouText: '¿Me permite saber quién nos acompaña hoy para brindarle una atención personalizada?',
      };
    case 'fr':
      return {
        greetingText: `Bonjour${nameStr}! Bienvenue sur INUO. C'est un honneur de vous servir aujourd'hui.`,
        promptWhoAreYouText: 'Puis-je savoir qui nous rejoint aujourd\'hui pour vous offrir une assistance personnalisée?',
      };
    case 'de':
      return {
        greetingText: `Guten Tag${nameStr}! Willkommen bei INUO. Es ist mir eine Ehre, Ihnen heute zu dienen.`,
        promptWhoAreYouText: 'Darf ich erfahren, wer heute bei uns ist, um Ihnen persönlichen Service zu bieten?',
      };
    case 'pt':
      return {
        greetingText: `Bom dia${nameStr}! Bem-vindo ao INUO. É uma honra servi-lo hoje.`,
        promptWhoAreYouText: 'Posso saber quem está conosco hoje para oferecer um atendimento personalizado?',
      };
    default:
      return {
        greetingText: `Good day${nameStr}! Welcome to INUO. It is an honor to serve you today.`,
        promptWhoAreYouText: 'May I ask who is speaking today so I may tailor my service to you?',
      };
  }
}
