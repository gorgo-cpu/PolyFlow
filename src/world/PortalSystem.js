import * as THREE from 'three';

/**
 * PortalSystem
 * ────────────
 * Converts sphere tiles into interactive portals.
 *
 * Responsibilities:
 *   - Accept a tile mesh reference from PolygonSphere
 *   - Morph the tile geometry into a portal opening
 *   - Manage portal activation states (idle, hover, active, traversing)
 *   - Spawn and manage the portal shader material
 *   - Coordinate camera fly-through on traversal
 *
 * Reference:
 *   See resources_from_ThreeJS_Journey/33-hologram-shader-final/ for
 *   fresnel, transparency, and additive blending patterns for portal rendering.
 */

/** Portal activation states */
const PortalState = {
  IDLE: 'idle',
  HOVER: 'hover',
  ACTIVE: 'active',
  TRAVERSING: 'traversing',
};

export class PortalSystem {
  constructor(experience) {
    this.experience = experience;
    this.scene = experience.scene;

    /** @type {Map<number, { mesh: THREE.Mesh, state: string }>} */
    this.portals = new Map();
  }

  /**
   * Convert a sphere tile into a portal.
   * @param {number} tileIndex — index of the tile in PolygonSphere.tiles
   */
  createPortal(tileIndex) {
    const tile = this.experience.polygonSphere.getTile(tileIndex);
    if (!tile) return;

    // TODO: Replace tile material with portal shader
    // TODO: Begin morph animation (scale up, circular opening)

    this.portals.set(tileIndex, {
      mesh: tile,
      state: PortalState.IDLE,
    });
  }

  /**
   * Set the state of a portal.
   * @param {number} tileIndex
   * @param {string} newState — one of PortalState values
   */
  setPortalState(tileIndex, newState) {
    const portal = this.portals.get(tileIndex);
    if (portal) {
      portal.state = newState;
    }
  }

  /**
   * Called every frame by Experience.update()
   */
  update(elapsedTime, deltaTime) {
    this.portals.forEach((portal) => {
      // TODO: Update portal shader uniforms (time, activation progress)
      // TODO: Animate based on portal.state
    });
  }

  destroy() {
    this.portals.clear();
  }
}
