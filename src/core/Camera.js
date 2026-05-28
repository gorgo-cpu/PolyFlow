import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';
import { sizes } from './Sizes.js';

export function createCamera(canvas) {
  const camera = new THREE.PerspectiveCamera(
    50, // Widened default FOV so the scene feels expansive and zoomed out
    sizes.width / sizes.height,
    0.1,
    1000 // Extended far plane for the deep corridor
  );
  camera.position.set(0, 0, 14); // Start centered to fly exactly through the portal

  let controls = null;
  if (window.innerWidth > 768) {
    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = false; // Disabled so glide momentum doesn't fight the bounce-back
    controls.enableZoom = false;    // Disable zoom to prevent fighting Lenis
    controls.enablePan = false;     // Keep the user locked in the corridor
  }
  return { camera, controls };
}

// Snap-back only on desktop — on mobile these fire on every scroll touch and fight gesture recognition.
// Gallery getters are lazy because galleryNavigation/contentOverlay are created after model load.
export function attachPointerSnapBack({ camera, lenis, getGalleryNav, getOverlay }) {
  if (window.innerWidth <= 768) return;

  window.addEventListener('pointerdown', () => {
    if (document.getElementById('contact-modal')?.classList.contains('is-open')) return;
    const galleryNavigation = getGalleryNav();
    const contentOverlay = getOverlay();
    if (galleryNavigation && galleryNavigation.isNavigating) return;
    if (contentOverlay && contentOverlay.isOpen) return;
    gsap.killTweensOf(camera.position);
    // If a CTA tween was killed mid-flight, its onComplete (lenis.start) never fires — restart here
    lenis.start();
  });

  window.addEventListener('pointerup', () => {
    const galleryNavigation = getGalleryNav();
    const contentOverlay = getOverlay();
    if (galleryNavigation && galleryNavigation.isNavigating) return;
    if (contentOverlay && contentOverlay.isOpen) return;
    // Snap camera X/Y exactly back to dead center of the corridor
    gsap.to(camera.position, {
      x: 0,
      y: 0,
      duration: 1.2,
      ease: 'back.out(1.2)' // Soft elastic bounce
    });
  });
}
