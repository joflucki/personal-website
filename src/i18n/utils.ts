import { UI, DEFAULT_LANG, LANGUAGES } from './ui';

export function getLocaleFromUrl(url: URL) {
  const [, locale] = url.pathname.split('/');
  if (locale in UI) return locale as keyof typeof UI;
  return DEFAULT_LANG;
}

export function useTranslations(locale: keyof typeof UI) {
  return function t(key: keyof typeof UI[typeof DEFAULT_LANG]) {
    return UI[locale][key] || UI[DEFAULT_LANG][key];
  }
}
export function toBCP47(locale: keyof typeof LANGUAGES) {
  return `${locale.substring(0, 2)}-${locale.substring(3).toUpperCase()}`
}