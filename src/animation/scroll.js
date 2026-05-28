import Lenis from 'lenis';
import gsap from 'gsap';

// Prevent browser from restoring scroll position on reload.
// MUST run before any module mutates the scroll state.
export function initScrollGuards() {
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);
}

export function createLenis() {
  const lenis = new Lenis({
    smoothTouch: false,  // Prevent Lenis fighting iOS native rubber-band
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential ease-out — premium feel
  });
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

// Maps native scroll progress (0 -> 1) onto targetCameraZ (14 -> -221).
// Slightly past −220 lets the asymptotic LERP definitively cross the teleport barrier.
export function attachNativeScroll(state) {
  window.addEventListener('scroll', () => {
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    if (maxScroll > 0) {
      const progress = window.scrollY / maxScroll;
      state.targetCameraZ = 14 - (progress * 235);
    }
  });
}
