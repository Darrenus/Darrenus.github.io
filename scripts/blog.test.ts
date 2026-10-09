import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { BLOG_POSTS, BLOG_ENTRIES, blogDate, type BlogSpan } from "../src/content/blog";
import standalonePages from "../content/blog-pages.json";
import { localizedHref } from "../src/i18n";
import { parseRoute } from "../src/routes";

assert.equal(new Set(BLOG_POSTS.map(post => post.slug)).size, BLOG_POSTS.length);
assert.deepEqual(parseRoute("/blog/"), { kind: "blog" });
assert.deepEqual(parseRoute("/blog/not_a_slug"), { kind: "not-found" });
for (const post of BLOG_POSTS) {
  assert.match(post.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.deepEqual(parseRoute(`/blog/${post.slug}/`), { kind: "blog-post", slug: post.slug });
  assert.ok(post.title && post.category && post.blocks.length);
  assert.match(post.publishedAt, /^\d{4}-\d{2}-\d{2}$/);
  const verifySpans = (spans: BlogSpan[]) => {
    assert.ok(spans.length);
    for (const span of spans) if (span.href) assert.match(span.href, /^https:\/\//);
  };
  for (const block of post.blocks) {
    if (block.type === "figure") {
      assert.ok(block.alt && block.caption);
      assert.ok(block.src.startsWith(`/blog/${post.slug}/`));
      const png = readFileSync(new URL(`../public${block.src}`, import.meta.url));
      assert.equal(png.readUInt32BE(16), block.width);
      assert.equal(png.readUInt32BE(20), block.height);
    } else if (block.type === "table") {
      assert.ok(block.rows.length > 1);
      for (const row of block.rows) assert.equal(row.length, block.rows[0].length);
    } else if (block.type === "list") {
      block.items.forEach(verifySpans);
    } else verifySpans(block.content);
  }
}
const firstPost = BLOG_POSTS.find(post => post.slug === "ai-starts-working")!;
assert.equal(firstPost.category, "阅读思考");
assert.equal(blogDate(firstPost.publishedAt), "2026年9月28日");
assert.equal(firstPost.blocks.filter(block => block.type === "figure").length, 9);
assert.equal(firstPost.blocks.filter(block => block.type === "table").length, 1);
assert.equal(firstPost.blocks.filter(block => block.type === "heading" && block.level === 2).length, 5);
assert.ok(!("summary" in firstPost));
for (const page of standalonePages) {
  assert.match(page.href, /^\/blog\/[a-z0-9-]+\.html$/);
  const original = readFileSync(new URL(`../public${page.href}`, import.meta.url));
  assert.equal(createHash("sha256").update(original).digest("hex"), page.sha256, "Standalone HTML must remain byte-for-byte unchanged");
  assert.equal(BLOG_ENTRIES.find(entry => entry.slug === page.slug)?.href, page.href);
  assert.equal(localizedHref(page.href, "en"), page.href, "Both languages link directly to the original HTML");
}
console.log("Blog routes, publication date, original figure dimensions and document structure passed");
