import { OperatingMode } from '../types/OperatingMode';
import { getI18n } from '../i18n';

export function detectLanguage(text: string): string {
  const lower = text.toLowerCase();

  // Spanish detection cues
  if (
    lower.includes('hola') ||
    lower.includes('buenos') ||
    lower.includes('buenas') ||
    lower.includes('necesito') ||
    lower.includes('como') ||
    lower.includes('cómo') ||
    lower.includes('quien') ||
    lower.includes('quién') ||
    lower.includes('gracias') ||
    lower.includes('favor') ||
    lower.includes('que me') ||
    lower.includes('qué me') ||
    lower.includes('que hace') ||
    lower.includes('qué hace') ||
    lower.includes('que puedes') ||
    lower.includes('qué puedes') ||
    lower.includes('que es') ||
    lower.includes('qué es') ||
    lower.includes('permitas') ||
    lower.includes('permites') ||
    lower.includes('permitir') ||
    lower.includes('hacer') ||
    lower.includes('puedo') ||
    lower.includes('puedes') ||
    lower.includes('mostrar') ||
    lower.includes('listar') ||
    lower.includes('ayuda') ||
    lower.includes('quiero') ||
    lower.includes('tengo') ||
    lower.includes('para') ||
    lower.includes('por')
  ) {
    return 'es';
  }

  // English detection cues
  if (
    lower.includes('hello') ||
    lower.includes('good morning') ||
    lower.includes('who are you') ||
    lower.includes('what can you do') ||
    lower.includes('what is inuo') ||
    lower.includes('thank you') ||
    lower.includes('please') ||
    lower.includes('how are you')
  ) {
    return 'en';
  }

  // French detection cues
  if (
    lower.includes('bonjour') ||
    lower.includes('salut') ||
    lower.includes('merci') ||
    lower.includes('s\'il vous plait') ||
    lower.includes('qui es-tu') ||
    lower.includes('qui es tu') ||
    lower.includes('que puis-je') ||
    lower.includes('que peux-tu') ||
    lower.includes('que peux tu') ||
    lower.includes('que fait inuo') ||
    lower.includes('qu\'est-ce que inuo')
  ) {
    return 'fr';
  }

  // German detection cues
  if (
    lower.includes('hallo') ||
    lower.includes('guten tag') ||
    lower.includes('danke') ||
    lower.includes('wer bist du') ||
    lower.includes('was kannst du') ||
    lower.includes('was macht inuo') ||
    lower.includes('was ist inuo')
  ) {
    return 'de';
  }

  // Portuguese detection cues
  if (
    lower.includes('olá') ||
    lower.includes('bom dia') ||
    lower.includes('obrigado') ||
    lower.includes('quem é você') ||
    lower.includes('quem e voce') ||
    lower.includes('o que você') ||
    lower.includes('o que voce') ||
    lower.includes('o que posso') ||
    lower.includes('o que faz o inuo') ||
    lower.includes('o que é o inuo')
  ) {
    return 'pt';
  }

  return 'es';
}

export function getLocalizedHostGreeting(
  mode: OperatingMode,
  lang: string = 'es',
  userName?: string
): { greetingText: string; promptWhoAreYouText: string } {
  const dict = getI18n(lang);

  if (mode === 'promptMe') {
    return {
      greetingText: dict.hostGreeting.promptMe.greetingText,
      promptWhoAreYouText: dict.hostGreeting.promptMe.promptWhoAreYouText,
    };
  }

  const nameStr = userName && userName !== 'Default User' ? ` ${userName}` : '';
  const greetingText = dict.hostGreeting.letMeServeYou.greetingText.replace('{name}', nameStr);

  return {
    greetingText,
    promptWhoAreYouText: dict.hostGreeting.letMeServeYou.promptWhoAreYouText,
  };
}
