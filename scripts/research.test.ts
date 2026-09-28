import assert from "node:assert/strict";
import { PUBLICATIONS } from "../src/content/research";

assert.equal(PUBLICATIONS.length, 3);
assert.equal(new Set(PUBLICATIONS.map((p) => p.id)).size, PUBLICATIONS.length);
const expectedUrls = new Set([
  "https://doi.org/10.48550/arXiv.2609.17464",
  "https://doi.org/10.48550/arXiv.2609.13692",
  "https://zenodo.org/records/22684761",
]);
for (const paper of PUBLICATIONS) {
  assert.ok(paper.title && paper.summary);
  assert.deepEqual(paper.authors, ["Rong He"]);
  assert.match(paper.status, /^预印本/);
  assert.ok(!Number.isNaN(Date.parse(paper.publishedAt)));
  for (const link of paper.links) {
    assert.ok(
      expectedUrls.delete(link.url),
      `Unexpected or duplicate URL: ${link.url}`,
    );
    assert.ok(link.platform === "arXiv" || link.platform === "Zenodo");
  }
}
assert.equal(
  expectedUrls.size,
  0,
  "Every supplied publication must be included",
);
console.log(
  "Research records preserve the supplied publication URLs, authors and preprint status",
);
