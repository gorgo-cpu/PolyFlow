import * as THREE from 'three';

/**
 * Scene
 * ─────
 * Thin wrapper around THREE.Scene.
 *
 * Exists so every subsystem can import Scene
 * without coupling to the Experience singleton.
 */

export class Scene {
  constructor() {
    this.instance = new THREE.Scene();
  }
}
