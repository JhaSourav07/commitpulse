'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useTransition,
  type ReactNode,
} from 'react';

import en from '@/locales/en.json';
import es from '@/locales/es.json';
import hi from '@/locales/hi.json';
import fr from '@/locales/fr.json';
import zh from '@/locales/zh.json';
import ja from '@/locales/ja.json';
import ko from '@/locales/ko.json';
import de from '@/locales/de.json';

export type Language = 'en' | 'es' | 'hi' | 'fr' | 'zh' | 'ja' | 'ko' | 'de';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const translations: Record<Language, any> = {
  en,
  es,
  hi,
  fr,
  zh,
  ja,
  ko,
  de,
};

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  es: 'Espa\u00f1ol',
  hi: '\u0939\u093f\u0928\u094d\u0926\u0940',
  fr: 'Fran\u00e7ais',
  zh: '\u7b80\u4f53\u4e2d\u6587',
  ja: '\u65e5\u672c\u8a9e',
  ko: '\ud55c\uad6d\uc5b4',
  de: 'Deutsch',
};

interface TranslationContextType {
  language: Language;
  changeLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
  isPending: boolean;
}

const TranslationContext = createContext<TranslationContextType | null>(null);

const getNestedValue = (
  obj: Record<string, unknown> | null | undefined,
  path: string
): string | undefined => {
  if (!obj) return undefined;
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
};

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // NOTE: Language auto-detection runs client-side after mounting to prevent
    // Server-Side Rendering (SSR) hydration mismatches. Because the initial SSR
    // render defaults to English, non-English users may notice a brief flash of
    // English text on first load.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const storedLang = localStorage.getItem('language') as Language;
    const supportedLangs = Object.keys(translations) as Language[];

    if (storedLang && supportedLangs.includes(storedLang)) {
      setLanguage(storedLang);
    } else {
      const browserLang = navigator.language.split('-')[0] as Language;
      if (supportedLangs.includes(browserLang)) {
        setLanguage(browserLang);
        localStorage.setItem('language', browserLang);
      } else {
        setLanguage('en');
        localStorage.setItem('language', 'en');
      }
    }
  }, []);

  const changeLanguage = (lang: Language) => {
    startTransition(() => {
      setLanguage(lang);
      localStorage.setItem('language', lang);
      // Update HTML lang attribute for accessibility/SEO
      document.documentElement.lang = lang;
    });
  };

  const t = (path: string, params?: Record<string, string>): string => {
    // If not mounted (Server Side Rendering phase), fallback to English
    const currentLang = mounted ? language : 'en';
    const translationSet = translations[currentLang] || translations.en;
    let value = getNestedValue(translationSet as Record<string, unknown>, path);

    if (value === undefined) {
      value = getNestedValue(translations.en as Record<string, unknown>, path);
    }

    if (value === undefined) {
      if (params && 'defaultValue' in params) {
        return params.defaultValue;
      }
      return path;
    }

    if (params) {
      let resolvedValue = value;
      Object.entries(params).forEach(([key, val]) => {
        resolvedValue = resolvedValue.replace(new RegExp(`{{${key}}}`, 'g'), val);
      });
      return resolvedValue;
    }

    return value;
  };

  return (
    <TranslationContext.Provider value={{ language, changeLanguage, t, isPending }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    return {
      language: 'en' as Language,
      changeLanguage: () => {},
      t: (path: string, params?: Record<string, string>): string => {
        const value = getNestedValue(en, path);
        if (value === undefined) {
          if (params && 'defaultValue' in params) {
            return params.defaultValue;
          }
          return path;
        }
        if (params) {
          let resolvedValue = value;
          Object.entries(params).forEach(([key, val]) => {
            resolvedValue = resolvedValue.replace(new RegExp(`{{${key}}}`, 'g'), val);
          });
          return resolvedValue;
        }
        return value;
      },
      isPending: false,
    };
  }
  return context;
}
