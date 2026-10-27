import gsap from 'gsap';
import { sizes } from '../core/Sizes.js';

// Frame-rate-independent exponential decay toward state.targetCameraZ, plus the seamless
// teleport at z ≤ -220 that wraps the corridor back to z=0.
export function stepCameraTransport({ delta, state, lenis, blueprints, cssObjects, galleryNavigation }) {
  state.currentCameraZ += (state.targetCameraZ - state.currentCameraZ) * (1 - Math.pow(0.92, delta * 60));

  if (state.currentCameraZ > -220) return;

  const offset = state.currentCameraZ - (-220);
  state.currentCameraZ = 0 + offset;
  state.targetCameraZ = 0 + offset;

  const newProgress = (14 - state.targetCameraZ) / 235;
  const maxScroll = document.body.scrollHeight - sizes.height; // sizes.height: stable through iOS toolbar collapse
  const newScrollY = newProgress * maxScroll;
  lenis.scrollTo(newScrollY, { immediate: true });

  // Reset blueprint opacities
  blueprints.forEach(bp => { bp.mat.opacity = 0; });

  // Reset cards for next loop
  cssObjects.forEach(card => {
    card.revealed = false;
    gsap.killTweensOf(card.inners);
    gsap.set(card.inners, { y: '110%' });
  });

  // Reset orbit angle if navigating
  if (galleryNavigation) galleryNavigation.resetOrbit();
}
