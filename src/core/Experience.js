import * as THREE from 'three';
import { Sizes } from './Sizes.js';
import { Camera } from './Camera.js';
import { Renderer } from './Renderer.js';
import { Scene } from './Scene.js';
import { PolygonSphere } from '../world/PolygonSphere.js';
import { PortalSystem } from '../world/PortalSystem.js';
import { Environment } from '../world/Environment.js';
import { ScrollController } from '../animation/ScrollController.js';
import { Debug } from '../utils/Debug.js';

/**
 * Experience — Singleton orchestrator
 * ────────────────────────────────────
 * Owns every subsystem. Runs the animation loop.
 *
 * Usage:
 *   const experience = new Experience(canvas);
 *
 * Subsystems are accessible via:
 *   experience.sizes
 *   experience.scene
 *   experience.camera
 *   experience.renderer
 *   experience.world.*
 */

let instance = null;

export class Experience {
  constructor(canvas) {
    // Singleton guard
    if (instance) return instance;
    instance = this;

    // ── References ──────────────────────────
    this.canvas = canvas;
    this.clock = new THREE.Clock();

    // ── Core systems ───────────────────────
    this.debug = new Debug();
    this.sizes = new Sizes();
    this.scene = new Scene();
    this.camera = new Camera(this);
    this.renderer = new Renderer(this);

    // ── World objects ──────────────────────
    this.environment = new Environment(this);
    this.polygonSphere = new PolygonSphere(this);
    this.portalSystem = new PortalSystem(this);

    // ── Animation ──────────────────────────
    this.scrollController = new ScrollController(this);

    // ── Events ─────────────────────────────
    this.sizes.on('resize', () => this.resize());

    // ── Start loop ─────────────────────────
    this.tick();
  }

  resize() {
    this.camera.resize();
    this.renderer.resize();
  }

  update() {
    const elapsedTime = this.clock.getElapsedTime();
    const deltaTime = this.clock.getDelta();

    // Update subsystems
    this.camera.update();
    this.polygonSphere.update(elapsedTime, deltaTime);
    this.portalSystem.update(elapsedTime, deltaTime);
    this.scrollController.update();
    this.renderer.update();
  }

  tick() {
    this.update();
    window.requestAnimationFrame(() => this.tick());
  }

  destroy() {
    // Cleanup all subsystems
    this.sizes.off('resize');
    this.renderer.instance.dispose();
    this.debug.destroy();
    instance = null;
  }
}
