import { t, localizedHref } from "../i18n";
import { useEffect } from "react";
import { BLOG_ENTRIES, blogDate } from "../content/blog";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import "./research.css";
import "./blog.css";

export default function BlogPage() {
  useEffect(() => {
    document.title = t("杂记 · Rong He");
    const metadata = {
      description: t("贺融的灵感、思考与整理。"),
      "og:title": t("杂记 · Rong He"),
      "og:description": t("贺融的灵感、思考与整理。"),
      "og:url": "https://rong.bio/blog",
    };
    for (const [name, content] of Object.entries(metadata)) {
      document.querySelector(`meta[${name.startsWith("og:") ? "property" : "name"}="${name}"]`)?.setAttribute("content", content);
    }
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", "https://rong.bio/blog");
  }, []);

  return (
    <div className="research-page blog-page">
      <SiteHeader current="blog" />
      <main id="main-content">
        <section className="research-hero" aria-labelledby="blog-title">
          <div className="research-container">
            <p className="research-eyebrow">{t("思考 / 笔记")}</p>
            <h1 id="blog-title">{t("杂记")}</h1>
            <p className="research-intro">{t("一些灵感、思考，和顺手整理的东西。")}</p>
            <div className="research-register">
              <span>{t("文章归档")}</span>
              <span>{BLOG_ENTRIES.length} {t("篇")}</span>
            </div>
          </div>
        </section>
        <section className="research-container blog-archive" aria-label={t("杂记条目")}>
          {BLOG_ENTRIES.length ? BLOG_ENTRIES.map((post, index) => (
            <article className="blog-entry" key={post.slug}>
              <span className="blog-entry-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <div className="blog-entry-meta"><span>{post.category}</span><time dateTime={post.publishedAt}>{blogDate(post.publishedAt)}</time></div>
                <h2><a href={localizedHref(post.href)}>{post.title}<span aria-hidden="true">↗</span></a></h2>
              </div>
            </article>
          )) : (
            <div className="blog-empty">
              <span className="blog-empty-number" aria-hidden="true">00</span>
              <div><h2>{t("尚未发布文章")}</h2><p>{t("灵感、思考与整理，将陆续记录于此。")}</p></div>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
