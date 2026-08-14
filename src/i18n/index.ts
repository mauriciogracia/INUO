import { I18nDictionary } from '../interfaces/I18nDictionary';
import { enDictionary } from './en';
import { esDictionary } from './es';
import { deDictionary } from './de';
import { frDictionary } from './fr';
import { ptDictionary } from './pt';

export * from './en';
export * from './es';
export * from './de';
export * from './fr';
export * from './pt';

const dictionaries: Record<string, I18nDictionary> = {
  en: enDictionary,
  es: esDictionary,
  de: deDictionary,
  fr: frDictionary,
  pt: ptDictionary,
};

/**
 * Retrieves the I18N dictionary for the specified interaction language code.
 * Defaults to English ('en') if language is unsupported or omitted.
 */
export function getI18n(lang: string = 'es'): I18nDictionary {
  const code = (lang || 'es').toLowerCase().trim();
  return dictionaries[code] || esDictionary;
}

