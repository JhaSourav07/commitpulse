import { en } from './en';
import { es } from './es';
import { ja } from './ja';

const translations = {
  en,
  es,
  ja,
};

export type SupportedLanguage = keyof typeof translations;

export function getTranslation(lang: SupportedLanguage = 'en') {
  return translations[lang] || translations.en;
}

export function getSupportedLanguages(): SupportedLanguage[] {
  return Object.keys(translations) as SupportedLanguage[];
}
