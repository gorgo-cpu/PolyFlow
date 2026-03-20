import { gsap } from 'gsap';

/**
 * ScrollController
 * ────────────────
 * The director of the entire POLYFLOWS experience.
 *
 * Maps scroll progress → animation states using GSAP ScrollTrigger
 * or custom interpolation logic.
 *
 * Scroll Phases:
 *   0.00 – 0.25  →  Sphere approach (camera dolly in)
 *   0.25 – 0.50  →  Sphere exploration (orbit, tile highlights)
 *   0.50 – 0.75  →  Portal activation (tile morph, vortex open)
 *   0.75 – 1.00  →  Portal traversal (camera fly-through)
 *
 * Reference:
 *   See resources_from_ThreeJS_Journey/19-scroll-based-animation-final/src/script.js
 */

export class ScrollController {
  constructor(experience) {
    this.experience = experience;

    /** @type {number} 0 → 1 normalized scroll progress */
    this.progress = 0;

    /** @type {string} current animation phase */
    this.phase = 'approach';

    this.setupScroll();
  }

  setupScroll() {
    // Calculate scroll progress from the scroll container
    window.addEventListener('scroll', () => {
      const scrollHeight = document.body.scrollHeight - window.innerHeight;
      this.progress = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
      this.updatePhase();
    });

    // TODO: Replace with GSAP ScrollTrigger for smoother control
    // gsap.registerPlugin(ScrollTrigger);
    // ScrollTrigger.create({ ... });
  }

  updatePhase() {
    if (this.progress < 0.25) {
      this.phase = 'approach';
    } else if (this.progress < 0.50) {
      this.phase = 'exploration';
    } else if (this.progress < 0.75) {
      this.phase = 'activation';
    } else {
      this.phase = 'traversal';
    }
  }

  update() {
    // TODO: Drive camera, sphere, and portal animations
    // based on this.progress and this.phase
  }
}
