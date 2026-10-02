import { useEffect } from 'react';
import { isEnglish, localizedHref } from '../i18n';
export default function LocaleMetadata() {
  useEffect(() => {
    const path = window.location.pathname;
    const url = 'https://rong.bio' + localizedHref(path);
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', url);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', url);
    const locale = document.createElement('meta');
    locale.setAttribute('property', 'og:locale');
    locale.content = isEnglish ? 'en_GB' : 'zh_CN';
    document.head.append(locale);
    const links = (['en', 'zh'] as const).map(lang => {
      const link = document.createElement('link');
      link.rel = 'alternate'; link.hreflang = lang === 'zh' ? 'zh-CN' : 'en';
      link.href = 'https://rong.bio' + localizedHref(path,lang);
      document.head.append(link); return link;
    });
    return () => { locale.remove(); links.forEach(link=>link.remove()); };
  }, []);
  return null;
}
