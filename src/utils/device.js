const MOBILE_BREAKPOINT = 768;

export function getIsMobile() {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

// Kept for one-time consumers (composer/blueprint construction) that read at boot.
// For anything that must react to rotation or address-bar collapse, call getIsMobile().
export const isMobile = getIsMobile();
