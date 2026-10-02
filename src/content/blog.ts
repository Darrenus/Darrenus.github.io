import recordsEn from "../../content/blog.en.json";
import { isEnglish, formatDate } from "../i18n";
import records from "../../content/blog.json";

export interface BlogSpan {
  text: string;
  bold?: boolean;
  italic?: boolean;
  href?: string;
}
export type BlogBlock =
  | { type: "paragraph"; content: BlogSpan[] }
  | { type: "heading"; level: 2 | 3; content: BlogSpan[] }
  | { type: "list"; items: BlogSpan[][] }
  | { type: "table"; rows: BlogSpan[][][] }
  | { type: "figure"; src: string; width: number; height: number; alt: string; caption: string };
export interface BlogPost {
  slug: string;
  title: string;
  subtitle?: string;
  category: string;
  publishedAt: string;
  blocks: BlogBlock[];
}
export const BLOG_POSTS = [...(isEnglish ? recordsEn : records) as BlogPost[]].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

export function blogDate(date: string): string {
  if (isEnglish) return formatDate(date);
  const [year, month, day] = date.split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}
