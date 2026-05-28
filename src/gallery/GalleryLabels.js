import * as THREE from 'three';
import { CHECKPOINTS } from './checkpointConfig.js';

/**
 * GalleryLabels
 * Floating DOM labels positioned via 3D→2D projection.
 * Each interactive checkpoint gets a label with a clickable button.
 */
export class GalleryLabels {
  constructor(camera, blueprints, checkpointManager, contentOverlay) {
    this.camera = camera;
    this.blueprints = blueprints;
    this.checkpointManager = checkpointManager;
    this.contentOverlay = contentOverlay;

    // Pre-allocate projection vector (no per-frame allocation)
    this._projVec = new THREE.Vector3();

    this.container = document.getElementById('gallery-labels');
    this.labels = [];

    this._createLabels();
  }

  _createLabels() {
    for (let i = 0; i < CHECKPOINTS.length; i++) {
      const cp = CHECKPOINTS[i];
      if (!cp.interactive) {
        this.labels.push(null);
        continue;
      }

      const el = document.createElement('div');
      el.className = 'gallery-label';

      const title = document.createElement('div');
      title.className = 'gallery-label__title';
      title.textContent = cp.label;
      el.appendChild(title);

      const btn = document.createElement('button');
      btn.className = 'gallery-label__btn';
      btn.textContent = '[ EXPLORE ]';
      btn.addEventListener('click', () => this._onButtonClick(i));
      el.appendChild(btn);

      this.container.appendChild(el);
      this.labels.push({ el, btn, index: i });
    }
  }

  _onButtonClick(checkpointIndex) {
    // Only allow click when this checkpoint is active
    if (this.checkpointManager.activeIndex !== checkpointIndex) return;
    if (this.contentOverlay.isOpen) return;

    // Get the object's screen position for depth-zoom origin
    const blueprint = this.blueprints[checkpointIndex];
    if (!blueprint) return;

    const screenPos = this._getScreenPosition(blueprint);
    this.contentOverlay.open(checkpointIndex, screenPos);
  }

  /**
   * Project a 3D object's position to viewport pixel coordinates.
   */
  _getScreenPosition(object) {
    this._projVec.setFromMatrixPosition(object.matrixWorld);
    this._projVec.project(this.camera);

    const halfW = window.innerWidth * 0.5;
    const halfH = window.innerHeight * 0.5;

    return {
      x: (this._projVec.x * halfW) + halfW,
      y: -(this._projVec.y * halfH) + halfH,
    };
  }

  /**
   * Called every frame from tick(). Updates label positions and visibility.
   */
  update(cameraZ) {
    const activeIndex = this.checkpointManager.activeIndex;

    for (let i = 0; i < CHECKPOINTS.length; i++) {
      const label = this.labels[i];
      if (!label) continue;

      const cp = CHECKPOINTS[i];
      const blueprint = this.blueprints[i];
      if (!blueprint) continue;

      // Distance check: only show labels within 80 units ahead of camera
      const dist = cameraZ - cp.z;
      const inRange = dist > -10 && dist < 80;

      if (!inRange) {
        label.el.classList.remove('is-visible', 'is-active');
        continue;
      }

      // Project object position to screen
      const screen = this._getScreenPosition(blueprint);

      // Check if on screen (NDC x/y between -1 and 1, z > 0 means in front of camera)
      const ndc = this._projVec;
      const onScreen = ndc.z > 0 && ndc.z < 1 &&
        Math.abs(ndc.x) < 1.2 && Math.abs(ndc.y) < 1.2;

      if (!onScreen) {
        label.el.classList.remove('is-visible', 'is-active');
        continue;
      }

      // Position the label above the object
      label.el.style.transform = `translate(${screen.x}px, ${screen.y - 30}px) translate(-50%, -100%)`;

      // Visibility and active state
      label.el.classList.add('is-visible');

      if (activeIndex === i) {
        label.el.classList.add('is-active');
      } else {
        label.el.classList.remove('is-active');
      }

      // Distance-based opacity for non-active labels
      if (activeIndex !== i) {
        const proximity = 1 - Math.min(Math.abs(dist) / 60, 1);
        label.el.style.opacity = 0.2 + proximity * 0.3;
      } else {
        label.el.style.opacity = '';
      }
    }
  }

  dispose() {
    for (let i = 0; i < this.labels.length; i++) {
      if (this.labels[i]) {
        this.labels[i].el.remove();
      }
    }
    this.labels.length = 0;
  }
}
