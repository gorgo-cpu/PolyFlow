// Per-frame blueprint opacity LERP + X-axis fly-in for the first two blueprints.
// Objects materialize up to 180 units ahead and sharp-fade as they pass behind the lens.
export function stepBlueprintFade({ currentCameraZ, blueprints }) {
  blueprints.forEach(bp => {
    const zOffset = currentCameraZ - bp.z;
    let targetOpacity = 0;

    if (zOffset >= 0 && zOffset < 180) {
      targetOpacity = 0.85 * (1 - (zOffset / 180));
    } else if (zOffset < 0 && zOffset > -15) {
      // Sharp fade as the object passes behind the camera lens (FOV exit)
      targetOpacity = 0.85 * (1 - Math.abs(zOffset) / 15);
    }

    bp.mat.opacity += (targetOpacity - bp.mat.opacity) * 0.1;

    // X-axis entry: fly from screen extremity to resting position.
    // Scaled to 1/0.7 so animation completes at 70% of travel — object lands 30% before camera arrives.
    if (bp.startX !== undefined) {
      const raw = Math.min(1, Math.max(0, currentCameraZ / bp.z));
      const early = Math.min(1, raw / 0.7);
      const eased = 1 - Math.pow(1 - early, 3); // ease-out cubic
      bp.mesh.position.x = bp.startX + (bp.endX - bp.startX) * eased;
    }
  });
}
