import assert from "node:assert/strict";
import { PerspectiveCamera, Raycaster, Sphere, Vector3 } from "three";
import { hitsEarthSurface } from "../src/ui/earth-hit-test";
import {
  cameraDistance,
  earthFraming,
  chatReveal,
  canZoomFromWheel,
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
// Wheel ownership follows the projected sphere, not the canvas rectangle.
const camera = new PerspectiveCamera(38, 1280 / 800, 0.05, 60);
camera.position.set(0, 0, 6);
camera.lookAt(0, 0, 0);
const sphere = new Sphere(new Vector3(), 1.4);
const ray = new Raycaster();
const bounds = { left: 0, top: 0, width: 1280, height: 800 };
const hit = (x: number, y: number, rect = bounds) => hitsEarthSurface(x, y, rect, camera, sphere, ray);
const radius = 400 * Math.tan(Math.asin(1.4 / 6)) / Math.tan(19 * Math.PI / 180);
assert.ok(hit(640, 400));
assert.ok(hit(640 + radius - 1, 400), "Just inside the silhouette zooms");
assert.ok(!hit(640 + radius + 1, 400), "Just outside the silhouette scrolls the page");
assert.ok(!hit(640 + radius * 0.8, 400 + radius * 0.8), "Transparent corners inside the sphere's bounding box remain page scroll");
assert.ok(!hit(10, 10));
assert.ok(hit(640, 150, { ...bounds, top: -250 }), "A partially scrolled globe still responds at its visible position");
assert.ok(!hit(640, 600, { ...bounds, top: -250 }), "Off-canvas positions cannot capture wheel input");
assert.ok(hit(690, 450, { ...bounds, left: 50, top: 50 }));
assert.ok(!hit(640, 400, { ...bounds, width: 0 }));
assert.ok(!hit(1050, 400));
camera.position.z = cameraDistance(1, camera.aspect);
assert.ok(hit(1050, 400), "The hit region grows with the rendered globe");
camera.position.set(0.07, -0.04, cameraDistance(0.6, camera.aspect));
camera.lookAt(0, 0, 0);
camera.updateMatrixWorld();
sphere.center.set(0.104, -0.506, 0);
const projected = sphere.center.clone().project(camera);
assert.ok(hit((projected.x + 1) * 640, (1 - projected.y) * 400), "Camera parallax and translated globe retain correct hit detection");
console.log("Earth wheel normalization, framing, zoom and sphere-only wheel boundaries passed");

// The new arrival view leaves room for chat, and the far sphere stays entirely in frame.
for (const aspect of [320 / 700, 390 / 844, 768 / 1024, 1280 / 720, 1920 / 1080]) {
  const camera = new PerspectiveCamera(38, aspect, 0.05, 60);
  for (const zoom of [0, 1]) {
    const frame = earthFraming(zoom, aspect);
    camera.position.set(0, 0, frame.z);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    let top = 1, bottom = 0;
    for (let n = 0; n < 720; n++) {
      const angle = n * Math.PI / 360;
      const point = new Vector3(0, frame.y + 1.4 * Math.sin(angle), 1.4 * Math.cos(angle)).project(camera);
      const screenY = (1 - point.y) / 2;
      top = Math.min(top, screenY);
      bottom = Math.max(bottom, screenY);
    }
    if (zoom === 1) {
      assert.ok(Math.abs(top - (aspect < 1 ? 0.75 : 0.65)) < 0.001, 'Near globe begins below the conversation');
      assert.ok(bottom > 1, 'The enlarged sphere extends below the viewport');
    } else {
      assert.ok(top > 0.1 && bottom < 0.95, 'The complete sphere fits between navigation and footer');
    }
  }
}
assert.equal(chatReveal(1), 1);
assert.equal(chatReveal(0), 0);
for (let i = 1; i <= 100; i++) assert.ok(chatReveal(i / 100) >= chatReveal((i - 1) / 100));
assert.equal(canZoomFromWheel(1, 100), false);
assert.equal(canZoomFromWheel(0, -100), false);
assert.equal(canZoomFromWheel(1, -100), true);
assert.equal(canZoomFromWheel(0, 100), true);
assert.equal(canZoomFromWheel(0.5, 0), false);
console.log('Chat reveal, bottom-anchored framing and scroll release passed');
