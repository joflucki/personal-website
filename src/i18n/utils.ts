import { UI, DEFAULT_LANG } from './ui';

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in UI) return lang as keyof typeof UI;
  return DEFAULT_LANG;
}

export function useTranslations(lang: keyof typeof UI) {
  return function t(key: keyof typeof UI[typeof DEFAULT_LANG]) {
    return UI[lang][key] || UI[DEFAULT_LANG][key];
  }
}