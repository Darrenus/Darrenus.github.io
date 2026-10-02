import { isEnglish } from "../i18n";
export interface EarthPlace {
  id: string;
  kind: "education" | "experience" | "academic" | "reflection";
  label: string;
  shortLabel?: string;
  educationLevel?: "本科" | "硕士" | "B.Sc." | "M.Tech.";
  city: string;
  longitude: number;
  latitude: number;
  recordIds: string[];
  url?: string;
  labelSide: "left" | "right";
  labelRise: number;
  reflection?: { period: string; note: string; visited?: string[] };
}

// User-approved public records only, at city or campus level.
// Reflections are visits, not education or employment credentials.
// Do not infer event attendance from a competition's name or organizer address.
const places: EarthPlace[] = [
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
    shortLabel: "韩科院",
    educationLevel: "本科",
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
    educationLevel: "硕士",
    city: "新加坡",
    longitude: 103.78,
    latitude: 1.3,
    recordIds: ["nus-master"],
    url: "https://nus.edu.sg/",
    labelSide: "right",
    labelRise: 16,
  },
  {
    id: "chengdu", kind: "reflection", label: "成都", city: "成都",
    longitude: 104.07, latitude: 30.57, recordIds: [], labelSide: "left", labelRise: -25,
    reflection: { period: "2024年", note: "慢下来以后，我开始意识到，不必始终给自己施加压力。努力之外，也要学会放松。" },
  },
  {
    id: "chongqing", kind: "reflection", label: "重庆", city: "重庆",
    longitude: 106.55, latitude: 29.56, recordIds: [], labelSide: "left", labelRise: 25,
    reflection: { period: "2024年", note: "慢下来以后，我开始意识到，不必始终给自己施加压力。努力之外，也要学会放松。" },
  },
  {
    id: "beijing", kind: "reflection", label: "北京", city: "北京",
    longitude: 116.41, latitude: 39.90, recordIds: [], labelSide: "left", labelRise: 0,
    reflection: { period: "2025年、2026年", note: "运气会影响结果，但自己能够持续把握的，仍然是准备和努力。愿望实现之后，更应该记得这一路做过的事。" },
  },
  {
    id: "hong-kong", kind: "reflection", label: "香港", city: "香港",
    longitude: 114.17, latitude: 22.32, recordIds: [], labelSide: "right", labelRise: 35,
    reflection: { period: "2025年", note: "繁华与差距同时存在，也让我更具体地思考自己想要怎样的生活，以及愿意为此付出怎样的努力。" },
  },
  {
    id: "macao", kind: "reflection", label: "澳门", city: "澳门",
    longitude: 113.54, latitude: 22.20, recordIds: [], labelSide: "left", labelRise: 55,
    reflection: { period: "2025年", note: "繁华与差距同时存在，也让我更具体地思考自己想要怎样的生活，以及愿意为此付出怎样的努力。" },
  },
  {
    id: "stanford-visit", kind: "reflection", label: "斯坦福", city: "斯坦福 · 美国",
    longitude: -122.17, latitude: 37.43, recordIds: [], labelSide: "left", labelRise: 0,
    reflection: { period: "2018年", visited: ["斯坦福大学"], note: "2018年的美国之行，让我体会到不同文化之间的差异。参访这些大学，也在心里种下了求学的种子。" },
  },
  {
    id: "cambridge-visit", kind: "reflection", label: "剑桥", city: "剑桥 · 美国",
    longitude: -71.11, latitude: 42.37, recordIds: [], labelSide: "right", labelRise: 0,
    reflection: { period: "2018年", visited: ["哈佛大学", "麻省理工学院（MIT）"], note: "2018年的美国之行，让我体会到不同文化之间的差异。参访这些大学，也在心里种下了求学的种子。" },
  },
  {
    id: "new-york-visit", kind: "reflection", label: "纽约", city: "纽约 · 美国",
    longitude: -74.01, latitude: 40.71, recordIds: [], labelSide: "left", labelRise: 0,
    reflection: { period: "2018年", visited: ["哥伦比亚大学"], note: "2018年的美国之行，让我体会到不同文化之间的差异。参访这些大学，也在心里种下了求学的种子。" },
  },
];


const englishPlaces: Record<string, Partial<EarthPlace>> = {
  "shanghai": {
    "label": "Shanghai",
    "city": "Shanghai"
  },
  "zhengzhou": {
    "label": "Zhengzhou",
    "city": "Zhengzhou"
  },
  "kaist": {
    "label": "Korea Advanced Institute of Science and Technology",
    "shortLabel": "KAIST",
    "educationLevel": "B.Sc.",
    "city": "Daejeon",
    "url": "https://www.kaist.ac.kr/en/"
  },
  "nus": {
    "label": "National University of Singapore",
    "shortLabel": "NUS",
    "educationLevel": "M.Tech.",
    "city": "Singapore"
  },
  "chengdu": {
    "label": "Chengdu",
    "city": "Chengdu",
    "reflection": {
      "period": "2024",
      "note": "Slowing down reminded me that constant pressure is not the same as progress. Learning to rest matters alongside learning to work."
    }
  },
  "chongqing": {
    "label": "Chongqing",
    "city": "Chongqing",
    "reflection": {
      "period": "2024",
      "note": "Slowing down reminded me that constant pressure is not the same as progress. Learning to rest matters alongside learning to work."
    }
  },
  "beijing": {
    "label": "Beijing",
    "city": "Beijing",
    "reflection": {
      "period": "2025 & 2026",
      "note": "Luck can change an outcome. Preparation and effort are what I can keep shaping. When a wish comes true, it is worth remembering the work along the way."
    }
  },
  "hong-kong": {
    "label": "Hong Kong",
    "city": "Hong Kong",
    "reflection": {
      "period": "2025",
      "note": "Prosperity and inequality sit close together here. Seeing both made me think more concretely about the life I want, and the work I am willing to put into it."
    }
  },
  "macao": {
    "label": "Macao",
    "city": "Macao",
    "reflection": {
      "period": "2025",
      "note": "Prosperity and inequality sit close together here. Seeing both made me think more concretely about the life I want, and the work I am willing to put into it."
    }
  },
  "stanford-visit": {
    "label": "Stanford",
    "city": "Stanford, USA",
    "reflection": {
      "period": "2018",
      "visited": [
        "Stanford University"
      ],
      "note": "My 2018 trip to the US introduced me to different cultures. Visiting these universities planted the idea of studying further."
    }
  },
  "cambridge-visit": {
    "label": "Cambridge",
    "city": "Cambridge, USA",
    "reflection": {
      "period": "2018",
      "visited": [
        "Harvard University",
        "MIT"
      ],
      "note": "My 2018 trip to the US introduced me to different cultures. Visiting these universities planted the idea of studying further."
    }
  },
  "new-york-visit": {
    "label": "New York",
    "city": "New York, USA",
    "reflection": {
      "period": "2018",
      "visited": [
        "Columbia University"
      ],
      "note": "My 2018 trip to the US introduced me to different cultures. Visiting these universities planted the idea of studying further."
    }
  }
};
export const EARTH_PLACES: EarthPlace[] = places.map(place => isEnglish ? { ...place, ...englishPlaces[place.id] } : place);

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
  compact?: boolean;
}
/** Keep real coordinates fixed while separating 44px labels on narrow screens. */
export function layoutPlaceLabels(
  points: ProjectedPlace[],
  width: number,
  height: number,
  labelWidth = 60,
) {
  const boxes: { id: string; x: number; y: number }[] = [];
  const minY = width <= 480 ? 214 : 92;
  const maxY = Math.max(minY, height - 160);
  const maxX = Math.max(10, width - labelWidth - 10);
  // Two ordered callout columns keep nearby cities from jumping across one another.
  // Real coordinates never move; arrows connect each label back to its anchor.
  const capacity = Math.floor((maxY - minY) / 50) + 1;
  for (const side of ["left", "right"] as const) {
    const eligible = points.filter(p => p.side === side &&
      (side === "left" ? p.x >= labelWidth + 28 : p.x <= width - labelWidth - 28));
    // Preserve education and employment labels if a short viewport is crowded.
    const group = eligible.sort((a, b) => Number(!!a.compact) - Number(!!b.compact))
      .slice(0, capacity).sort((a, b) => a.y - b.y);
    if (!group.length) continue;
    const x = width <= 760 ? (side === "left" ? 10 : maxX) : side === "left"
      ? Math.max(10, Math.min(...group.map(p => p.x)) - labelWidth - 44)
      : Math.min(maxX, Math.max(...group.map(p => p.x)) + 44);
    const desired = group.map(p => p.y + p.rise - 22);
    const packed: number[] = [];
    for (let i = 0; i < group.length; i++)
      packed.push(Math.min(maxY - (group.length - 1 - i) * 50,
        Math.max(desired[i], i ? packed[i - 1] + 50 : minY)));
    // Balance displacement above and below the cluster rather than pushing it south.
    const meanShift = desired.reduce((sum, value, i) => sum + value - packed[i], 0) / group.length;
    const shift = Math.max(minY - packed[0], Math.min(maxY - packed[packed.length - 1], meanShift));
    group.forEach((p, i) => boxes.push({ id: p.id, x, y: packed[i] + shift }));
  }
  return boxes;
}
