import * as THREE from 'three';

/**
 * PolygonSphere
 * ─────────────
 * The centrepiece geometry of the POLYFLOWS experience.
 *
 * Responsibilities:
 *   - Generate a low-poly icosphere / subdivided sphere
 *   - Extract individual triangle faces as separate geometries (tiles)
 *   - Expose per-tile references so PortalSystem can morph them
 *   - Apply the sphere shader material
 *   - Provide update() hook for per-frame animation
 *
 * Reference:
 *   See resources_from_ThreeJS_Journey/27-shaders-final/ for custom attributes
 *   and resources_from_ThreeJS_Journey/LESSON_INDEX.md for full reference guide.
 */

export class PolygonSphere {
  constructor(experience) {
    this.experience = experience;
    this.scene = experience.scene;

    /** @type {THREE.Mesh} — the assembled sphere mesh */
    this.mesh = null;

    /** @type {THREE.Group} — parent group for tile meshes */
    this.tilesGroup = null;

    /** @type {Array<THREE.Mesh>} — individual tile meshes */
    this.tiles = [];

    this.init();
  }

  init() {
    // TODO: Implement sphere generation
    // 1. Create IcosahedronGeometry with desired detail level
    // 2. Extract triangle faces into individual tile meshes
    // 3. Apply sphere shader material (import from ../shaders/sphere/)
    // 4. Add to scene

    this.tilesGroup = new THREE.Group();
    this.scene.instance.add(this.tilesGroup);
  }

  /**
   * Returns a tile mesh by index.
   * Used by PortalSystem to select tiles for morphing.
   */
  getTile(index) {
    return this.tiles[index] || null;
  }

  /**
   * Called every frame by Experience.update()
   * @param {number} elapsedTime — total time since start
   * @param {number} deltaTime — time since last frame
   */
  update(elapsedTime, deltaTime) {
    // TODO: Animate tiles (idle hover, subtle rotation, glow pulse)
  }

  destroy() {
    this.tiles.forEach((tile) => {
      tile.geometry.dispose();
      tile.material.dispose();
    });
    this.scene.instance.remove(this.tilesGroup);
  }
}
