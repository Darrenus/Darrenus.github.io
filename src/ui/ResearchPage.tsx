import { useEffect } from "react";
import SiteHeader from "./SiteHeader";
import { PUBLICATIONS } from "../content/research";
import "./research.css";

export default function ResearchPage() {
  useEffect(() => {
    document.title = "学术研究 | RONG";
    const metadata = {
      description: "贺融的论文与公开研究记录，以及 arXiv、Zenodo 原文入口。",
      "og:title": "学术研究 | RONG",
      "og:description":
        "贺融的论文与公开研究记录，以及 arXiv、Zenodo 原文入口。",
      "og:url": "https://rong.bio/research",
    };
    for (const [name, content] of Object.entries(metadata))
      document
        .querySelector(
          `meta[${name.startsWith("og:") ? "property" : "name"}="${name}"]`,
        )
        ?.setAttribute("content", content);
    document
      .querySelector('link[rel="canonical"]')
      ?.setAttribute("href", "https://rong.bio/research");
  }, []);
  return (
    <div className="research-page">
      <SiteHeader current="research" />
      <main id="main-content">
        <section className="research-hero" aria-labelledby="research-title">
          <div className="research-container">
            <p className="research-eyebrow">RESEARCH / PUBLICATIONS</p>
            <h1 id="research-title">学术研究</h1>
            <p className="research-intro">论文、思考与可追溯的研究记录。</p>
            <div className="research-register">
              <span>公开研究</span>
              <span>arXiv / Zenodo</span>
            </div>
          </div>
        </section>
        <section
          className="research-container research-list"
          aria-label="论文列表"
        >
          {PUBLICATIONS.length === 0 ? (
            <p className="research-empty">论文记录整理中。</p>
          ) : (
            PUBLICATIONS.map((paper, index) => (
              <article className="research-paper" key={paper.id}>
                <span className="research-number" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="research-paper-body">
                  <div className="research-paper-meta">
                    <time dateTime={paper.publishedAt}>
                      {paper.publishedAt.replaceAll("-", ".")}
                    </time>
                    <span>{paper.status}</span>
                  </div>
                  <h2>{paper.title}</h2>
                  <p className="research-authors">
                    {paper.authors.join(" · ")}
                  </p>
                  <p className="research-summary">{paper.summary}</p>
                  <div className="research-links">
                    {paper.links.map((link) => (
                      <a
                        key={link.platform}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${paper.title} — ${link.platform}（新窗口）`}
                      >
                        <span>
                          {link.platform} <span aria-hidden="true">↗</span>
                        </span>
                        <small>{link.identifier}</small>
                      </a>
                    ))}
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </main>
      <footer className="research-footer research-container">
        <span>RONG / 贺融</span>
        <a href="/projects">
          探索项目 <span aria-hidden="true">→</span>
        </a>
      </footer>
    </div>
  );
}
