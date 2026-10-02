import { isEnglish } from "../i18n";
import { t, localizedHref } from "../i18n";
import { Fragment, useEffect, type ReactNode } from "react";
import { blogDate, type BlogPost, type BlogSpan } from "../content/blog";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import "./research.css";
import "./blog.css";

function RichText({ spans }: { spans: BlogSpan[] }) {
  return spans.map((span, index) => {
    let node: ReactNode = span.text;
    if (span.bold) node = <strong>{node}</strong>;
    if (span.italic) node = <em>{node}</em>;
    if (span.href && /^https:\/\//.test(span.href)) {
      node = <a href={localizedHref(span.href)} target="_blank" rel="noopener noreferrer">{node}</a>;
    }
    return <Fragment key={index}>{node}</Fragment>;
  });
}

export default function BlogPostPage({ post }: { post: BlogPost }) {
  useEffect(() => {
    document.title = `${post.title} · Rong He`;
    const metadata = {
      description: post.title,
      "og:title": `${post.title} · Rong He`,
      "og:description": post.title,
      "og:url": `https://rong.bio/blog/${post.slug}`,
      "og:type": "article",
    };
    for (const [name, content] of Object.entries(metadata)) {
      document.querySelector(`meta[${name.startsWith("og:") ? "property" : "name"}="${name}"]`)?.setAttribute("content", content);
    }
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", `https://rong.bio/blog/${post.slug}`);
  }, [post]);

  return (
    <div className="research-page blog-post-page">
      <SiteHeader current="blog" />
      <main id="main-content">
        <article aria-labelledby="post-title">
          <header className="research-hero blog-post-header">
            <div className="research-container">
              <a className="blog-back" href={localizedHref("/blog")}>{t("← 个人博客")}</a>
              <div className="blog-post-meta"><span>{post.category}</span><time dateTime={post.publishedAt}>{blogDate(post.publishedAt)}</time></div>
              <h1 id="post-title">{post.title}</h1>
              {post.subtitle && <p className="blog-post-subtitle">{post.subtitle}</p>}
            </div>
          </header>
          <div className="blog-post-body">
            {post.blocks.map((block, index) => {
              switch (block.type) {
                case "paragraph": return <p key={index}><RichText spans={block.content} /></p>;
                case "heading": {
                  const Heading = block.level === 2 ? "h2" : "h3";
                  return <Heading key={index}><RichText spans={block.content} /></Heading>;
                }
                case "list": return <ul key={index}>{block.items.map((item, i) => <li key={i}><RichText spans={item} /></li>)}</ul>;
                case "table": return (
                  <div key={index} className="blog-table-scroll" role="region" aria-label={t("三个情景的核心结果对比表，可横向滚动")} tabIndex={0}>
                    <table>
                      <thead><tr>{block.rows[0].map((cell, i) => <th scope="col" key={i}><RichText spans={cell} /></th>)}</tr></thead>
                      <tbody>{block.rows.slice(1).map((row, r) => <tr key={r}>{row.map((cell, c) => c === 0 ? <th scope="row" key={c}><RichText spans={cell} /></th> : <td key={c}><RichText spans={cell} /></td>)}</tr>)}</tbody>
                    </table>
                  </div>
                );
                case "figure": return (
                  <figure key={index}>
                    <a href={localizedHref(block.src)} target="_blank" rel="noopener noreferrer" aria-label={`${isEnglish ? "Open original image: " : "查看原图（新窗口）："}${block.alt}`}>
                      <img src={block.src} alt={block.alt} width={block.width} height={block.height} loading="lazy" decoding="async" />
                    </a>
                    <figcaption>{block.caption}</figcaption>
                  </figure>
                );
              }
            })}
            <nav className="blog-post-end" aria-label={t("文章导航")}><a href={localizedHref("/blog")}>{t("← 返回个人博客")}</a><a href={localizedHref("#post-title")}>{t("回到标题 ↑")}</a></nav>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
