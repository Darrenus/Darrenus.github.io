import { useEffect } from "react";
import { CONTENT, formatPeriod, type ContentLink, type ProfileLink } from "../content";
import "./resume.css";

function isExternalUrl(url: string): boolean {
  return /^https?:\/\//.test(url);
}

function statusLabel(link: ContentLink): string {
  if (link.status === "pending") return "待公开";
  if (link.status === "planned") return "即将上线";
  return "";
}

function LinkList({ links, className = "" }: { links: ContentLink[]; className?: string }) {
  const visible = links.filter((link) => link.status !== "active" || link.url);
  if (visible.length === 0) return null;

  return (
    <div className={`resume-links ${className}`.trim()}>
      {visible.map((link) => {
        const state = statusLabel(link);
        if (link.status !== "active" || !link.url) {
          return (
            <span className="resume-link resume-link--muted" key={`${link.kind}-${link.label}`}>
              <span>{link.label}</span>
              {state && <small>{state}</small>}
            </span>
          );
        }

        return (
          <a
            className="resume-link"
            href={link.url}
            key={`${link.kind}-${link.label}`}
            target={isExternalUrl(link.url) ? "_blank" : undefined}
            rel={isExternalUrl(link.url) ? "noreferrer" : undefined}
          >
            <span>{link.label}</span>
            <span className="resume-link-arrow" aria-hidden="true">↗</span>
          </a>
        );
      })}
    </div>
  );
}

function ProfileContact({ link }: { link: ProfileLink }) {
  if (link.status !== "active" || !link.url) return null;
  const external = isExternalUrl(link.url);
  return (
    <a
      className="resume-contact"
      href={link.url}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
    >
      <span className="resume-contact-label">{link.label}</span>
      <span>{link.display}</span>
    </a>
  );
}

function SectionHeading({ eyebrow, title, id }: { eyebrow: string; title: string; id: string }) {
  return (
    <div className="resume-section-heading">
      <span>{eyebrow}</span>
      <h2 id={id}>{title}</h2>
    </div>
  );
}

export default function ResumePage() {
  const { profile, resume } = CONTENT;
  const emailLinks = profile.links.filter((link) => link.kind === "email");
  const publicProfileLinks = profile.links.filter(
    (link) => ["github", "linkedin", "website"].includes(link.kind),
  );

  useEffect(() => {
    document.title = `${resume.meta.title} | ${profile.site.wordmark}`;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    description?.setAttribute("content", profile.site.description);
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    canonical?.setAttribute("href", `https://${profile.site.domain}/resume`);
    document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute("content", resume.meta.title);
    document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute("content", `https://${profile.site.domain}/resume`);
  }, [profile.site.description, profile.site.domain, profile.site.wordmark, resume.meta.title]);

  return (
    <div className="resume-page">
      <header className="resume-header">
        <div className="resume-header-inner">
          <a className="resume-wordmark" href="/" aria-label="返回 RONG Agent 首页">{profile.site.wordmark}</a>
          <nav className="resume-nav" aria-label="主导航">
            <a className="resume-nav-current" href="/resume" aria-current="page">简历</a>
            <a href="/">Agent</a>
            <a href="/projects">项目</a>
            {publicProfileLinks.map((link) => (
              <a
                href={link.url ?? "#"}
                key={link.id}
                target={link.url && isExternalUrl(link.url) ? "_blank" : undefined}
                rel={link.url && isExternalUrl(link.url) ? "noreferrer" : undefined}
              >
                {link.label}
              </a>
            ))}
            <img className="resume-avatar" src={profile.links.find((link) => link.id === "avatar")?.url ?? ""} alt="贺融 GitHub 头像" />
          </nav>
        </div>
      </header>

      <main>
        <section className="resume-hero" aria-labelledby="resume-title">
          <div className="resume-container resume-hero-grid">
            <div>
              <p className="resume-kicker">{resume.meta.versionLabel} · {resume.meta.updatedAt}</p>
              <h1 id="resume-title">{profile.person.name}<span>{profile.person.preferredName}</span></h1>
              <p className="resume-tagline">{resume.overview.tagline}</p>
              <p className="resume-current">{profile.person.current}</p>
            </div>
            <div className="resume-actions" aria-label="简历操作">
              <a className="resume-action resume-action--primary" href={profile.links.find((link) => link.id === "resume-pdf")?.url ?? "/resume-zh.pdf"} target="_blank" rel="noreferrer">查看 PDF <span aria-hidden="true">↗</span></a>
              <a className="resume-action" href={profile.links.find((link) => link.id === "resume-pdf")?.url ?? "/resume-zh.pdf"} download>下载 PDF <span aria-hidden="true">↓</span></a>
            </div>
          </div>
        </section>

        <div className="resume-container resume-body">
          <section className="resume-intro" aria-labelledby="intro-title">
            <div>
              <SectionHeading eyebrow="01" title="简介" id="intro-title" />
              {resume.overview.summary.map((paragraph) => <p className="resume-lead" key={paragraph}>{paragraph}</p>)}
              {resume.overview.bio.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
            <aside className="resume-contact-panel" aria-label="公开联系方式">
              <p className="resume-aside-label">公开联系方式</p>
              {emailLinks.map((link) => <ProfileContact key={link.id} link={link} />)}
              <p className="resume-location">{profile.person.location}</p>
            </aside>
          </section>

          <section className="resume-section" aria-labelledby="focus-title">
            <SectionHeading eyebrow="02" title="关注方向" id="focus-title" />
            <div className="resume-focus-list">
              {resume.overview.focus.map((item) => <span key={item}>{item}</span>)}
            </div>
          </section>

          <section className="resume-section" aria-labelledby="experience-title">
            <SectionHeading eyebrow="03" title="经历" id="experience-title" />
            <div className="resume-timeline">
              {resume.experience.map((entry) => (
                <article className="resume-entry" key={entry.id}>
                  <div className="resume-entry-meta">
                    <time>{formatPeriod(entry.period)}</time>
                    <div className="resume-entry-tags">{entry.tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</div>
                  </div>
                  <div className="resume-entry-content">
                    <h3>{entry.organization}</h3>
                    <p className="resume-role">{entry.role}</p>
                    <p>{entry.summary}</p>
                    <ul>{entry.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>
                    {entry.metrics.length > 0 && (
                      <div className="resume-metrics">
                        {entry.metrics.map((metric) => <div key={metric.label}><strong>{metric.value}</strong><span>{metric.label}<small>{metric.qualifier}</small></span></div>)}
                      </div>
                    )}
                    <LinkList links={entry.links} />
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="resume-section" aria-labelledby="education-title">
            <SectionHeading eyebrow="04" title="教育" id="education-title" />
            <div className="resume-education-grid">
              {resume.education.map((entry) => (
                <article className="resume-education" key={entry.id}>
                  <div className="resume-entry-meta"><time>{formatPeriod(entry.period)}</time><span className="resume-rank">{entry.rankLabel}</span></div>
                  <h3>{entry.institution}</h3>
                  <p className="resume-role">{entry.degree} · {entry.field}</p>
                  <p>{entry.summary}</p>
                  {entry.highlights.length > 0 && <ul>{entry.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>}
                  <LinkList links={entry.links} />
                </article>
              ))}
            </div>
          </section>

          <section className="resume-section" aria-labelledby="projects-title">
            <SectionHeading eyebrow="05" title="项目" id="projects-title" />
            <div className="resume-project-grid">
              {resume.projects.map((project) => (
                <article className="resume-project" key={project.id}>
                  <div className="resume-project-top"><span>{formatPeriod(project.period)}</span><span>{project.role}</span></div>
                  <h3>{project.name}</h3>
                  {project.subtitle && <p className="resume-project-subtitle">{project.subtitle}</p>}
                  <p>{project.summary}</p>
                  <ul>{project.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>
                  {project.metrics.length > 0 && <div className="resume-project-metric"><strong>{project.metrics[0].value}</strong><span>{project.metrics[0].label}<small>{project.metrics[0].qualifier}</small></span></div>}
                  <div className="resume-entry-tags">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                  <LinkList links={project.links} />
                </article>
              ))}
            </div>
          </section>

          <div className="resume-two-column">
            <section className="resume-section" aria-labelledby="patents-title">
              <SectionHeading eyebrow="06" title="专利申请" id="patents-title" />
              <div className="resume-compact-list">
                {resume.patents.map((patent) => <article key={patent.id}><time>{patent.submittedAt}</time><div><h3>{patent.title}</h3><p>{patent.statusLabel}</p></div></article>)}
              </div>
            </section>
            <section className="resume-section" aria-labelledby="awards-title">
              <SectionHeading eyebrow="07" title="获奖" id="awards-title" />
              <div className="resume-compact-list">
                {resume.awards.map((award) => <article key={award.id}><time>{award.date}</time><div><h3>{award.title}</h3><LinkList links={award.links} /></div></article>)}
              </div>
            </section>
          </div>

          <section className="resume-section resume-skills" aria-labelledby="skills-title">
            <SectionHeading eyebrow="08" title="技能与语言" id="skills-title" />
            <div className="resume-skills-grid">
              {resume.skillGroups.map((group) => <article key={group.id}><h3>{group.label}</h3><p>{group.text}</p></article>)}
            </div>
          </section>
        </div>
      </main>

      <footer className="resume-footer">
        <div className="resume-container">
          <span>{profile.site.wordmark} · {resume.meta.updatedAt}</span>
          <a href="/">返回 Agent 首页 <span aria-hidden="true">↗</span></a>
        </div>
      </footer>
    </div>
  );
}
