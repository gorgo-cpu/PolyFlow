import gsap from 'gsap';
import { isMobileDevice } from '../utils/device.js';

// Touch devices: hide a card's DOM layer once the camera is this close. Near the camera a CSS3D
// card is magnified enormously, and iOS Safari re-rasterizes that text every frame (worst during
// the portal FOV warp), which stutters and flickers. CSS3DRenderer maps visible=false to display:none.
const CARD_NEAR_CULL = 5;

// Reveal CSS3D card text lines (.line-inner) when camera enters the proximity window,
// and reset them once the camera has moved well past or before the card.
export function stepCardReveal({ currentCameraZ, cssObjects }) {
  cssObjects.forEach(card => {
    const dist = currentCameraZ - card.z;

    if (isMobileDevice) {
      const visible = dist > CARD_NEAR_CULL;
      if (card.obj.visible !== visible) card.obj.visible = visible;
    }

    if (dist > 0 && dist < 30) {
      if (card.inners.length > 0 && !card.revealed) {
        card.revealed = true;
        gsap.to(card.inners, { y: '0%', ease: 'power4.out', duration: 1.2, stagger: 0.1 });
      }
    } else if (dist > 50 || dist < -10) {
      if (card.revealed && card.inners.length > 0) {
        card.revealed = false;
        gsap.killTweensOf(card.inners); // Prevent 1.2s reveal tween from overriding the reset
        gsap.set(card.inners, { y: '110%' });
      }
    }
  });
}
