import { useEffect, useState } from "react";
import { isEnglish, localizedHref } from '../i18n';
export default function LanguageSwitch() {
  const readUrl = () => window.location.pathname + window.location.search + window.location.hash;
  const [current, setCurrent] = useState(readUrl);
  useEffect(() => {
    const update = () => setCurrent(readUrl());
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return <a className="language-switch" href={localizedHref(current, isEnglish ? 'zh' : 'en')}
    lang={isEnglish ? 'zh-CN' : 'en'} hrefLang={isEnglish ? 'zh-CN' : 'en'}
    aria-label={isEnglish ? "切换为中文" : 'Switch to English'}>
    <span aria-hidden="true">◎</span> {isEnglish ? "中文" : 'EN'}
  </a>;
}
