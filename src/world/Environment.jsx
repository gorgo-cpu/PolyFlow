import * as THREE from 'three';

/**
 * Environment
 * ───────────
 * Controls scene lighting and background.
 *
 * Responsibilities:
 *   - Set up ambient and directional lights
 *   - Configure scene background / fog
 *   - Provide methods to transition lighting states
 *     (e.g., dim during portal traversal)
 */

export class Environment {
  constructor(experience) {
    this.experience = experience;
    this.scene = experience.scene;

    this.setLights();
    this.setBackground();
  }

  setLights() {
    // Ambient — soft base illumination
    this.ambientLight = new THREE.AmbientLight('#ffffff', 0.3);
    this.scene.instance.add(this.ambientLight);

    // Directional — key light
    this.directionalLight = new THREE.DirectionalLight('#ffffff', 1.0);
    this.directionalLight.position.set(2, 4, 3);
    this.scene.instance.add(this.directionalLight);

    // Point — accent glow (positioned near sphere)
    this.accentLight = new THREE.PointLight('#6C63FF', 1.5, 10);
    this.accentLight.position.set(0, 0, 3);
    this.scene.instance.add(this.accentLight);
  }

  setBackground() {
    // Dark background with subtle fog for depth
    this.scene.instance.background = new THREE.Color('#000000');
    this.scene.instance.fog = new THREE.Fog('#000000', 5, 15);
  }

  /**
   * Transition lighting for portal traversal.
   * Can be driven by ScrollController or PortalSystem.
   * @param {number} progress — 0 to 1
   */
  transitionToPortal(progress) {
    // 1. Lerp light intensities (Dim ambient/directional, spike accent)
    this.ambientLight.intensity = THREE.MathUtils.lerp(0.3, 0.0, progress);
    this.directionalLight.intensity = THREE.MathUtils.lerp(1.0, 0.0, progress);
    this.accentLight.intensity = THREE.MathUtils.lerp(1.5, 10.0, progress);

    // 2. Lerp colors (Shift accent light from Base to Pure White energy)
    if (!this._baseAccentColor) this._baseAccentColor = new THREE.Color('#6C63FF');
    if (!this._targetAccentColor) this._targetAccentColor = new THREE.Color('#ffffff');
    this.accentLight.color.lerpColors(this._baseAccentColor, this._targetAccentColor, progress);

    // 3. Adjust fog density (Bring fog closer to completely shroud the scene)
    if (this.scene.instance.fog) {
      this.scene.instance.fog.near = THREE.MathUtils.lerp(5, 0.1, progress);
      this.scene.instance.fog.far = THREE.MathUtils.lerp(15, 4, progress);
    }
  }
}
