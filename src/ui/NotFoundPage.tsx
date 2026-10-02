import { t, localizedHref } from "../i18n";
import { useEffect } from "react";
import { CONTENT } from "../content";
import { ProjectSiteHeader } from "./project-ui";
import "./projects.css";

export default function NotFoundPage() {
  const { profile } = CONTENT;

  useEffect(() => {
    document.title = t("页面未找到 · Rong He");
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", document.title);
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute(
      "content",
      t("该页面不存在或已移动。"),
    );
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute(
      "href",
      `https://${profile.site.domain}${window.location.pathname}`,
    );
  }, [profile.site.domain, profile.site.wordmark]);

  return (
    <div className="projects-page projects-page--not-found">
      <ProjectSiteHeader />
      <main id="main-content" className="not-found-main">
        <section className="not-found" aria-labelledby="not-found-title">
          <p className="projects-eyebrow">404</p>
          <h1 id="not-found-title">{t("页面未找到")}</h1>
          <p>{t("这个地址不存在，或内容尚未公开。")}</p>
          <div className="not-found-actions">
            <a className="not-found-primary" href={localizedHref("/")}>{t("返回 RONG 主页")}<span aria-hidden="true">→</span></a>
            <a href={localizedHref("/ragent")}>{t("打开 Ragent")}</a>
            <a href={localizedHref("/projects")}>{t("查看项目")}</a>
            <a href={localizedHref("/resume")}>{t("查看简历")}</a>
          </div>
        </section>
      </main>
    </div>
  );
}
