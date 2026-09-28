export interface EarthPlace {
  id: string;
  kind: "education" | "experience" | "academic";
  label: string;
  shortLabel?: string;
  city: string;
  longitude: number;
  latitude: number;
  recordIds: string[];
  url?: string;
  labelSide: "left" | "right";
  labelRise: number;
}

// Public education / professional geography only, at city or campus level.
// Do not infer event attendance from a competition's name or organizer address.
export const EARTH_PLACES: EarthPlace[] = [
  {
    id: "shanghai",
    kind: "experience",
    label: "上海",
    city: "上海",
    longitude: 121.47,
    latitude: 31.23,
    recordIds: ["saic-im-ai", "gweee-automation", "apt-java-web"],
    labelSide: "right",
    labelRise: 23,
  },
  {
    id: "zhengzhou",
    kind: "experience",
    label: "郑州",
    city: "郑州",
    longitude: 113.63,
    latitude: 34.75,
    recordIds: ["jantech-industrial-ai"],
    labelSide: "left",
    labelRise: -10,
  },
  {
    id: "kaist",
    kind: "education",
    label: "韩国科学技术院",
    shortLabel: "韩国科院",
    city: "大田",
    longitude: 127.36,
    latitude: 36.37,
    recordIds: ["kaist-bachelor"],
    url: "https://www.kaist.ac.kr/kr/",
    labelSide: "right",
    labelRise: -24,
  },
  {
    id: "nus",
    kind: "education",
    label: "新加坡国立大学",
    shortLabel: "新国大",
    city: "新加坡",
    longitude: 103.78,
    latitude: 1.3,
    recordIds: ["nus-master"],
    url: "https://nus.edu.sg/",
    labelSide: "right",
    labelRise: 16,
  },
];

/** Same equirectangular convention as the existing land texture / SphereGeometry. */
export function geographicPosition(
  longitude: number,
  latitude: number,
  radius = 1.4,
): [number, number, number] {
  const lon = (longitude * Math.PI) / 180,
    lat = (latitude * Math.PI) / 180;
  return [
    radius * Math.cos(lat) * Math.cos(lon),
    radius * Math.sin(lat),
    -radius * Math.cos(lat) * Math.sin(lon),
  ];
}

/** Hide far-side points using perspective visibility, not only hemisphere Z. */
export function facesCamera(
  normal: readonly number[],
  toCamera: readonly number[],
) {
  return normal.reduce((sum, value, i) => sum + value * toCamera[i], 0) > 0.08;
}

export interface ProjectedPlace {
  id: string;
  x: number;
  y: number;
  side: "left" | "right";
  rise: number;
}
/** Keep real coordinates fixed while separating 44px labels on narrow screens. */
export function layoutPlaceLabels(
  points: ProjectedPlace[],
  width: number,
  height: number,
) {
  const boxes: { id: string; x: number; y: number }[] = [];
  for (const p of points) {
    const x = Math.max(
      10,
      Math.min(width - 70, p.x + (p.side === "left" ? -80 : 20)),
    );
    const preferred = p.y + p.rise - 22;
    let y = Math.max(92, Math.min(height - 160, preferred));
    for (const shift of [0, -50, 50, -100, 100, -150, 150]) {
      const candidate = Math.max(92, Math.min(height - 160, preferred + shift));
      if (
        !boxes.some(
          (b) => Math.abs(b.x - x) < 66 && Math.abs(b.y - candidate) < 50,
        )
      ) {
        y = candidate;
        break;
      }
    }
    boxes.push({ id: p.id, x, y });
  }
  return boxes;
}
