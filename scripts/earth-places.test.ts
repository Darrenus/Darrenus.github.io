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
const reflections = EARTH_PLACES.filter(p => p.kind === "reflection");
assert.deepEqual(reflections.map(p => p.id), ["chengdu", "chongqing", "beijing", "hong-kong", "macao", "stanford-visit", "cambridge-visit", "new-york-visit"]);
assert.equal(new Set(EARTH_PLACES.map(p => p.id)).size, EARTH_PLACES.length);
for (const place of reflections) {
  assert.ok(place.reflection?.period && place.reflection.note);
  assert.deepEqual(place.recordIds, [], "Visits must not become education or employment credentials");
  assert.equal(place.url, undefined, "Click visits to read the note, not to redirect");
}
assert.deepEqual(EARTH_PLACES.find(p => p.id === "cambridge-visit")?.reflection?.visited, ["哈佛大学", "麻省理工学院（MIT）"]);
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
    x: width * .5 + i * 2,
    y: height * 0.4 + i * 5,
    side: p.labelSide,
    rise: p.labelRise,
    compact: p.kind === "reflection",
  }));
  const boxes = layoutPlaceLabels(points, width, height);
  if (width >= 390) assert.equal(boxes.length, points.length, "All points fit when the viewport has room on both sides");
  else assert.ok(boxes.length >= 8, "On tiny screens, omit crowded labels instead of reversing their direction");
  for (let i = 0; i < boxes.length; i++) {
    const a = boxes[i];
    const anchor = points.find(p => p.id === a.id)!;
    assert.ok(anchor.side === "left" ? a.x + 60 <= anchor.x - 18 : a.x >= anchor.x + 18,
      `${a.id} must stay on its assigned side of the geographic point`);
    assert.ok(
      a.x >= 0 && a.x + 60 <= width && a.y >= 92 && a.y + 44 < height - 100,
    );
    for (const b of boxes.slice(i + 1))
      assert.ok(
        Math.abs(a.x - b.x) >= 66 || Math.abs(a.y - b.y) >= 50,
        `${a.id} overlaps ${b.id}`,
      );
  }
  for (const side of ["left", "right"] as const) {
    const ordered = boxes.filter(b => points.find(p => p.id === b.id)?.side === side)
      .sort((a, b) => points.find(p => p.id === a.id)!.y - points.find(p => p.id === b.id)!.y);
    for (let i = 1; i < ordered.length; i++)
      assert.ok(ordered[i].y >= ordered[i - 1].y + 50, "Callouts must preserve geographic order");
  }
}
assert.equal(EARTH_PLACES.find(p => p.id === "chongqing")?.labelSide, "left");
console.log("Touch labels stay in the viewport and do not overlap");
