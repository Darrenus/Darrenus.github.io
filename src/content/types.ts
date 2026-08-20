export type Visibility = "public";
export type LinkStatus = "active" | "pending" | "planned";

export interface ContentLink {
  kind: string;
  label: string;
  url: string | null;
  status: LinkStatus;
}

export interface ProfileLink extends ContentLink {
  id: string;
  display: string;
  visibility: Visibility;
}

export interface Period {
  start: string;
  end: string;
}

export interface Metric {
  value: string;
  label: string;
  qualifier: string;
}

export interface EducationEntry {
  id: string;
  institution: string;
  rankLabel: string;
  degree: string;
  field: string;
  period: Period;
  summary: string;
  highlights: string[];
  links: ContentLink[];
  tags: string[];
  visibility: Visibility;
}

export interface ExperienceEntry {
  id: string;
  organization: string;
  role: string;
  period: Period;
  summary: string;
  highlights: string[];
  metrics: Metric[];
  links: ContentLink[];
  tags: string[];
  visibility: Visibility;
}

export interface ProjectEntry {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  role: string;
  period: Period;
  summary: string;
  highlights: string[];
  metrics: Metric[];
  links: ContentLink[];
  tags: string[];
  visibility: Visibility;
}

export interface ProfileContent {
  schemaVersion: number;
  site: {
    title: string;
    wordmark: string;
    language: string;
    domain: string;
    description: string;
    routes: Record<string, string>;
  };
  person: {
    name: string;
    preferredName: string;
    englishName: string;
    location: string;
    headline: string;
    current: string;
  };
  links: ProfileLink[];
  github: { username: string; accounts: string[] };
  privacy: {
    internalProjectPublicNameZh: string;
    internalProjectPublicNameEn: string;
    restrictedCategories: string[];
    publicClaims: string[];
    patentStatusRule: string;
    unpublishedRepositoryRule: string;
  };
}

export interface ResumeContent {
  schemaVersion: number;
  meta: {
    title: string;
    subject: string;
    updatedAt: string;
    versionLabel: string;
  };
  overview: {
    tagline: string;
    summary: string[];
    bio: string[];
    focus: string[];
    careerNarrative: string;
  };
  education: EducationEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  patents: Array<{
    id: string;
    title: string;
    submittedAt: string;
    status: "under-examination";
    statusLabel: string;
    links: ContentLink[];
    visibility: Visibility;
  }>;
  awards: Array<{
    id: string;
    title: string;
    date: string;
    links: ContentLink[];
    visibility: Visibility;
  }>;
  skillGroups: Array<{
    id: string;
    label: string;
    text: string;
    keywords: string[];
  }>;
  customSections: Array<{
    id: string;
    title: string;
    paragraphs: string[];
    links?: ContentLink[];
  }>;
}

export interface SiteContent {
  profile: ProfileContent;
  resume: ResumeContent;
}
