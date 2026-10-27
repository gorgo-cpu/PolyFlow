const MOBILE_BREAKPOINT = 768;

// Layout breakpoint: lateral object placement, controls and gallery nav follow viewport width.
export function getIsMobile() {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

// Kept for one-time consumers (composer/blueprint construction) that read at boot.
// For anything that must react to rotation or address-bar collapse, call getIsMobile().
export const isMobile = getIsMobile();

// Live query: the OS setting can change mid-session, and MediaQueryList.matches stays current
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
export function prefersReducedMotion() {
  return reducedMotionQuery.matches;
}

// Performance tier is fixed per device: a width check flips phones to the desktop GPU path in landscape.
// (pointer: coarse) catches iPadOS, which reports a desktop Safari UA.
export const isMobileDevice =
  window.matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
