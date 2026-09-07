import assert from "node:assert/strict";
import { CONTENT } from "../src/content";
import {
  OBSERVATIONS,
  nearestRotation,
  normalizeTopic,
  topicFromAngle,
  questionHref,
  readQuestion,
} from "../src/ui/observations";

// Both drag and keyboard can cross zero repeatedly without taking the long way around.
assert.equal(normalizeTopic(-1), 5);
assert.equal(normalizeTopic(6), 0);
assert.equal(topicFromAngle(-61), 5);
assert.equal(topicFromAngle(359), 0);
assert.equal(nearestRotation(300, 0), 360);
assert.equal(nearestRotation(0, 5), -60);
assert.equal(nearestRotation(-780, 0), -720);
assert.equal(nearestRotation(1439, 0), 1440);

const validPaths = new Set([
  ...CONTENT.resume.projects.map((p) => `/projects/${p.slug}`),
  ...CONTENT.resume.experience.map((e) => `/resume#${e.id}`),
  ...CONTENT.resume.education.map((e) => `/resume#${e.id}`),
]);
for (const topic of OBSERVATIONS) {
  assert.ok(topic.evidence.length >= 2 && topic.evidence.length <= 3);
  for (const source of topic.evidence)
    assert.ok(validPaths.has(source.href), `Missing source: ${source.href}`);
  assert.equal(
    readQuestion(
      new URL(questionHref(topic.question), "https://rong.bio").search,
    ),
    topic.question,
  );
}
assert.equal(readQuestion("?q=%20%20"), "");
assert.equal(readQuestion("?q=" + "a".repeat(1300)).length, 1200);
assert.equal(readQuestion("?q=A%26B%3F%20%E8%B4%BA%E8%9E%8D"), "A&B? 贺融");
console.log("observation navigation, rotation and question checks passed");
