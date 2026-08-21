import { useEffect } from "react";
import { CONTENT, formatPeriod } from "../content";
import { ProjectLinks, ProjectSiteHeader, ProjectTags } from "./project-ui";
import "./projects.css";

export default function ProjectsPage() {
  const { profile, resume } = CONTENT;

  useEffect(() => {
    document.title = `项目 | ${profile.site.wordmark}`;
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute(
      "content",
      "贺融的 AI 应用开发、算法与产品设计项目。",
    );
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute(
      "href",
      `https://${profile.site.domain}/projects`,
    );
    document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute(
      "content",
      `项目 | ${profile.site.wordmark}`,
    );
    document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute(
      "content",
      `https://${profile.site.domain}/projects`,
    );
  }, [profile.site.domain, profile.site.wordmark]);

  return (
    <div className="projects-page">
      <ProjectSiteHeader current="projects" />
      <main>
        <section className="projects-hero" aria-labelledby="projects-title">
          <div className="projects-container">
            <p className="projects-eyebrow">Selected work</p>
            <h1 id="projects-title">项目</h1>
            <p>围绕 AI Agent、算法系统、产品体验与智能硬件的公开项目记录。</p>
          </div>
        </section>

        <section className="projects-container projects-list" aria-label="项目列表">
          {resume.projects.map((project, index) => (
            <article className="project-row" key={project.id}>
              <div className="project-row-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</div>
              <div className="project-row-main">
                <div className="project-row-meta">
                  <time>{formatPeriod(project.period)}</time>
                  <span>{project.role}</span>
                </div>
                <h2><a href={`/projects/${project.slug}`}>{project.name}</a></h2>
                {project.subtitle && <p className="project-subtitle">{project.subtitle}</p>}
                <p className="project-summary">{project.summary}</p>
                <ProjectTags tags={project.tags} />
              </div>
              <div className="project-row-aside">
                {project.metrics.length > 0 && (
                  <div className="project-mini-metrics">
                    {project.metrics.map((metric) => (
                      <div key={metric.label}>
                        <strong>{metric.value}</strong>
                        <span>{metric.label}</span>
                        {metric.qualifier && <small>{metric.qualifier}</small>}
                      </div>
                    ))}
                  </div>
                )}
                <a className="project-detail-link" href={`/projects/${project.slug}`}>
                  查看项目 <span aria-hidden="true">→</span>
                </a>
                <ProjectLinks links={project.links.filter((link) => link.kind !== "internal")} compact />
              </div>
            </article>
          ))}
        </section>
      </main>
      <footer className="projects-footer">
        <div className="projects-container">
          <span>{profile.site.wordmark} · {resume.meta.updatedAt}</span>
          <a href="/resume">查看完整简历 <span aria-hidden="true">→</span></a>
        </div>
      </footer>
    </div>
  );
}
