export type StarPoint = readonly [number, number, number];
export type Constellation = {
  name: string;
  english: string;
  stars: StarPoint[];
  edges: [number, number][];
};

// Recognizable silhouettes, not measured stellar distances or a navigational sky map.
// Shape reference: https://svs.gsfc.nasa.gov/4851/
export const CONSTELLATIONS: Constellation[] = [
  {
    name: "北斗七星", english: "Big Dipper",
    stars: [[-79, 29, 0], [-51, 7, 4], [-23, 0, -3], [5, -15, 2], [60, -28, 0], [65, 7, -4], [15, 20, 3]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]],
  },
  {
    name: "仙后座", english: "Cassiopeia",
    stars: [[-76, -24, 0], [-42, 29, 4], [-5, -14, -2], [33, 26, 3], [73, -34, 0]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  {
    name: "猎户座", english: "Orion",
    stars: [[-43, -48, 3], [43, -43, -2], [-17, 3, 1], [0, 0, 0], [17, -3, -1], [-42, 49, -3], [43, 44, 2]],
    edges: [[0, 1], [0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6], [5, 6]],
  },
  {
    name: "南十字座", english: "Southern Cross",
    stars: [[4, -48, -2], [-35, -6, 3], [35, -12, -3], [-3, 49, 2]],
    edges: [[0, 3], [1, 2]],
  },
];

const dustSeeds: StarPoint[] = [
  [-101, -58, 23], [-64, -61, -27], [-17, -59, 18], [69, -62, -18],
  [103, -44, 29], [-108, -12, -14], [-82, 12, 31], [98, 8, -25],
  [-104, 54, 11], [-69, 62, -22], [-19, 60, 25], [76, 57, -16],
  [108, 42, 17], [54, 22, 30], [-52, -13, -28], [24, -53, 22],
  [9, 35, -26], [-33, 39, 15],
];
// Keep the background inside the frame even at the most oblique drag angle.
export const DUST: StarPoint[] = dustSeeds.map(([x, y, z]) => [x * 0.9, y * 0.65, z * 0.65]);

export const limitAngle = (angle: number) => Math.max(-0.68, Math.min(0.68, angle));

export function projectStar([x, y, z]: StarPoint, pitch: number, yaw: number) {
  const turnedX = x * Math.cos(yaw) + z * Math.sin(yaw);
  const turnedZ = -x * Math.sin(yaw) + z * Math.cos(yaw);
  const turnedY = y * Math.cos(pitch) - turnedZ * Math.sin(pitch);
  const depth = y * Math.sin(pitch) + turnedZ * Math.cos(pitch);
  const scale = 420 / (420 - depth);
  return { x: 120 + turnedX * scale, y: 80 + turnedY * scale, scale };
}
