// Dynamic bloom + FOV warp triggered by distance to either sphere (at z=0 or z=-220).
// FOV only updates inside the portal zone to avoid frame-rate jitter from constant matrix recalc.
export function stepPortalEffect({ currentCameraZ, camera, bloomPass }) {
  let distanceToSphere = Math.abs(currentCameraZ);
  if (Math.abs(currentCameraZ - (-220)) < distanceToSphere) {
    distanceToSphere = Math.abs(currentCameraZ - (-220));
  }

  if (distanceToSphere < 10) {
    const intensity = Math.pow((10 - distanceToSphere) / 10, 3) * 4.0;
    bloomPass.strength = 0.5 + intensity;
    camera.fov = 50 + (70 * (1 - (distanceToSphere / 10))); // 50 -> 120 warp
    camera.updateProjectionMatrix();
  } else {
    bloomPass.strength = 0.5;
    if (camera.fov !== 50) {
      camera.fov = 50;
      camera.updateProjectionMatrix();
    }
  }
}
