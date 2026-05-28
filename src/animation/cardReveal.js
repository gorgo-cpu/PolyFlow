import gsap from 'gsap';

// Reveal CSS3D card text lines (.line-inner) when camera enters the proximity window,
// and reset them once the camera has moved well past or before the card.
export function stepCardReveal({ currentCameraZ, cssObjects }) {
  cssObjects.forEach(card => {
    const dist = currentCameraZ - card.z;
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
