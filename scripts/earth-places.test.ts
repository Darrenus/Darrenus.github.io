import { layoutPlaceLabels } from "../src/ui/earth-places";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  EARTH_PLACES,
  geographicPosition,
  facesCamera,
} from "../src/ui/earth-places";
import { CONTENT } from "../src/content";

const close = (a: number, b: number) =>
  assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
const equator = geographicPosition(0, 0);
close(equator[0], 1.4);
close(equator[1], 0);
close(equator[2], 0);
close(geographicPosition(90, 0)[2], -1.4);
close(geographicPosition(0, 90)[1], 1.4);
for (const place of EARTH_PLACES) {
  const [x, y, z] = geographicPosition(place.longitude, place.latitude);
  close(Math.hypot(x, y, z), 1.4);
  // Longitude must land on the same UV pixel as the existing coast texture.
  const u = (Math.atan2(z, -x) / (2 * Math.PI) + 1) % 1;
  close(u, (place.longitude + 180) / 360);
  assert.ok(
    place.longitude >= -180 &&
      place.longitude <= 180 &&
      Math.abs(place.latitude) <= 90,
  );
  const records =
    place.kind === "education"
      ? CONTENT.resume.education
      : CONTENT.resume.experience;
  for (const id of place.recordIds)
    assert.ok(records.some((r) => r.id === id && r.visibility === "public"));
}
assert.equal(
  EARTH_PLACES.find((p) => p.id === "kaist")?.url,
  "https://www.kaist.ac.kr/kr/",
);
assert.equal(
  EARTH_PLACES.find((p) => p.id === "nus")?.url,
  "https://nus.edu.sg/",
);
assert.deepEqual(
  EARTH_PLACES.filter((p) => p.kind === "experience")
    .flatMap((p) => p.recordIds)
    .sort(),
  CONTENT.resume.experience.map((e) => e.id).sort(),
);
assert.ok(
  EARTH_PLACES.every((p) => p.kind === "education" || p.kind === "experience"),
  "No academic or personal-life locations in this release",
);
assert.equal(facesCamera([0, 0, 1], [0, 0, 1]), true);
assert.equal(facesCamera([0, 0, -1], [0, 0, 1]), false);
assert.equal(
  facesCamera([1, 0, 0], [-0.2, 0, 1]),
  false,
  "Hide points behind the perspective horizon",
);
const borders = JSON.parse(
  readFileSync(
    new URL("../public/globe/borders.json", import.meta.url),
    "utf8",
  ),
) as number[][][];
assert.ok(borders.length > 300);
for (const line of borders) {
  assert.ok(line.length >= 2);
  for (const [lon, lat] of line)
    assert.ok(
      Number.isFinite(lon) &&
        Number.isFinite(lat) &&
        Math.abs(lon) <= 180 &&
        Math.abs(lat) <= 90,
    );
}
console.log(
  "Public place records, school URLs, sphere/UV alignment, visibility and boundary geometry passed",
);

// Shanghai and KAIST are close: their clickable labels must never overlap.
for (const [width, height] of [
  [320, 568],
  [390, 844],
  [1280, 720],
]) {
  const points = EARTH_PLACES.map((p, i) => ({
    id: p.id,
    x: width - 30 + i * 2,
    y: height * 0.4 + i * 5,
    side: p.labelSide,
    rise: p.labelRise,
  }));
  const boxes = layoutPlaceLabels(points, width, height);
  for (let i = 0; i < boxes.length; i++) {
    const a = boxes[i];
    assert.ok(
      a.x >= 0 && a.x + 60 <= width && a.y >= 92 && a.y + 44 < height - 100,
    );
    for (const b of boxes.slice(i + 1))
      assert.ok(
        Math.abs(a.x - b.x) >= 66 || Math.abs(a.y - b.y) >= 50,
        `${a.id} overlaps ${b.id}`,
      );
  }
}
console.log("Touch labels stay in the viewport and do not overlap");
