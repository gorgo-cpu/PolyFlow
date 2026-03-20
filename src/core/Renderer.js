import * as THREE from 'three';

/**
 * Renderer
 * ────────
 * Configures and manages the WebGL renderer.
 *
 * Responsibilities:
 *   - Create WebGLRenderer with optimal settings
 *   - Handle resize events
 *   - Render the scene each frame
 */

export class Renderer {
  constructor(experience) {
    this.experience = experience;
    this.canvas = experience.canvas;
    this.sizes = experience.sizes;
    this.scene = experience.scene;
    this.camera = experience.camera;

    this.setInstance();
  }

  setInstance() {
    this.instance = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });

    this.instance.setSize(this.sizes.width, this.sizes.height);
    this.instance.setPixelRatio(this.sizes.pixelRatio);

    // Tone mapping for cinematic look
    this.instance.toneMapping = THREE.ACESFilmicToneMapping;
    this.instance.toneMappingExposure = 1.0;

    // Color space
    this.instance.outputColorSpace = THREE.SRGBColorSpace;

    // Clear color
    this.instance.setClearColor('#000000', 1);
  }

  resize() {
    this.instance.setSize(this.sizes.width, this.sizes.height);
    this.instance.setPixelRatio(this.sizes.pixelRatio);
  }

  update() {
    this.instance.render(this.scene.instance, this.camera.instance);
  }
}
