import assert from "node:assert/strict";
import { CONSTELLATIONS, DUST, limitAngle, projectStar } from "../src/ui/constellations";

assert.deepEqual(CONSTELLATIONS.map(item => item.stars.length), [7, 5, 7, 4]);
for (const constellation of CONSTELLATIONS) {
  for (const [from, to] of constellation.edges) {
    assert.ok(from !== to && constellation.stars[from] && constellation.stars[to]);
  }
  // Dragging to any allowed extreme must keep stars finite and inside the
  // padded viewBox, so no perspective flip or spill into the chat is possible.
  for (let x = -8; x <= 8; x++) for (let y = -8; y <= 8; y++) {
    for (const star of [...constellation.stars, ...DUST]) {
      const point = projectStar(star, limitAngle(x / 10), limitAngle(y / 10));
      assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
      assert.ok(point.scale > 0 && point.scale < 1.5);
      assert.ok(point.x >= 0 && point.x <= 240 && point.y >= 0 && point.y <= 160);
    }
  }
}
assert.equal(limitAngle(100), 0.68);
assert.equal(limitAngle(-100), -0.68);
assert.deepEqual(projectStar([0, 0, 0], 0.4, -0.5), { x: 120, y: 80, scale: 1 });
const front = projectStar([50, 20, 25], 0, 0);
const turned = projectStar([50, 20, 25], 0.3, 0.4);
assert.notDeepEqual(front, turned);
console.log("Constellation outlines and bounded perspective rotation passed");
