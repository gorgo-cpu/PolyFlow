import GUI from 'lil-gui';

/**
 * Debug
 * ─────
 * Conditionally creates a lil-gui debug panel.
 * Active only when ?debug is present in the URL.
 *
 * Usage:
 *   if (this.debug.active) {
 *     this.debug.gui.add(params, 'speed', 0, 10);
 *   }
 */

export class Debug {
  constructor() {
    this.active = window.location.hash === '#debug';

    if (this.active) {
      this.gui = new GUI({ title: 'POLYFLOWS Debug' });
    }
  }

  destroy() {
    if (this.active && this.gui) {
      this.gui.destroy();
    }
  }
}
