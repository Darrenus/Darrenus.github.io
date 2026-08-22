import assert from "node:assert/strict";
import profileJson from "../content/profile.json";
import resumeJson from "../content/resume.json";
import { validateContent, type ProfileContent, type ResumeContent } from "../src/content";

const content = validateContent({
  profile: profileJson as ProfileContent,
  resume: resumeJson as ResumeContent,
});

assert.equal(content.profile.site.domain, "rong.bio");
assert.equal(content.profile.site.routes.resume, "/resume");
assert.equal(content.profile.site.routes.resumePdf, "/resume-zh.pdf");
assert.equal(content.profile.person.preferredName, "Allen");
assert.equal(content.profile.links.find((link) => link.id === "primary-email")?.display, "hanserong@u.nus.edu");
assert.equal(content.resume.projects.length, 4);
const codeloop = content.resume.projects.find((project) => project.slug === "coding-agent");
assert.equal(codeloop?.name, "codeloop");
assert.equal(codeloop?.links.find((link) => link.kind === "repository")?.url, "https://github.com/Darrenus/codeloop");
assert.ok(content.resume.projects.every((project) => project.slug));
assert.ok(content.resume.projects.every((project) => project.links.some((link) => link.kind === "internal" && link.url === `/projects/${project.slug}` && link.status === "active")));
assert.equal(codeloop?.links.find((link) => link.kind === "repository")?.status, "active");
assert.match(codeloop?.summary ?? "", /LLM Agent 主循环/);
assert.match(codeloop?.highlights.join(" ") ?? "", /SWE-bench Verified/);
assert.ok(content.resume.experience.some((entry) => entry.highlights.length >= 4));
assert.ok(content.resume.experience.flatMap((entry) => entry.links).some((link) => link.label === "智己汽车官网" && link.status === "active"));
assert.ok(content.resume.education.flatMap((entry) => entry.links).every((link) => link.status === "active" ? Boolean(link.url) : true));

const serialized = JSON.stringify(content);
assert.doesNotMatch(serialized, /1[3-9][0-9]{9}/);
assert.doesNotMatch(serialized, /hr\.bio/);
assert.match(serialized, /20\+/);
assert.match(serialized, /约 2/);
assert.doesNotMatch(serialized, /85%/);
assert.match(serialized, /SWE-bench Verified/);

console.log("content source checks passed");
