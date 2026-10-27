import './style.css';
import * as THREE from 'three';

import { isMobile, isMobileDevice } from './utils/device.js';
import { initScrollGuards, createLenis, attachNativeScroll, scrollToCameraZ } from './animation/scroll.js';
import { sizes, attachResize } from './core/Sizes.js';
import { createRenderer, createCSS3DRenderer } from './core/Renderer.js';
import { createCamera, attachPointerSnapBack } from './core/Camera.js';
import { createComposer } from './core/composer.js';
import { isWebGLSupported, showWebGLFallback, watchContextLoss } from './core/webglSupport.js';
import { createLoadingManager, playSignatureAnimation, dismissLoader } from './core/loader.js';

import { createHolographicMaterial } from './world/holographicMaterial.js';
import { createDust } from './world/dust.js';
import { loadSphere, createDuplicateSphere, sphereRefs } from './world/sphere.js';
import { createContentCards } from './world/contentCards.js';
import { createBlueprints } from './world/blueprints/index.js';

import { wrapSplitTargets } from './animation/textSplit.js';
import { stepCameraTransport } from './animation/cameraTransport.js';
import { stepPortalEffect } from './animation/portalEffect.js';
import { stepBlueprintFade } from './animation/blueprintFade.js';
import { stepCardReveal } from './animation/cardReveal.js';

import { initContactModal } from './ui/contactModal.js';
import { initMobileMenu } from './ui/mobileMenu.js';
import { initConsent } from './ui/consent.js';

import { CheckpointManager } from './gallery/CheckpointManager.js';
import { GalleryLabels } from './gallery/GalleryLabels.js';
import { ContentOverlay } from './gallery/ContentOverlay.js';
import { GalleryNavigation } from './gallery/GalleryNavigation.js';

/**
 * POLYFLOWS — Main Entry Point
 * Orchestrates scene/camera/composer construction, loads the holographic icosphere,
 * builds the eight spatial blueprints, and runs the per-frame tick loop.
 */

// First: consent must not depend on WebGL or asset loading succeeding
initConsent();

// Halt module evaluation on devices without WebGL: everything below needs a GL context.
// The throw is deliberate — ES modules have no top-level return.
if (!isWebGLSupported()) {
  showWebGLFallback();
  throw new Error('WebGL unavailable: static fallback shown');
}

initScrollGuards();
const lenis = createLenis();

const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();

const renderer = createRenderer(canvas);
let contextLost = false;
watchContextLoss(canvas, (lost) => { contextLost = lost; });
const css3dRenderer = createCSS3DRenderer();
const { camera, controls } = createCamera(canvas);
scene.add(camera);

const { composer, bloomPass } = createComposer({ renderer, scene, camera, isMobileDevice });

attachResize({ camera, renderer, css3dRenderer, composer });

const state = { targetCameraZ: 14, currentCameraZ: 14 };
attachNativeScroll(state);

// Mobile nav overlay. Toggle is only visible below the CSS breakpoint.
initMobileMenu(lenis);

const material = createHolographicMaterial();

// Built at boot, independent of model loading, so it is in place the moment the loader lifts
const dust = createDust(scene, renderer);

const { manager: loadingManager, modelLoadedPromise } = createLoadingManager();
playSignatureAnimation();

loadSphere(scene, material, loadingManager, renderer, camera);

// Gallery refs are populated after the model finishes loading; tick() and the pointer
// snap-back read them via closures, so null-checks suffice during the pre-load window.
let checkpointManager = null;
let contentOverlay = null;
let galleryLabels = null;
let galleryNavigation = null;
let cssObjects = [];
let blueprints = [];
let dynamicUpdaters = [];

attachPointerSnapBack({
  camera,
  lenis,
  getGalleryNav: () => galleryNavigation,
  getOverlay: () => contentOverlay,
});

modelLoadedPromise.then(() => {
  wrapSplitTargets();
  document.body.style.height = '1000vh'; // Expand body so user can scroll indefinitely

  createDuplicateSphere(scene);

  checkpointManager = new CheckpointManager(
    () => state.currentCameraZ,
    (cameraZ) => scrollToCameraZ(lenis, cameraZ)
  );
  contentOverlay = new ContentOverlay(lenis, checkpointManager, camera);

  const { openContactModal } = initContactModal(lenis);
  cssObjects = createContentCards(scene, openContactModal);
  // Invalidate the CSS3D visibility cache: it was computed with zero cards at boot and
  // would otherwise stay false until the camera moves, hiding the hero text on load
  _cssVisCheckZ = Number.NEGATIVE_INFINITY;

  ({ blueprints, dynamicUpdaters } = createBlueprints(scene, isMobile));

  const blueprintMeshes = blueprints.map(bp => bp.mesh);
  galleryLabels = new GalleryLabels(camera, blueprintMeshes, checkpointManager, contentOverlay);
  galleryNavigation = new GalleryNavigation(checkpointManager, camera, isMobile);
});

modelLoadedPromise.then(dismissLoader);

const clock = new THREE.Clock();

let _cssVisible = false;
let _cssVisCheckZ = Number.NEGATIVE_INFINITY;

const tick = () => {
  // Skip all GL work while the context is lost; resume on webglcontextrestored
  if (contextLost) {
    window.requestAnimationFrame(tick);
    return;
  }

  // getDelta() must come first — getElapsedTime() calls it internally and would reset the timer
  const delta = Math.min(clock.getDelta(), 0.05); // clamp prevents huge jump on tab re-focus
  const elapsedTime = clock.elapsedTime;
  material.uniforms.uTime.value = elapsedTime;

  if (sphereRefs.mainSphere) {
    sphereRefs.mainSphere.rotation.y += 0.0015;
    sphereRefs.mainSphere.rotation.x += 0.0005;
  }
  if (sphereRefs.duplicateSphere && sphereRefs.mainSphere) {
    sphereRefs.duplicateSphere.rotation.copy(sphereRefs.mainSphere.rotation);
  }

  for (const update of dynamicUpdaters) update(elapsedTime, state.currentCameraZ);

  stepCameraTransport({ delta, state, lenis, blueprints, cssObjects, galleryNavigation });

  camera.position.z = state.currentCameraZ;
  dust.update(elapsedTime, delta, state.currentCameraZ);
  // Force the camera to always look forward down the tunnel
  const orbitAngle = galleryNavigation ? galleryNavigation.orbitAngle : 0;
  const targetX = Math.sin(orbitAngle) * 20;
  const targetZOffset = -Math.cos(orbitAngle) * 20;
  if (controls) controls.target.set(targetX, 0, state.currentCameraZ + targetZOffset);

  stepPortalEffect({ currentCameraZ: state.currentCameraZ, camera, bloomPass });
  stepBlueprintFade({ currentCameraZ: state.currentCameraZ, blueprints });
  stepCardReveal({ currentCameraZ: state.currentCameraZ, cssObjects });

  if (checkpointManager) {
    checkpointManager.update(state.currentCameraZ);
    if (checkpointManager.isGalleryActive) {
      if (galleryLabels) galleryLabels.update(state.currentCameraZ);
    }
    // Always tick the nav: its update() removes the is-visible class when
    // isNearCheckpoint goes false (scrolled back past the gallery zone).
    if (galleryNavigation) galleryNavigation.update();
  }

  if (controls) controls.update();
  composer.render();

  // Only composite the CSS3D layer when at least one card is within view range.
  // Recompute the visibility set only when the camera Z has actually moved.
  if (Math.abs(state.currentCameraZ - _cssVisCheckZ) > 2) {
    _cssVisCheckZ = state.currentCameraZ;
    _cssVisible = false;
    for (let i = 0; i < cssObjects.length; i++) {
      const dist = state.currentCameraZ - cssObjects[i].z;
      if (dist > -15 && dist < 200) { _cssVisible = true; break; }
    }
  }
  if (_cssVisible) css3dRenderer.render(scene, camera);

  window.requestAnimationFrame(tick);
};

tick();
