import { t, localizedHref } from "../i18n";
import LanguageSwitch from "./LanguageSwitch";
import { CONTENT } from "../content";
import type { ReactNode } from "react";

export default function SiteHeader({
  current,
  actions,
}: {
  current?: "home" | "projects" | "resume" | "research" | "blog" | "ragent";
  actions?: ReactNode;
}) {
  return (
    <>
      <a className="skip-link" href={localizedHref("#main-content")}>
        {t("跳至内容")}</a>
      <header className="site-header">
        <a className="site-wordmark" href={localizedHref("/")} aria-label={t("RONG 首页")}>
          <span className="wordmark-orbit" aria-hidden="true" />
          {CONTENT.profile.site.wordmark}
          <span className="wordmark-edition"> {t("/ 贺融")}</span>
        </a>
        <nav className="site-nav" aria-label={t("主导航")}>
          {(
            [
              { id: "home", href: "/", label: t("观测台") },
              { id: "projects", href: "/projects", label: t("项目") },
              { id: "research", href: "/research", label: t("学术研究") },
              { id: "blog", href: "/blog", label: t("个人博客") },
              { id: "resume", href: "/resume", label: t("简历") },
              { id: "ragent", href: "/ragent", label: t("问 RONG") },
            ] as const
          ).map((item) => (
            <a
              key={item.id}
              href={localizedHref(item.href)}
              aria-current={current === item.id ? "page" : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <LanguageSwitch />
        {actions && <div className="site-actions">{actions}</div>}
      </header>
    </>
  );
}
