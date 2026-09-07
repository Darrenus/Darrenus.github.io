import type { Source } from "../agent/events";

// The bundled résumé documents predate public routes and have no URL metadata.
const PUBLIC_RECORDS: Record<string, string> = {
  "贺融是谁": "/resume#intro-title",
  "实习与工程经历": "/resume#experience-title",
  "教育背景与语言能力": "/resume#education-title",
  "项目经历": "/projects",
  "专利申请与获奖": "/resume#patents-title",
  "联系方式": "/resume#intro-title",
  "官方链接": "/resume#intro-title",
  "这个网站如何工作": "https://github.com/Darrenus/Darrenus.github.io/blob/main/README.md",
};

export function sourceHref(source: Source): string | undefined {
  const url = source.url?.trim();
  if (url && (/^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url))) return url;
  return Object.hasOwn(PUBLIC_RECORDS, source.label) ? PUBLIC_RECORDS[source.label] : undefined;
}
