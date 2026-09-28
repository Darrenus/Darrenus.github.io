import research from "../../content/research.json";

export interface Publication {
  id: string;
  title: string;
  authors: string[];
  publishedAt: string;
  status: string;
  summary: string;
  links: { platform: "arXiv" | "Zenodo"; url: string; identifier: string }[];
}
export const PUBLICATIONS: Publication[] =
  research.publications as Publication[];
