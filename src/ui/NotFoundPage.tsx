import { useEffect } from "react";
import { CONTENT } from "../content";
import { ProjectSiteHeader } from "./project-ui";
import "./projects.css";

export default function NotFoundPage() {
  const { profile } = CONTENT;

  useEffect(() => {
    document.title = `页面未找到 | ${profile.site.wordmark}`;
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute(
      "content",
      "该页面不存在或已移动。",
    );
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute(
      "href",
      `https://${profile.site.domain}${window.location.pathname}`,
    );
  }, [profile.site.domain, profile.site.wordmark]);

  return (
    <div className="projects-page projects-page--not-found">
      <ProjectSiteHeader />
      <main className="not-found-main">
        <section className="not-found" aria-labelledby="not-found-title">
          <p className="projects-eyebrow">404</p>
          <h1 id="not-found-title">页面未找到</h1>
          <p>这个地址不存在，或内容尚未公开。</p>
          <div className="not-found-actions">
            <a className="not-found-primary" href="/">返回 Agent 首页 <span aria-hidden="true">→</span></a>
            <a href="/projects">查看项目</a>
            <a href="/resume">查看简历</a>
          </div>
        </section>
      </main>
    </div>
  );
}
