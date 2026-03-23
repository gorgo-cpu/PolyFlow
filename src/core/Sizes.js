import EventEmitter from '../utils/Helpers.js';

/**
 * Sizes
 * ─────
 * Tracks viewport dimensions and pixel ratio.
 * Emits 'resize' events so subsystems can react.
 *
 * Usage:
 *   sizes.on('resize', () => { ... });
 *   sizes.width   // current viewport width
 *   sizes.height  // current viewport height
 */

export class Sizes extends EventEmitter {
  constructor() {
    super();

    // Initial values
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.pixelRatio = Math.min(window.devicePixelRatio, 2);

    // Listen for resize
    window.addEventListener('resize', () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.pixelRatio = Math.min(window.devicePixelRatio, 2);

      this.trigger('resize');
    });
  }
}
