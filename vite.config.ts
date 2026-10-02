import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";

const blogPosts = JSON.parse(readFileSync(new URL("./content/blog.json", import.meta.url), "utf8")) as { slug: string; title: string }[];
const resume = JSON.parse(readFileSync(new URL("./content/resume.json", import.meta.url), "utf8")) as { projects: { slug: string; name: string }[] };
const englishResume = JSON.parse(readFileSync(new URL("./content/resume.en.json", import.meta.url), "utf8"));
const englishBlog = JSON.parse(readFileSync(new URL("./content/blog.en.json", import.meta.url), "utf8"));
const englishTitles: Record<string,string> = {"/en/":"Rong He", "/en/ragent":"Ask RONG", "/en/resume":"Résumé", "/en/projects":"Projects", "/en/research":"Research", "/en/blog":"Journal", "/en/privacy":"Privacy policy", "/en/terms":"Terms of use", ...Object.fromEntries(englishResume.projects.map((p: {slug:string;name:string})=>[`/en/projects/${p.slug}`,p.name])), ...Object.fromEntries(englishBlog.map((p: {slug:string;title:string})=>[`/en/blog/${p.slug}`,p.title]))};
const routeTitles: Record<string, string> = {
  "/ragent": "问 RONG",
  "/resume": "简历",
  "/projects": "项目",
  "/research": "学术研究",
  "/blog": "个人博客",
  "/privacy": "隐私政策",
  "/terms": "使用条款",
  ...Object.fromEntries(blogPosts.map(post => [`/blog/${post.slug}`, post.title])),
  ...Object.fromEntries(resume.projects.map(project => [`/projects/${project.slug}`, project.name])),
};

function withPageTitle(html: string, title: string) {
  const escaped = title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  return html.replace(/<title>[^<]*<\/title>/, () => `<title>${escaped}</title>`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, () => `<meta property="og:title" content="${escaped}" />`);
}

function spaFallback(): Plugin {
  return {
    name: "spa-fallback",
    closeBundle() {
      const index = new URL("./dist/index.html", import.meta.url);
      const html = readFileSync(index, "utf8");
      const fallback = new URL("./dist/404.html", import.meta.url);
      writeFileSync(fallback, withPageTitle(html, "页面未找到 · Rong He"));

      // GitHub Pages serves 404.html as a client-side fallback, but keeps the HTTP 404 status.
      // Known public routes get directory entry points so direct links return 200 as well.
      for (const [route, title] of Object.entries({...routeTitles,...englishTitles})) {
        const entry = new URL(`./dist${route}/index.html`, import.meta.url);
        mkdirSync(new URL(".", entry), { recursive: true });
        let pageHtml = withPageTitle(html, route === "/en/" ? "Rong He" : `${title} · Rong He`);
        if (route.startsWith('/en')) pageHtml = pageHtml.replace('lang="zh-CN"', 'lang="en"').replace(/content="[^"]*[\u3400-\u9fff][^"]*"/g, 'content="Rong He: AI agents, software engineering and research."');
        const url = 'https://rong.bio' + route;
        pageHtml = pageHtml.replace(/(<link rel="canonical" href=")[^"]+/, '$1' + url).replace(/(<meta property="og:url" content=")[^"]+/, '$1' + url);
        writeFileSync(entry, pageHtml);
      }
    },
  };
}

// Deployed at the domain root (username.github.io), so base stays "/".
export default defineConfig({
  plugins: [react(), spaFallback()],
  build: {
    target: "es2022",
    // The corpus index is fetched at runtime from /corpus, never bundled.
    assetsInlineLimit: 2048,
  },
});
