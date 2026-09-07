import assert from "node:assert/strict";
import {
  cameraDistance,
  clampZoom,
  wheelStep,
} from "../src/ui/earth-navigation";

// Trackpads, line wheels and page wheels must preserve direction and bound jumps.
assert.equal(wheelStep(2, 0, 800), 2);
assert.equal(wheelStep(2, 1, 800), 32);
assert.equal(wheelStep(1, 2, 800), 180);
assert.equal(wheelStep(-4000, 0, 800), -180);
assert.equal(clampZoom(-1), 0);
assert.equal(clampZoom(2), 1);

// A full sphere must fit horizontally on phones; close views never enter its surface.
for (const aspect of [320 / 568, 390 / 844, 1, 1280 / 720]) {
  const far = cameraDistance(0, aspect);
  const horizontalHalfFov = Math.atan(Math.tan((19 * Math.PI) / 180) * aspect);
  assert.ok(far * Math.sin(horizontalHalfFov) > 1.4);
  let previous = far;
  for (let step = 1; step <= 100; step++) {
    const distance = cameraDistance(step / 100, aspect);
    assert.ok(distance < previous, "Zoom must move continuously toward Earth");
    assert.ok(distance > 1.4 + 0.05, "Camera must stay outside the surface");
    previous = distance;
  }
  assert.equal(cameraDistance(-1, aspect), far);
  assert.equal(cameraDistance(2, aspect), cameraDistance(1, aspect));
}
console.log("Earth wheel normalization, framing and zoom boundaries passed");
