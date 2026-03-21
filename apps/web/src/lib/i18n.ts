import { useState } from 'react';
import { ptBR } from './translations/pt-br';
import { enUS } from './translations/en-us';
import { es } from './translations/es';

export type Locale = 'pt-BR' | 'en-US' | 'es';

const translations: Record<Locale, Record<string, string>> = {
  'pt-BR': ptBR,
  'en-US': enUS,
  'es': es,
};

const LOCALE_STORAGE_KEY = 'wazefit-locale';

function getStoredLocale(): Locale {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored && (stored === 'pt-BR' || stored === 'en-US' || stored === 'es')) {
    return stored as Locale;
  }
  return 'pt-BR'; // default
}

function setStoredLocale(locale: Locale): void {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>(getStoredLocale());

  const t = (key: string): string => {
    return translations[locale][key] || key;
  };

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    setStoredLocale(newLocale);
  };

  return { t, locale, setLocale };
}
