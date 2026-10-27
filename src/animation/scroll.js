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
    syncTouch: false,    // Lenis 1.x name (was smoothTouch); keep native touch scroll so it doesn't fight iOS rubber-band
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential ease-out — premium feel
  });
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

// Inverse of attachNativeScroll: smooth-scroll so targetCameraZ lands on the given Z.
export function scrollToCameraZ(lenis, cameraZ) {
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  const progress = (14 - cameraZ) / 235;
  lenis.scrollTo(progress * maxScroll, { duration: 1.6 });
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
