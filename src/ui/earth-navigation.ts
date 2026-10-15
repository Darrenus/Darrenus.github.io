export const clampZoom = (value: number) => Math.max(0, Math.min(1, value));
export function wheelStep(delta: number, mode: number, height: number) {
  const pixels = delta * (mode === 1 ? 16 : mode === 2 ? height : 1);
  return Math.max(-180, Math.min(180, pixels));
}
export function cameraDistance(zoom: number, aspect: number) {
  const near = 2.68;
  const far = aspect < 1 ? 4.9 / Math.max(aspect, 0.48) : 6.1;
  const t = clampZoom(zoom);
  return far + (near - far) * (1 - Math.pow(1 - t, 1.35));
}

// Near view: the upper silhouette sits below the chat, regardless of aspect ratio.
export function earthFraming(zoom: number, aspect: number) {
  const z = cameraDistance(zoom, aspect);
  const t = 1 - Math.pow(1 - clampZoom(zoom), 1.35);
  const halfFov = Math.tan(19 * Math.PI / 180);
  const horizon = aspect < 1 ? 0.75 : 0.65;
  const tangent = (1 - 2 * horizon) * halfFov;
  const nearY = tangent * cameraDistance(1, aspect) - 1.4 * Math.sqrt(1 + tangent * tangent);
  const farY = -0.16 * cameraDistance(0, aspect) * halfFov;
  return { z, y: farY + (nearY - farY) * t };
}
export function chatReveal(zoom: number) {
  const t = clampZoom((zoom - 0.35) / 0.65);
  return t * t * (3 - 2 * t);
}
export function canZoomFromWheel(zoom: number, delta: number) {
  return delta < 0 ? zoom > 0 : delta > 0 && zoom < 1;
}
