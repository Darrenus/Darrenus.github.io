import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import MiniSearch from "minisearch";
import { processTerm, tokenize } from "../src/rag/tokenize";
import profileJson from "../content/profile.json";
import resumeJson from "../content/resume.json";
import { validateContent, type ProfileContent, type ResumeContent, type SiteContent } from "../src/content";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE_DIR = path.join(ROOT, "corpus", "src");
const OUTPUT_DIR = path.join(ROOT, "public", "corpus");
const siteContent = validateContent({
  profile: profileJson as ProfileContent,
  resume: resumeJson as ResumeContent,
});

type Kind = "resume" | "paper" | "repo" | "profile" | "project";

interface Section {
  heading: string;
  text: string;
}

interface Doc {
  id: string;
  title: string;
  kind: Kind;
  lang: "en" | "zh";
  url?: string;
  date?: string;
  sections: Section[];
}

interface Chunk {
  id: string;
  docId: string;
  docTitle: string;
  heading: string;
  kind: Kind;
  lang: "en" | "zh";
  url?: string;
  date?: string;
  text: string;
}

function splitSections(body: string): Section[] {
  const sections: Section[] = [];
  let heading = "摘要";
  let lines: string[] = [];

  const flush = () => {
    const text = lines.join("\n").trim();
    if (text) sections.push({ heading, text });
    lines = [];
  };

  for (const line of body.split("\n")) {
    const match = /^#{2,3}\s+(.+)$/.exec(line);
    if (match) {
      flush();
      heading = match[1]!.trim();
    } else {
      lines.push(line);
    }
  }
  flush();
  return sections;
}

function section(heading: string, paragraphs: string[] | string): Section {
  const text = Array.isArray(paragraphs) ? paragraphs.filter(Boolean).join("\n\n") : paragraphs;
  return { heading, text };
}

function bulletLines(items: string[]): string {
  return items.filter(Boolean).map((item) => `- ${item}`).join("\n");
}

function period(entry: { start: string; end: string }): string {
  return `${entry.start} - ${entry.end}`;
}

function entryHeading(entry: { organization?: string; institution?: string; name?: string; role: string; period: { start: string; end: string } }): string {
  const title = entry.organization ?? entry.institution ?? entry.name ?? "";
  return `${title}｜${entry.role}｜${period(entry.period)}`;
}

function canonicalDocs(): Doc[] {
  const { profile, resume } = siteContent;
  const timeline = [
    ...resume.education.map((entry) => `| ${period(entry.period)} | ${entry.institution}，${entry.field} · ${entry.degree} |`),
    ...resume.experience.map((entry) => `| ${period(entry.period)} | ${entry.organization}，${entry.role} |`),
  ].join("\n");

  const about: Doc = {
    id: "about-about",
    title: "贺融是谁",
    kind: "profile",
    lang: "zh",
    sections: [
      section("简介", resume.overview.bio),
      section("当前方向", resume.overview.focus.join("、")),
      section("时间线", `| 时间 | 经历 |\n|---|---|\n${timeline}`),
      section("技能", resume.skillGroups.map((group) => `${group.label}：${group.text}`).join("\n\n")),
    ],
  };

  const education: Doc = {
    id: "about-education",
    title: "教育背景与语言能力",
    kind: "profile",
    lang: "zh",
    sections: [
      ...resume.education.map((entry) => section(entry.institution, [
        entry.summary,
        entry.highlights.length ? bulletLines(entry.highlights) : "",
      ])),
      section("语言与考试", resume.skillGroups.find((group) => group.id === "languages")?.text ?? ""),
    ],
  };

  const experience: Doc = {
    id: "about-experience",
    title: "实习与工程经历",
    kind: "profile",
    lang: "zh",
    sections: resume.experience.map((entry) => section(entryHeading(entry), [
      entry.summary,
      ...entry.highlights,
    ])),
  };

  const projects: Doc = {
    id: "about-projects",
    title: "项目经历",
    kind: "project",
    lang: "zh",
    sections: resume.projects.map((entry) => section(`${entry.name}${entry.subtitle ? ` · ${entry.subtitle}` : ""}｜${entry.role}｜${period(entry.period)}`, [
      entry.summary,
      ...entry.highlights,
      entry.links.some((link) => link.status === "pending") ? "公开代码仓库尚未发布。" : "",
    ])),
  };

  const achievements: Doc = {
    id: "about-achievements",
    title: "专利申请与获奖",
    kind: "profile",
    lang: "zh",
    sections: [
      section("发明专利申请", [
        "以下三项均为发明专利申请，当前处于审查阶段，不表示已经授权：",
        bulletLines(resume.patents.map((patent) => `${patent.title}，${patent.submittedAt} 提交，${patent.statusLabel}`)),
      ]),
      section("获奖与项目成果", bulletLines(resume.awards.map((award) => `${award.title}，${award.date}`))),
    ],
  };

  const contactLinks = profile.links.filter((link) =>
    ["email", "github", "linkedin", "website"].includes(link.kind),
  );
  const contact: Doc = {
    id: "about-contact",
    title: "联系方式",
    kind: "profile",
    lang: "zh",
    sections: [
      section("主要联系方式", [
        bulletLines(contactLinks.map((link) => `${link.label}：[${link.display}](${link.url})`)),
        "所在地：新加坡",
        "网站不公开手机号或其他私人联系方式。",
      ]),
    ],
  };

  const officialLinks = [
    ...profile.links.filter((link) => link.kind !== "image" && link.kind !== "document"),
    ...resume.education.flatMap((entry) => entry.links),
    ...resume.experience.flatMap((entry) => entry.links),
  ].filter((link, index, links) => link.url && links.findIndex((candidate) => candidate.url === link.url) === index);
  const links: Doc = {
    id: "about-links",
    title: "官方链接",
    kind: "profile",
    lang: "zh",
    sections: [
      section("公开链接", officialLinks.map((link) => `${link.label}：[${link.url}](${link.url})`).join("\n")),
      section("代码仓库", [
        ...profile.links
          .filter((link) => link.kind === "repository" && link.url)
          .map((link) => `${link.label}：[${link.url}](${link.url})`),
        "Coding Agent 的公开仓库尚未发布。在链接可用前，只介绍项目，不虚构仓库地址。",
      ].join("\n\n")),
    ],
  };

  const websitePath = path.join(SOURCE_DIR, "this-site.md");
  const websiteRaw = fs.readFileSync(websitePath, "utf8");
  const websiteMatter = matter(websiteRaw);
  const website: Doc = {
    id: "about-this-site",
    title: typeof websiteMatter.data.title === "string" ? websiteMatter.data.title : "这个网站如何工作",
    kind: "profile",
    lang: "zh",
    sections: splitSections(websiteMatter.content),
  };

  return [about, achievements, contact, education, experience, links, projects, website];
}

function readDocs(): { docs: Doc[]; hashes: Record<string, string> } {
  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error(`Missing corpus source directory: ${SOURCE_DIR}`);
  }

  const hashes: Record<string, string> = {};
  for (const source of ["content/profile.json", "content/resume.json", "corpus/src/this-site.md"]) {
    const raw = fs.readFileSync(path.join(ROOT, source), "utf8");
    hashes[source] = createHash("sha256").update(raw).digest("hex").slice(0, 16);
  }

  const docs = canonicalDocs().sort((a, b) => a.id.localeCompare(b.id));

  return { docs, hashes };
}

function packParagraphs(paragraphs: string[], target = 750): string[] {
  const chunks: string[] = [];
  let current = "";
  for (const paragraph of paragraphs) {
    if (current && current.length + paragraph.length + 2 > target) {
      chunks.push(current);
      current = paragraph;
    } else {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function chunkDocs(docs: Doc[]): Chunk[] {
  return docs.flatMap((doc) => {
    let index = 0;
    return doc.sections.flatMap((section) =>
      packParagraphs(section.text.split(/\n{2,}/).map((text) => text.trim()).filter(Boolean))
        .map((text) => ({
          id: `${doc.id}#${index++}`,
          docId: doc.id,
          docTitle: doc.title,
          heading: section.heading,
          kind: doc.kind,
          lang: doc.lang,
          url: doc.url,
          date: doc.date,
          text,
        })),
    );
  });
}

function writeKeywords(): void {
  const keywords = [...new Set([
    ...siteContent.resume.skillGroups.flatMap((group) => group.keywords),
    ...siteContent.resume.projects.flatMap((project) => project.tags),
    ...siteContent.resume.experience.flatMap((entry) => entry.tags),
  ])];

  fs.writeFileSync(
    path.join(ROOT, "src", "ui", "keywords.generated.ts"),
    [
      "/* Generated by scripts/build-corpus.ts from the approved public profile. */",
      "",
      "export const RESUME_KEYWORDS = [",
      ...keywords.map((keyword) => `  ${JSON.stringify(keyword)},`),
      "] as const;",
      "",
    ].join("\n"),
    "utf8",
  );
}

function main(): void {
  const { docs, hashes } = readDocs();
  const chunks = chunkDocs(docs);

  const index = new MiniSearch<Chunk>({
    idField: "id",
    fields: ["text", "heading", "docTitle"],
    storeFields: ["docId", "docTitle", "heading", "kind", "lang", "url", "date"],
    tokenize,
    processTerm,
  });
  index.addAll(chunks);

  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUTPUT_DIR, "docs"), { recursive: true });

  const manifest = docs.map((doc) => ({
    id: doc.id,
    title: doc.title,
    kind: doc.kind,
    lang: doc.lang,
    url: doc.url,
    date: doc.date,
    sections: doc.sections.map((section) => section.heading),
    chunks: chunks.filter((chunk) => chunk.docId === doc.id).length,
  }));

  const bundle = {
    version: 1,
    builtAt: new Date().toISOString().slice(0, 10),
    docs: manifest,
    chunks: Object.fromEntries(chunks.map((chunk) => [chunk.id, chunk.text])),
    index: index.toJSON(),
  };

  fs.writeFileSync(path.join(OUTPUT_DIR, "index.json"), JSON.stringify(bundle), "utf8");
  for (const doc of docs) {
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "docs", `${doc.id}.json`),
      JSON.stringify(doc),
      "utf8",
    );
  }

  writeKeywords();
  fs.writeFileSync(
    path.join(ROOT, "corpus.lock.json"),
    JSON.stringify({ builtAt: bundle.builtAt, sources: hashes }, null, 2),
    "utf8",
  );

  const kb = fs.statSync(path.join(OUTPUT_DIR, "index.json")).size / 1024;
  console.log(`Built ${docs.length} documents and ${chunks.length} chunks (${kb.toFixed(0)} KB).`);
}

main();
