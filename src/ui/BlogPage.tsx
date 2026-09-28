import { useEffect } from "react";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import "./research.css";
import "./blog.css";

export default function BlogPage() {
  useEffect(() => {
    document.title = "个人博客 | RONG";
    const metadata = {
      description: "贺融的个人思考与学习笔记。",
      "og:title": "个人博客 | RONG",
      "og:description": "贺融的个人思考与学习笔记。",
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
            <p className="research-eyebrow">思考 / 笔记</p>
            <h1 id="blog-title">个人博客</h1>
            <p className="research-intro">记录学习的过程，也留下一些自己的思考。</p>
            <div className="research-register">
              <span>文章归档</span>
              <span>0 篇</span>
            </div>
          </div>
        </section>
        <section className="research-container blog-archive" aria-label="博客文章">
          <div className="blog-empty">
            <span className="blog-empty-number" aria-hidden="true">00</span>
            <div>
              <h2>尚未发布文章</h2>
              <p>个人思考与学习笔记，将陆续记录于此。</p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
