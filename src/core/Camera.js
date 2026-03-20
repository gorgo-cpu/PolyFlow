import * as THREE from 'three';

/**
 * Camera
 * ──────
 * Manages the perspective camera used for the experience.
 *
 * Responsibilities:
 *   - Create and position the camera
 *   - Handle aspect ratio on resize
 *   - Provide update hook for animation-driven camera movement
 */

export class Camera {
  constructor(experience) {
    this.experience = experience;
    this.sizes = experience.sizes;
    this.scene = experience.scene;

    this.setInstance();
  }

  setInstance() {
    this.instance = new THREE.PerspectiveCamera(
      35,                                    // fov
      this.sizes.width / this.sizes.height,  // aspect
      0.1,                                   // near
      100                                    // far
    );
    this.instance.position.set(0, 0, 6);
    this.scene.instance.add(this.instance);
  }

  resize() {
    this.instance.aspect = this.sizes.width / this.sizes.height;
    this.instance.updateProjectionMatrix();
  }

  update() {
    // Camera animation logic goes here
    // (e.g., GSAP-driven position/lookAt updates
    //  based on scroll progress)
  }
}
