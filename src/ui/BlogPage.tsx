import { t, localizedHref } from "../i18n";
import { useEffect } from "react";
import { BLOG_POSTS, blogDate } from "../content/blog";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import "./research.css";
import "./blog.css";

export default function BlogPage() {
  useEffect(() => {
    document.title = t("个人博客 · Rong He");
    const metadata = {
      description: t("贺融的个人思考与学习笔记。"),
      "og:title": t("个人博客 · Rong He"),
      "og:description": t("贺融的个人思考与学习笔记。"),
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
            <h1 id="blog-title">{t("个人博客")}</h1>
            <p className="research-intro">{t("记录学习的过程，也留下一些自己的思考。")}</p>
            <div className="research-register">
              <span>{t("文章归档")}</span>
              <span>{BLOG_POSTS.length} {t("篇")}</span>
            </div>
          </div>
        </section>
        <section className="research-container blog-archive" aria-label={t("博客文章")}>
          {BLOG_POSTS.length ? BLOG_POSTS.map((post, index) => (
            <article className="blog-entry" key={post.slug}>
              <span className="blog-entry-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <div className="blog-entry-meta"><span>{post.category}</span><time dateTime={post.publishedAt}>{blogDate(post.publishedAt)}</time></div>
                <h2><a href={localizedHref(`/blog/${post.slug}`)}>{post.title}<span aria-hidden="true">↗</span></a></h2>
              </div>
            </article>
          )) : (
            <div className="blog-empty">
              <span className="blog-empty-number" aria-hidden="true">00</span>
              <div><h2>{t("尚未发布文章")}</h2><p>{t("个人思考与学习笔记，将陆续记录于此。")}</p></div>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
