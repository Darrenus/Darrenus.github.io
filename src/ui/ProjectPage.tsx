import { useEffect } from "react";
import { CONTENT, formatPeriod, type ProjectEntry } from "../content";
import { ProjectLinks, ProjectSiteHeader, ProjectTags } from "./project-ui";
import "./projects.css";

function DetailSection({ project }: { project: ProjectEntry }) {
  const detail = project.detail;
  if (!detail?.sections?.length) return null;

  return (
    <>
      {detail.sections.map((section) => (
        <section className="project-detail-section" aria-labelledby={`${project.slug}-${section.id}`} key={section.id}>
          <div className="project-section-title">
            <span>0{section.order}</span>
            <h2 id={`${project.slug}-${section.id}`}>{section.title}</h2>
          </div>
          <div className="project-section-content">
            {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.items?.length ? <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul> : null}
          </div>
        </section>
      ))}
    </>
  );
}

export default function ProjectPage({ project }: { project: ProjectEntry }) {
  const { profile } = CONTENT;
  const detail = project.detail;

  useEffect(() => {
    const pageTitle = `${project.name} | 项目 | ${profile.site.wordmark}`;
    document.title = pageTitle;
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute("content", project.summary);
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute(
      "href",
      `https://${profile.site.domain}/projects/${project.slug}`,
    );
    document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute("content", pageTitle);
    document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute(
      "content",
      `https://${profile.site.domain}/projects/${project.slug}`,
    );
  }, [profile.site.domain, profile.site.wordmark, project.name, project.slug, project.summary]);

  return (
    <div className="projects-page">
      <ProjectSiteHeader current="projects" />
      <main>
        <section className="project-hero" aria-labelledby="project-title">
          <div className="projects-container">
            <a className="project-back" href="/projects"><span aria-hidden="true">←</span> 全部项目</a>
            <div className="project-hero-grid">
              <div>
                <p className="projects-eyebrow">Project record</p>
                <h1 id="project-title">{project.name}</h1>
                {project.subtitle && <p className="project-hero-subtitle">{project.subtitle}</p>}
                <p className="project-hero-summary">{project.summary}</p>
              </div>
              <dl className="project-facts">
                <div><dt>角色</dt><dd>{project.role}</dd></div>
                <div><dt>周期</dt><dd>{formatPeriod(project.period)}</dd></div>
              </dl>
            </div>
            <ProjectTags tags={project.tags} className="project-hero-tags" />
          </div>
        </section>

        <div className="projects-container project-detail">
          {detail?.intro && (
            <section className="project-detail-section project-detail-section--intro" aria-labelledby="project-intro-title">
              <div className="project-section-title"><span>01</span><h2 id="project-intro-title">项目概述</h2></div>
              <div className="project-section-content"><p className="project-intro-copy">{detail.intro}</p></div>
            </section>
          )}

          <section className="project-detail-section" aria-labelledby="project-work-title">
            <div className="project-section-title"><span>{detail?.intro ? "02" : "01"}</span><h2 id="project-work-title">主要工作</h2></div>
            <div className="project-section-content"><ul>{project.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul></div>
          </section>

          <DetailSection project={project} />

          {project.metrics.length > 0 && (
            <section className="project-detail-section" aria-labelledby="project-results-title">
              <div className="project-section-title"><span>结果</span><h2 id="project-results-title">结果与指标</h2></div>
              <div className="project-results">
                {project.metrics.map((metric) => (
                  <div key={metric.label}>
                    <strong>{metric.value}</strong>
                    <span>{metric.label}</span>
                    {metric.qualifier && <small>{metric.qualifier}</small>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {(project.links.length > 0 || detail?.confidentialityNote) && (
            <section className="project-detail-section project-detail-section--links" aria-labelledby="project-links-title">
              <div className="project-section-title"><span>链接</span><h2 id="project-links-title">链接与说明</h2></div>
              <div className="project-section-content">
                <ProjectLinks links={project.links} />
                {detail?.confidentialityNote && <p className="project-note">{detail.confidentialityNote}</p>}
              </div>
            </section>
          )}
        </div>
      </main>
      <footer className="projects-footer">
        <div className="projects-container">
          <a href="/projects"><span aria-hidden="true">←</span> 返回项目列表</a>
          <a href="/resume">查看完整简历 <span aria-hidden="true">→</span></a>
        </div>
      </footer>
    </div>
  );
}
