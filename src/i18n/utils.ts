import { UI, DEFAULT_LANG } from './ui';

export function getLocaleFromUrl(url: URL) {
  const [, locale] = url.pathname.split('/');
  if (locale in UI) return locale as keyof typeof UI;
  return DEFAULT_LANG;
}

export function useTranslations(lang: keyof typeof UI) {
  return function t(key: keyof typeof UI[typeof DEFAULT_LANG]) {
    return UI[lang][key] || UI[DEFAULT_LANG][key];
  }
}