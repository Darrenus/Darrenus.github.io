import assert from "node:assert/strict";
import { CONTENT } from "../src/content";
import { normalizePath, parseRoute } from "../src/routes";

assert.equal(normalizePath(""), "/");
assert.equal(normalizePath("projects///"), "/projects");
assert.deepEqual(parseRoute("/"), { kind: "home" });
assert.deepEqual(parseRoute("/resume/"), { kind: "resume" });
assert.deepEqual(parseRoute("/projects"), { kind: "projects" });
assert.deepEqual(parseRoute("/projects/coding-agent/"), { kind: "project", slug: "coding-agent" });
assert.deepEqual(parseRoute("/projects/not_a_slug"), { kind: "not-found" });
assert.deepEqual(parseRoute("/not-a-page"), { kind: "not-found" });

for (const project of CONTENT.resume.projects) {
  assert.deepEqual(parseRoute(`/projects/${project.slug}`), { kind: "project", slug: project.slug });
  const internalLink = project.links.find((link) => link.kind === "internal" && link.status === "active");
  assert.equal(internalLink?.url, `/projects/${project.slug}`);
}

console.log("route checks passed");
