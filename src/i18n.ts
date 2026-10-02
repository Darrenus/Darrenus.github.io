import messages from '../content/ui.en.json';

export type Language = 'zh' | 'en';
export function languageFromPath(path: string): Language {
  return /^\/en(?:\/|$)/.test(path) ? 'en' : 'zh';
}
const browserLocation = (globalThis as { location?: { pathname: string } }).location;
export const language = languageFromPath(browserLocation?.pathname ?? '/');
export const isEnglish = language === 'en';
export function withoutLocale(path: string): string {
  return path.replace(/^\/en(?=\/|$)/, '') || '/';
}
/** Page URLs only: assets, hashes, external sites and mail links are unchanged. */
export function localizedHref(href: string, lang: Language = language): string {
  const origin = 'https://rong.bio';
  if (href.startsWith(origin + '/')) return origin + localizedHref(href.slice(origin.length), lang);
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  const [path] = href.split(/[?#]/);
  if (/\.[a-z0-9]+$/i.test(path) || /^\/(assets|corpus|blog-assets)(\/|$)/.test(path)) return href;
  const plain = withoutLocale(path);
  return (lang === 'en' ? '/en' + (plain === '/' ? '/' : plain) : plain) + href.slice(path.length);
}
export function t(text: string): string {
  return isEnglish ? (messages as Record<string,string>)[text] ?? text : text;
}
export function formatDate(date: string): string {
  return isEnglish ? new Intl.DateTimeFormat('en-GB', {day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(date)) : date.replaceAll('-', '.');
}
