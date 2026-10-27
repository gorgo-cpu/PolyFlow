import {
  CHECKPOINTS,
  GALLERY_ACTIVATION_Z,
  PROXIMITY_RANGE,
} from './checkpointConfig.js';

/**
 * CheckpointManager
 * Tracks which checkpoint the camera is near (proximity-based).
 * No forced snapping — free scroll throughout the corridor.
 */
// Land this far before the object so it sits ahead in frame and well inside PROXIMITY_RANGE
const SNAP_Z_OFFSET = 8;

export class CheckpointManager {
  constructor(getCameraZ, scrollToCameraZ) {
    this.getCameraZ = getCameraZ;
    this.scrollToCameraZ = scrollToCameraZ;

    this.activeIndex = -1;
    this.isGalleryActive = false;
    this.isOverlayOpen = false;
    this.isNearCheckpoint = false;

    this._listeners = [];
  }

  /**
   * Register a callback for checkpoint change events.
   */
  onChange(callback) {
    this._listeners.push(callback);
  }

  _notifyChange(newIndex, oldIndex) {
    for (let i = 0; i < this._listeners.length; i++) {
      this._listeners[i](newIndex, oldIndex);
    }
  }

  /**
   * Find the interactive checkpoint the camera is within proximity of.
   * Returns index or -1 if not near any.
   */
  findNearby(cameraZ) {
    for (let i = 0; i < CHECKPOINTS.length; i++) {
      const cp = CHECKPOINTS[i];
      if (!cp.interactive) continue;
      if (Math.abs(cameraZ - cp.z) <= PROXIMITY_RANGE) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Called every frame from tick(). Updates gallery state and active checkpoint.
   */
  update(cameraZ) {
    this.isGalleryActive = cameraZ < GALLERY_ACTIVATION_Z;

    if (!this.isGalleryActive) {
      if (this.activeIndex !== -1) {
        const old = this.activeIndex;
        this.activeIndex = -1;
        this.isNearCheckpoint = false;
        this._notifyChange(-1, old);
      }
      return;
    }

    const nearby = this.findNearby(cameraZ);

    if (nearby !== this.activeIndex) {
      const old = this.activeIndex;
      this.activeIndex = nearby;
      this.isNearCheckpoint = nearby !== -1;
      this._notifyChange(nearby, old);
    } else {
      this.isNearCheckpoint = nearby !== -1;
    }
  }

  /**
   * Get the currently active checkpoint data.
   */
  getActive() {
    if (this.activeIndex < 0) return null;
    return CHECKPOINTS[this.activeIndex];
  }

  /**
   * Scroll the camera to an interactive checkpoint (used by in-overlay cross-links).
   */
  snapTo(index) {
    const cp = CHECKPOINTS[index];
    if (!cp || !cp.interactive) return;
    this.scrollToCameraZ(cp.z + SNAP_Z_OFFSET);
  }

  dispose() {
    this._listeners.length = 0;
  }
}
