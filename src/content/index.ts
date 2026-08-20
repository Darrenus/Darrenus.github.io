import profileJson from "../../content/profile.json";
import resumeJson from "../../content/resume.json";
import type {
  ContentLink,
  ProfileContent,
  ProfileLink,
  ResumeContent,
  SiteContent,
} from "./types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Invalid public content: ${message}`);
}

function assertUniqueIds(items: Array<{ id: string }>, section: string): void {
  const ids = new Set<string>();
  for (const item of items) {
    assert(item.id.trim(), `${section} contains an empty id`);
    assert(!ids.has(item.id), `${section} contains duplicate id "${item.id}"`);
    ids.add(item.id);
  }
}

function allLinks(content: SiteContent): ContentLink[] {
  const resume = content.resume;
  return [
    ...content.profile.links,
    ...resume.education.flatMap((entry) => entry.links),
    ...resume.experience.flatMap((entry) => entry.links),
    ...resume.projects.flatMap((entry) => entry.links),
    ...resume.patents.flatMap((entry) => entry.links),
    ...resume.awards.flatMap((entry) => entry.links),
    ...resume.customSections.flatMap((section) => section.links ?? []),
  ];
}

export function validateContent(value: SiteContent): SiteContent {
  assert(value.profile.schemaVersion === 1, "unsupported profile schemaVersion");
  assert(value.resume.schemaVersion === 1, "unsupported resume schemaVersion");
  assert(value.profile.site.domain === "rong.bio", "public domain must be rong.bio");
  assert(value.profile.person.name === "贺融", "public Chinese name changed unexpectedly");

  assertUniqueIds(value.profile.links, "profile.links");
  assertUniqueIds(value.resume.education, "resume.education");
  assertUniqueIds(value.resume.experience, "resume.experience");
  assertUniqueIds(value.resume.projects, "resume.projects");
  assertUniqueIds(value.resume.patents, "resume.patents");
  assertUniqueIds(value.resume.awards, "resume.awards");
  assertUniqueIds(value.resume.skillGroups, "resume.skillGroups");
  assertUniqueIds(value.resume.customSections, "resume.customSections");

  const slugs = new Set<string>();
  for (const project of value.resume.projects) {
    assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug), `invalid project slug "${project.slug}"`);
    assert(!slugs.has(project.slug), `duplicate project slug "${project.slug}"`);
    slugs.add(project.slug);
  }

  for (const link of allLinks(value)) {
    assert(link.kind.trim() && link.label.trim(), "link kind and label are required");
    assert(link.status !== "active" || Boolean(link.url), `active link "${link.label}" has no URL`);
  }

  const serialized = JSON.stringify(value);
  assert(!/1[3-9][0-9]{9}/.test(serialized), "phone number detected");
  assert(!serialized.includes("hr.bio"), "obsolete domain detected");
  assert(serialized.includes("20+"), "approved 20+ qualifier is missing");
  assert(serialized.includes("约 2"), "approved approximate two-hour qualifier is missing");
  assert(serialized.includes("85%"), "approved 85% metric is missing");

  return value;
}

export const CONTENT = validateContent({
  profile: profileJson as ProfileContent,
  resume: resumeJson as ResumeContent,
});

export function profileLink(id: string): ProfileLink {
  const link = CONTENT.profile.links.find((candidate) => candidate.id === id);
  if (!link) throw new Error(`Missing profile link: ${id}`);
  return link;
}

export function requiredUrl(link: ContentLink): string {
  if (!link.url) throw new Error(`Link "${link.label}" does not have a public URL yet`);
  return link.url;
}

export function formatPeriod(period: { start: string; end: string }): string {
  return `${period.start} - ${period.end}`;
}

export type {
  ContentLink,
  EducationEntry,
  ExperienceEntry,
  Metric,
  ProfileContent,
  ProfileLink,
  ProjectEntry,
  ResumeContent,
  SiteContent,
} from "./types";
