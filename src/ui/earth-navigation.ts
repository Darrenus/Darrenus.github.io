export const clampZoom = (value: number) => Math.max(0, Math.min(1, value));
export function wheelStep(delta: number, mode: number, height: number) {
  const pixels = delta * (mode === 1 ? 16 : mode === 2 ? height : 1);
  return Math.max(-180, Math.min(180, pixels));
}
export function cameraDistance(zoom: number, aspect: number) {
  const near = 2.68;
  const far = aspect < 1 ? 4.9 / Math.max(aspect, 0.48) : 5.3;
  const t = clampZoom(zoom);
  return far + (near - far) * (1 - Math.pow(1 - t, 1.35));
}
