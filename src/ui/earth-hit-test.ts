import { Vector2, type Camera, type Raycaster, type Sphere } from "three";

/** Use the rendered camera and sphere, including zoom, parallax and page scroll. */
export function hitsEarthSurface(
  clientX: number,
  clientY: number,
  bounds: { left: number; top: number; width: number; height: number },
  camera: Camera,
  sphere: Sphere,
  ray: Raycaster,
): boolean {
  if (
    bounds.width <= 0 || bounds.height <= 0 ||
    clientX < bounds.left || clientX > bounds.left + bounds.width ||
    clientY < bounds.top || clientY > bounds.top + bounds.height
  ) return false;
  camera.updateMatrixWorld();
  ray.setFromCamera(new Vector2(
    ((clientX - bounds.left) / bounds.width) * 2 - 1,
    1 - ((clientY - bounds.top) / bounds.height) * 2,
  ), camera);
  return ray.ray.intersectsSphere(sphere);
}
