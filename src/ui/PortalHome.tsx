import { useEffect, useState } from "react";
import { CONTENT, formatPeriod } from "../content";
import SiteHeader from "./SiteHeader";
import ObservationDial from "./ObservationDial";
import { OBSERVATIONS, questionHref } from "./observations";
import "./portal.css";

export default function PortalHome() {
  const { profile, resume } = CONTENT;
  const [selected, setSelected] = useState(0);
  const observation = OBSERVATIONS[selected];
  useEffect(() => {
    document.title = "RONG · 贺融 | 观测与求证";
    document
      .querySelector<HTMLMetaElement>('meta[name="description"]')
      ?.setAttribute(
        "content",
        "贺融 Allen He 的个人网站。探索 AI Agent、工业算法与产品设计中的真实项目和工程思考。",
      );
    document
      .querySelector<HTMLLinkElement>('link[rel="canonical"]')
      ?.setAttribute("href", `https://${profile.site.domain}/`);
  }, [profile.site.domain]);
  return (
    <div className="observatory-page">
      <SiteHeader current="home" />
      <main id="main-content">
        <section
          className="observatory-hero frame"
          aria-labelledby="home-title"
        >
          <div className="hero-intro">
            <p className="eyebrow">
              <span className="small-rule" /> A PERSONAL OBSERVATORY
            </p>
            <p className="hero-name">
              {profile.person.name}
              <span>{profile.person.englishName}</span>
            </p>
            <h1 id="home-title">
              让智能，
              <br />
              经得起<span className="brass-text">求证。</span>
            </h1>
            <p className="hero-description">
              我构建 AI 应用与 Agent 系统。
              <br />
              关注推理如何走向行动，
              <br className="desktop-break" />
              也关注行动如何被验证。
            </p>
            <a className="text-link hero-cta" href="/projects">
              走进我的项目 <span aria-hidden="true">↗</span>
            </a>
            <div className="hero-affiliation">
              <span>NUS · 软件工程技术硕士在读</span>
              <span>KAIST · 计算机科学本科</span>
            </div>
          </div>
          <div className="hero-instrument">
            <div className="instrument-heading">
              <span>01 / 观测与求证</span>
              <span>六个方向，一条主线</span>
            </div>
            <ObservationDial selected={selected} onSelect={setSelected} />
            <p className="dial-instructions" id="dial-instructions">
              <span aria-hidden="true">↔</span> 拖动圆心转动指针 · 或点选主题
              <span className="sr-only">
                。键盘方向键切换，Home 与 End 跳至首尾。
              </span>
            </p>
          </div>
          <aside
            className="observation-readout"
            aria-label="主题对应的公开记录"
          >
            <div
              className="readout-title"
              aria-live="polite"
              aria-atomic="true"
            >
              <p className="eyebrow">
                {String(selected + 1).padStart(2, "0")} / {observation.english}
              </p>
              <h2>{observation.statement}</h2>
            </div>
            <ol className="evidence-list" key={selected}>
              {observation.evidence.map((item, i) => (
                <li key={item.href}>
                  <a href={item.href}>
                    <span className="evidence-index">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <strong>{item.label}</strong>
                      <span className="evidence-detail">{item.detail}</span>
                    </span>
                    <span className="evidence-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ol>
            <a
              className="text-link readout-ask"
              href={questionHref(observation.question)}
            >
              就此问 RONG <span aria-hidden="true">↗</span>
            </a>
          </aside>
          <div className="hero-baseline">
            <span>SINGAPORE · 01° N / 103° E</span>
            <a href="#selected-work">
              向下，读一些实际的工作 <span aria-hidden="true">↓</span>
            </a>
          </div>
        </section>
        <section
          className="selected-work frame"
          id="selected-work"
          aria-labelledby="work-title"
        >
          <div className="section-heading">
            <p className="eyebrow">02 / SELECTED WORK</p>
            <h2 id="work-title">想法，落在实处。</h2>
            <p>从 Agent 的一轮执行，到真实世界的反馈。</p>
          </div>
          <div className="home-projects">
            {resume.projects.slice(0, 3).map((project, index) => (
              <a
                className="home-project"
                href={`/projects/${project.slug}`}
                key={project.id}
              >
                <div
                  className={`project-study project-study--${index}`}
                  aria-hidden="true"
                >
                  <span className="study-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <svg viewBox="0 0 400 240">
                    {index === 0 ? (
                      <>
                        <path d="M104 120a96 72 0 1 1 96 72" />
                        <path d="m198 181 12 11-13 10" />
                        <rect x="154" y="82" width="92" height="76" rx="2" />
                        <path d="M104 120h50m92 0h50M200 48v34m0 76v34" />
                        <circle cx="104" cy="120" r="5" />
                        <circle cx="296" cy="120" r="5" />
                      </>
                    ) : index === 1 ? (
                      <>
                        <path d="M52 172H350M82 50V192M82 153l44-39 35 11 44-59 33 24 30-12 42-31" />
                        <path
                          className="study-faint"
                          d="M82 172l44-28 35-8 44-32 33 7 30-29 42-21M82 92h238M82 132h238"
                        />
                        <circle cx="205" cy="66" r="5" />
                      </>
                    ) : (
                      <>
                        <rect x="113" y="41" width="104" height="158" rx="10" />
                        <rect x="177" y="64" width="104" height="158" rx="10" />
                        <path d="M195 102h66m-66 12h40M195 173h66" />
                        <circle cx="229" cy="146" r="18" />
                        <path d="M130 73h50M130 83h30" />
                      </>
                    )}
                  </svg>
                  <span className="study-caption">
                    {
                      [
                        "MODEL → TOOL → OBSERVATION",
                        "CONTROL / ENERGY / CONSTRAINT",
                        "RESEARCH → PROTOTYPE → EXPERIENCE",
                      ][index]
                    }
                  </span>
                </div>
                <div className="home-project-meta">
                  <span>
                    {
                      [
                        "AGENT ENGINEERING",
                        "ALGORITHM & CONTROL",
                        "PRODUCT DESIGN",
                      ][index]
                    }
                  </span>
                  <span aria-hidden="true">↗</span>
                </div>
                <h3>{project.name}</h3>
                <p>{project.summary}</p>
                <time>{formatPeriod(project.period)}</time>
              </a>
            ))}
          </div>
          <a className="text-link all-work" href="/projects">
            全部 {resume.projects.length} 个项目{" "}
            <span aria-hidden="true">→</span>
          </a>
        </section>
        <section className="about-pause" aria-labelledby="about-title">
          <div className="frame about-inner">
            <p className="eyebrow">03 / THE THREAD THROUGH IT ALL</p>
            <h2 id="about-title">
              从观察开始。
              <br />
              在真实的问题里，
              <br />
              <span className="brass-text">把系统想清楚。</span>
            </h2>
            <div className="about-copy">
              <p>{resume.overview.careerNarrative}</p>
              <p>
                这些经历的共同主线，是把模型能力转化为可控、可执行、可验证的软件系统。
              </p>
              <a className="text-link" href="/resume">
                阅读完整经历 <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </section>
      </main>
      <footer className="observatory-footer frame">
        <div>
          <a className="site-wordmark" href="/">
            RONG
          </a>
          <p>保持好奇。持续求证。</p>
        </div>
        <div className="footer-links">
          {profile.links
            .filter((link) =>
              ["github", "linkedin", "primary-email"].includes(link.id),
            )
            .map((link) => (
              <a href={link.url!} key={link.id}>
                {link.id === "primary-email" ? "联系我" : link.label} ↗
              </a>
            ))}
        </div>
        <p className="footer-date">公开资料更新于 {resume.meta.updatedAt}</p>
      </footer>
    </div>
  );
}
