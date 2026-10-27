import { prefersReducedMotion } from '../utils/device.js';

const BASE_FOV = 50;
const BASE_BLOOM = 0.5;

// Dynamic bloom + FOV warp triggered by distance to either sphere (at z=0 or z=-220).
// FOV only updates inside the portal zone to avoid frame-rate jitter from constant matrix recalc.
// Reduced motion: the 50 -> 120 FOV warp is a vestibular trigger, so it is skipped entirely.
export function stepPortalEffect({ currentCameraZ, camera, bloomPass }) {
  let distanceToSphere = Math.abs(currentCameraZ);
  if (Math.abs(currentCameraZ - (-220)) < distanceToSphere) {
    distanceToSphere = Math.abs(currentCameraZ - (-220));
  }

  if (distanceToSphere < 10 && !prefersReducedMotion()) {
    const intensity = Math.pow((10 - distanceToSphere) / 10, 3) * 4.0;
    bloomPass.strength = BASE_BLOOM + intensity;
    camera.fov = BASE_FOV + (70 * (1 - (distanceToSphere / 10))); // 50 -> 120 warp
    camera.updateProjectionMatrix();
  } else {
    bloomPass.strength = BASE_BLOOM;
    if (camera.fov !== BASE_FOV) {
      camera.fov = BASE_FOV;
      camera.updateProjectionMatrix();
    }
  }
}
