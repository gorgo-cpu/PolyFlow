import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from 'gsap';
import Lenis from 'lenis';
import holographicVertexShader from './shaders/sphere/vertex.glsl';
import holographicFragmentShader from './shaders/sphere/fragment.glsl';

// Post-Processing Imports
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

// Prevent browser from restoring scroll position on reload
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// ── Smooth Scrolling (Lenis) ───────────────────
const lenis = new Lenis({
  smoothTouch: false,  // Prevent Lenis fighting iOS native rubber-band
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential ease-out — premium feel
});
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

/**
 * POLYFLOWS — Main Entry Point
 * ────────────────────────────
 * Loads the GLTF icosphere and applies the holographic shader.
 */

// ── Canvas & Scene ─────────────────────────────
const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();

// ── Sizes ──────────────────────────────────────
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Crucial iOS Fix: Dynamically protect the pixel ratio during Safari URL bar shifts
  const nowMobile = window.innerWidth <= 768;
  const targetPixelRatio = nowMobile ? 1 : Math.min(window.devicePixelRatio, 2);

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(targetPixelRatio);

  css3dRenderer.setSize(sizes.width, sizes.height);

  // Update composer on resize
  composer.setSize(sizes.width, sizes.height);
  composer.setPixelRatio(targetPixelRatio);

  // Reactively toggle expensive passes based on current breakpoint (handles orientation change)
  filmPass.enabled = !nowMobile;
  rgbShiftPass.enabled = !nowMobile;
  bloomPass.resolution.set(
    nowMobile ? sizes.width / 2 : sizes.width,
    nowMobile ? sizes.height / 2 : sizes.height
  );
});

// ── Camera ─────────────────────────────────────
const camera = new THREE.PerspectiveCamera(
  50, // Widened default FOV so the scene feels expansive and zoomed out
  sizes.width / sizes.height,
  0.1,
  1000 // Extended far plane for the deep corridor
);
camera.position.set(0, 0, 14); // Start centered to fly exactly through the portal
scene.add(camera);

// ── Controls ───────────────────────────────────
let controls = null;
if (window.innerWidth > 768) {
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false; // Disabled so glide momentum doesn't fight the bounce-back
  controls.enableZoom = false; // Disable zoom to prevent fighting Lenis
  controls.enablePan = false;  // Keep the user locked in the corridor
}

// Snap-back only on desktop — on mobile these fire on every scroll touch and fight gesture recognition
if (window.innerWidth > 768) {
  window.addEventListener('pointerdown', () => {
    if (document.getElementById('contact-modal')?.classList.contains('is-open')) return;
    gsap.killTweensOf(camera.position);
    // If a CTA tween was killed mid-flight, its onComplete (lenis.start) never fires — restart here
    lenis.start();
  });

  window.addEventListener('pointerup', () => {
    // Snap camera X/Y exactly back to dead center of the corridor
    gsap.to(camera.position, {
      x: 0,
      y: 0,
      duration: 1.2,
      ease: "back.out(1.2)" // Soft elastic bounce
    });
  });
}

// ── Renderer ───────────────────────────────────
const rendererParameters = { clearColor: '#0A0A0A' };

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  powerPreference: 'high-performance', // Prefer discrete GPU on dual-GPU laptops
});
renderer.setClearColor(rendererParameters.clearColor);
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ── CSS3D Renderer ─────────────────────────────
const css3dRenderer = new CSS3DRenderer();
css3dRenderer.setSize(sizes.width, sizes.height);
css3dRenderer.domElement.style.position = 'absolute';
css3dRenderer.domElement.style.top = '0';
css3dRenderer.domElement.style.pointerEvents = 'none';
document.getElementById('css3d-container').appendChild(css3dRenderer.domElement);

// ── Post-Processing (Effect Composer) ──────────
const renderTarget = new THREE.WebGLRenderTarget(sizes.width, sizes.height, {
  samples: renderer.getPixelRatio() === 1 ? 2 : 0, // Anti-aliasing if supported
});

const composer = new EffectComposer(renderer, renderTarget);
composer.setSize(sizes.width, sizes.height);
composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 1. Render Scene Pass
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// 2. Bloom Pass (glowing red lines)
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(sizes.width, sizes.height),
  0.5,   // Strength (intensity of the glow - dialed back from 0.8 to a softer 0.5)
  0.1,   // Radius (how spread out the glow is - reduced for tighter glow)
  0.5    // Threshold (only bloom pixels brighter than this)
);
composer.addPass(bloomPass);

// 3. Film Grain Pass (noisy physical texture)
// noise intensity, scanline intensity, scanline count, grayscale
const filmPass = new FilmPass(0.35, 0.0, 0, false);
composer.addPass(filmPass);

// 4. Chromatic Aberration Pass (RGB Shift)
const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms['amount'].value = 0.0008; // Extremely subtle, reduced to prevent edge blur
composer.addPass(rgbShiftPass);

// 5. Output Pass (Color correction and tone mapping)
const outputPass = new OutputPass();
composer.addPass(outputPass);

// ── Mobile Performance Tier (Thermal/Battery Override) ──
const isMobile = window.innerWidth <= 768;
if (isMobile) {
  renderer.setPixelRatio(1);
  composer.setPixelRatio(1);
  bloomPass.resolution = new THREE.Vector2(sizes.width / 2, sizes.height / 2);
  // Kill the two most expensive extra passes — saves 2 full-screen GPU blits per frame
  filmPass.enabled = false;
  rgbShiftPass.enabled = false;
}

// ── Holographic Material ───────────────────────
const materialParameters = { color: '#ffffff' };

const material = new THREE.ShaderMaterial({
  vertexShader: holographicVertexShader,
  fragmentShader: holographicFragmentShader,
  uniforms: {
    uTime: new THREE.Uniform(0),
    uColor: new THREE.Uniform(new THREE.Color(materialParameters.color)),
  }
});

// ── Application Load State & SVG Animation ──────
const loaderSignature = document.querySelector('.loader-signature');
const signaturePath = document.querySelector('.signature-path');
const progressBar = document.querySelector('.loader-progress-bar');
const progressContainer = document.querySelector('.loader-progress-container');

let pathLength = 0;
if (signaturePath) {
  pathLength = signaturePath.getTotalLength();
  gsap.set(signaturePath, { strokeDasharray: pathLength, strokeDashoffset: pathLength });
  gsap.set(loaderSignature, { opacity: 1 });
  gsap.set(progressContainer, { opacity: 1 });

  // Draw the signature over 2 seconds
  gsap.to(signaturePath, {
    strokeDashoffset: 0,
    duration: 2.5,
    ease: "power2.inOut"
  });
}

let resolveModelLoad;
const modelLoadedPromise = new Promise(resolve => resolveModelLoad = resolve);
let mainSphere = null;
let duplicateSphere = null;

// ── THREE.LoadingManager ───────────────────────
const loadingManager = new THREE.LoadingManager();

loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
  const progressRatio = itemsLoaded / itemsTotal;
  gsap.to(progressBar, {
    scaleX: progressRatio,
    duration: 0.3,
    ease: "power1.out"
  });
};

loadingManager.onLoad = () => {
  resolveModelLoad();
};

loadingManager.onError = (url) => {
  console.error('Asset failed to load:', url);
  resolveModelLoad();
};

// Dismiss loader after 10s even if model fails to load
setTimeout(() => resolveModelLoad(), 10000);

// ── Load GLTF Icosphere ────────────────────────
const gltfLoader = new GLTFLoader(loadingManager);

gltfLoader.load(
  '/models/POLY_SPHERE.glb',
  // Success
  (gltf) => {
    const sphere = gltf.scene;
    mainSphere = sphere; // Store globally for the tick loop

    // Apply holographic shader to every mesh in the GLTF
    sphere.traverse((child) => {
      if (child.isMesh) {
        child.material = material;
      }
    });

    // ── Architectural Wireframe Overlay ──────────
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,
      depthTest: true,
      depthWrite: false,
    });

    sphere.traverse((child) => {
      if (child.isMesh) {
        const edges = new THREE.EdgesGeometry(child.geometry, 15);
        const wireframe = new THREE.LineSegments(edges, wireframeMaterial);
        wireframe.scale.setScalar(1.001);
        child.add(wireframe);
      }
    });

    // ── Pivot Group ──
    const spherePivot = new THREE.Group();
    spherePivot.add(sphere);
    scene.add(spherePivot);

    renderer.compile(scene, camera);
  },
  // Progress
  undefined,
  // Error
  (error) => {
    console.error('❌ Failed to load POLY_SPHERE.glb:', error);
  }
);

// ── Animate & LERP State ───────────────────────
const clock = new THREE.Clock();

// ── Constants ───────────────────────────────────
const BLUEPRINT_COLOR = 0xFFF5E4; // Warm cream/ivory — shared across all blueprint objects

// Global Spatial Arrays
const cssObjects = [];
const blueprints = [];
let targetCameraZ = 14;
let currentCameraZ = 14;

// Tesseract Dynamic Globals
let tessMesh = null;
let tessPositions = [];
const tessTarget = new THREE.Vector3();
const tessColor = new THREE.Color();
const tessDummy = new THREE.Object3D();
const tessCount = isMobile ? 150 : 500; // Reduced from 2000 — fewer particles reveals the 4D shape structure

// Breathing Tesseract Globals
let breathMesh = null;
let breathPositions = [];
const breathTarget = new THREE.Vector3();
const breathColor = new THREE.Color();
const breathDummy = new THREE.Object3D();
const breathCount = isMobile ? 150 : 450; // Reduced from 1500 — fewer particles reveals the breathing shape

// Fire Swarm Globals
let fireMesh = null;
let firePositions = [];
const fireTarget = new THREE.Vector3();
const fireColor = new THREE.Color();
const fireDummy = new THREE.Object3D();
const fireCount = isMobile ? 200 : 2000; // Reduced from 10000

// Update target Z directly from native scroll
window.addEventListener('scroll', () => {
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  if (maxScroll > 0) {
    const progress = window.scrollY / maxScroll;
    // Map progress (0 -> 1) to slightly past the teleport barrier (14 -> -221)
    // This allows the asymptotic LERP to definitively cross -220
    targetCameraZ = 14 - (progress * 235);
  }
});

// ── Spatial Realm Sequence Setup ─────
modelLoadedPromise.then(() => {
  // Prep DOM text lines for GSAP animation
  document.querySelectorAll('.split-target').forEach((el) => {
    if (!el.querySelector('.line-wrapper')) {
      const wrapper = document.createElement('span');
      wrapper.className = 'line-wrapper';
      const inner = document.createElement('span');
      inner.className = 'line-inner';
      while (el.firstChild) inner.appendChild(el.firstChild);
      wrapper.appendChild(inner);
      el.appendChild(wrapper);
    }
  });

  // Expand body so user can scroll indefinitely
  document.body.style.height = '1000vh';

  // ── 1. The Duplicate Sphere (Loop) ──
  if (mainSphere) {
    duplicateSphere = mainSphere.clone();
    duplicateSphere.position.z = -220; // Brought significantly closer to shorten the corridor path
    scene.add(duplicateSphere);
  }

  // ── 2. Content Cards (CSS3D) ──
  const architectureSection = document.querySelector('.state-architecture');
  const bridgeSection = document.querySelector('.state-bridge');
  const summonsSection = document.querySelector('.state-summons');

  const cardElements = [
    { el: document.querySelector('.state-void'), z: -10 },
    { el: architectureSection, z: -60 },
    { el: bridgeSection, z: -120 },
    { el: summonsSection, z: -180 }
  ];

  cardElements.forEach(data => {
    if (data.el) {
      const cssObj = new CSS3DObject(data.el);
      cssObj.scale.set(0.015, 0.015, 0.015);
      cssObj.position.set(0, 0, data.z);
      scene.add(cssObj);
      cssObjects.push({ obj: cssObj, dom: data.el, z: data.z, inners: Array.from(data.el.querySelectorAll('.line-inner')) });

      const button = data.el.querySelector('.cta-button');
      if (button) {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
          if (isMobile) {
            window.location.href = 'mailto:clients.polyflow@gmail.com?subject=%5B%20BLUEPRINT%20REQUEST%20%5D&body=NAME%3A%20%0ACOMPANY%3A%20%0ABUDGET%3A%20%0A%0AMESSAGE%3A%20';
          } else {
            openContactModal();
          }
        });
      }
    }
  });

  // ── Contact Modal ─────────────────────────────
  const modal         = document.getElementById('contact-modal');
  const modalBackdrop = modal.querySelector('.contact-modal__backdrop');
  const modalPanel    = modal.querySelector('.contact-modal__panel');
  const modalClose    = modal.querySelector('.contact-modal__close');

  function openContactModal() {
    lenis.stop();
    modal.classList.add('is-open');
    gsap.set(modalBackdrop, { opacity: 0 });
    gsap.set(modalPanel,    { scale: 0.94, opacity: 0 });
    gsap.timeline()
      .to(modalBackdrop, { opacity: 1, duration: 0.35, ease: 'power2.out' }, 0)
      .to(modalPanel,    { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.5)' }, 0.05);
    requestAnimationFrame(() => modalClose.focus());
  }

  function closeContactModal() {
    gsap.timeline({ onComplete: () => { modal.classList.remove('is-open'); } })
      .to(modalPanel,    { scale: 0.94, opacity: 0, duration: 0.3, ease: 'power2.in' }, 0)
      .to(modalBackdrop, { opacity: 0,              duration: 0.3, ease: 'power2.in' }, 0);
    lenis.start();
  }

  modalClose.addEventListener('click', closeContactModal);
  modalBackdrop.addEventListener('click', closeContactModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeContactModal();
  });

  // ── 3. Wireframe Blueprints ──
  const bpGeo = new THREE.PlaneGeometry(30, 20, 15, 10);
  for (let i = 0; i < 8; i++) {
    const zPos = -20 - (i * 26); // Compressed depth tracking for 8 objects to fit ~220 units
    const xPos = (i % 2 === 0) ? -13 : 13; // Safe lateral boundary avoiding card text

    if (i === 0) {
      // User's custom Fibonacci Sphere for the first element
      const count = 150; // Thinned out from 400 for aesthetics
      const r = 5; // Uniformly downscaled to matched boundaries
      const dummy = new THREE.Object3D();
      const target = new THREE.Vector3();
      const color = new THREE.Color();

      const dotGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      const bpMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, wireframe: true });
      const bpMesh = new THREE.InstancedMesh(dotGeo, bpMat, count);

      for (let j = 0; j < count; j++) {
        const phi = Math.acos(-1 + (2 * j) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;
        target.set(r * Math.cos(theta) * Math.sin(phi), r * Math.sin(theta) * Math.sin(phi), r * Math.cos(phi));

        dummy.position.copy(target);
        dummy.lookAt(0, 0, 0);
        dummy.updateMatrix();

        bpMesh.setMatrixAt(j, dummy.matrix);
        color.setHex(BLUEPRINT_COLOR); // Warm cream/ivory
        bpMesh.setColorAt(j, color);
      }

      bpMesh.instanceMatrix.needsUpdate = true;
      if (bpMesh.instanceColor) bpMesh.instanceColor.needsUpdate = true;

      // Start off-screen left — flies in to xPos as camera enters corridor
      const fibStartX = -22;
      bpMesh.position.set(fibStartX, 0, zPos);

      // Smooth, continuous single-axis spin restored
      gsap.to(bpMesh.rotation, { y: Math.PI * 2, duration: 40, ease: "none", repeat: -1 });

      scene.add(bpMesh);
      blueprints.push({ mesh: bpMesh, mat: bpMat, z: zPos, startX: fibStartX, endX: isMobile ? -4 : xPos });

    } else if (i === 1) {
      // User's custom 3D Cubic Grid Swarm for the second element
      const count = 125; // 5x5x5 perfect cube, thinned out from 512
      const dummy = new THREE.Object3D();
      const target = new THREE.Vector3();
      const color = new THREE.Color();

      const dotGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      const bpMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, wireframe: true });
      const bpMesh = new THREE.InstancedMesh(dotGeo, bpMat, count);

      const s = Math.ceil(Math.pow(count, 1 / 3));
      const sep = 2.0; // Expanded separation to maintain the target bounding width with fewer dots
      const off = (s * sep) / 2;

      for (let j = 0; j < count; j++) {
        let z = Math.floor(j / (s * s));
        let y = Math.floor((j % (s * s)) / s);
        let x = j % s;

        target.set(x * sep - off, y * sep - off, z * sep - off);

        dummy.position.copy(target);
        dummy.lookAt(0, 0, 0);
        dummy.updateMatrix();

        bpMesh.setMatrixAt(j, dummy.matrix);
        color.setHex(BLUEPRINT_COLOR); // Warm cream/ivory
        bpMesh.setColorAt(j, color);
      }

      bpMesh.instanceMatrix.needsUpdate = true;
      if (bpMesh.instanceColor) bpMesh.instanceColor.needsUpdate = true;

      // Start off-screen right — flies in to xPos as camera enters corridor
      const cubeStartX = 32;
      bpMesh.position.set(cubeStartX, 0, zPos);

      // Slow structural spin to match the sequence
      gsap.to(bpMesh.rotation, { y: Math.PI * 2, duration: 40, ease: "none", repeat: -1 });

      scene.add(bpMesh);
      blueprints.push({ mesh: bpMesh, mat: bpMat, z: zPos, startX: cubeStartX, endX: isMobile ? 4 : xPos });

    } else if (i === 2) {
      // User's custom Torus Knot for the third element
      const count = 200; // Thinned from 600 per user request
      const dummy = new THREE.Object3D();
      const target = new THREE.Vector3();
      const color = new THREE.Color();

      const dotGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      const bpMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, wireframe: true });
      const bpMesh = new THREE.InstancedMesh(dotGeo, bpMat, count);

      for (let j = 0; j < count; j++) {
        // Uniform radius ~5
        const R_scaled = 3.5;
        const r_scaled = 1.5;
        const u = (j / count) * Math.PI * 2 * 40;
        const v = (j / count) * Math.PI * 2;
        target.set((R_scaled + r_scaled * Math.cos(u)) * Math.cos(v), (R_scaled + r_scaled * Math.cos(u)) * Math.sin(v), r_scaled * Math.sin(u));

        dummy.position.copy(target);
        dummy.lookAt(0, 0, 0);
        dummy.updateMatrix();

        bpMesh.setMatrixAt(j, dummy.matrix);
        color.setHex(BLUEPRINT_COLOR); // Warm cream/ivory
        bpMesh.setColorAt(j, color);
      }

      bpMesh.instanceMatrix.needsUpdate = true;
      if (bpMesh.instanceColor) bpMesh.instanceColor.needsUpdate = true;

      bpMesh.position.set(xPos, 0, zPos);

      // Slow structural spin to match the sequence
      gsap.to(bpMesh.rotation, { y: Math.PI * 2, duration: 40, ease: "none", repeat: -1 });

      scene.add(bpMesh);
      blueprints.push({ mesh: bpMesh, mat: bpMat, z: zPos });

    } else if (i === 3) {
      // User's custom DYNAMIC Hyper-Tesseract for the fourth element
      const dotGeo = new THREE.TetrahedronGeometry(0.25);
      const bpMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, wireframe: true });
      tessMesh = new THREE.InstancedMesh(dotGeo, bpMat, tessCount);
      tessMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      for (let j = 0; j < tessCount; j++) {
        tessPositions.push(new THREE.Vector3((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100));
        tessMesh.setColorAt(j, tessColor.setHex(BLUEPRINT_COLOR));
      }

      // Re-mapped lateral spacing to drag the object 60% inward, forcing a camera collision overlap
      tessMesh.position.set(xPos * 0.4, 0, zPos);

      // We replicate global sequence rotation natively using GSAP 
      gsap.to(tessMesh.rotation, {
        x: Math.PI * 4,
        y: Math.PI * 8,
        duration: 90, // Slowed down from 45 per user request
        ease: "none",
        repeat: -1
      });

      scene.add(tessMesh);
      blueprints.push({ mesh: tessMesh, mat: bpMat, z: zPos });

    } else if (i === 4) {
      // User explicitly requested a slightly spinning cone geometry
      const coneGeo = new THREE.ConeGeometry(4, 9, 16); // Compressed bounds
      const bpMat = new THREE.MeshBasicMaterial({ color: BLUEPRINT_COLOR, transparent: true, opacity: 0, wireframe: true });
      const coneMesh = new THREE.Mesh(coneGeo, bpMat);
      coneMesh.position.set(isMobile ? xPos * 0.45 : xPos, 0, zPos);

      gsap.to(coneMesh.rotation, {
        y: Math.PI * 2,
        x: Math.PI * 0.1,
        duration: 35, // SLIGHT rotation
        ease: "none",
        repeat: -1
      });

      scene.add(coneMesh);
      blueprints.push({ mesh: coneMesh, mat: bpMat, z: zPos });

    } else if (i === 5) {
      // User's DYNAMIC Breathing Tesseract for the sixth element
      const dotGeo = new THREE.TetrahedronGeometry(0.25);
      const bpMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, wireframe: true });
      breathMesh = new THREE.InstancedMesh(dotGeo, bpMat, breathCount);
      breathMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      for (let j = 0; j < breathCount; j++) {
        breathPositions.push(new THREE.Vector3((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100));
        breathMesh.setColorAt(j, breathColor.setHex(BLUEPRINT_COLOR));
      }

      // Overriding generic blueprint bounds to pull the 6th element immediately alongside the camera
      breathMesh.position.set(isMobile ? xPos * 0.2 : xPos * 0.4, 0, zPos);
      scene.add(breathMesh);
      blueprints.push({ mesh: breathMesh, mat: bpMat, z: zPos });

    } else if (i === 6) {
      // User's DYNAMIC Fire Swarm for the seventh element
      const dotGeo = new THREE.TetrahedronGeometry(0.25);
      const bpMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, wireframe: true });
      fireMesh = new THREE.InstancedMesh(dotGeo, bpMat, fireCount);
      fireMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      for (let j = 0; j < fireCount; j++) {
        firePositions.push(new THREE.Vector3((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100));
        fireMesh.setColorAt(j, fireColor.setHex(BLUEPRINT_COLOR));
      }

      fireMesh.position.set(isMobile ? xPos * 0.45 : xPos, 0, zPos);
      scene.add(fireMesh);
      blueprints.push({ mesh: fireMesh, mat: bpMat, z: zPos });

    } else if (i === 7) {
      // User's custom Helix Geometry for the final eighth element
      const count = 1500; // Drastically reduced from 10000
      const dotGeo = new THREE.TetrahedronGeometry(0.25);
      const bpMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, wireframe: true });
      const helixMesh = new THREE.InstancedMesh(dotGeo, bpMat, count);

      const dummy = new THREE.Object3D();
      const target = new THREE.Vector3();
      const color = new THREE.Color();

      for (let j = 0; j < count; j++) {
        const r = 5; // Uniform radius limit
        const h = count * 0.01; // Restored visual height mapping (1500 * 0.01 = 15)
        const off = h / 2;
        const t = j * 0.333; // Math compensated for twist count ratio

        target.set(Math.cos(t) * r, (j * 0.01) - off, Math.sin(t) * r);
        color.setHex(BLUEPRINT_COLOR); // Warm cream/ivory

        dummy.position.copy(target);
        dummy.updateMatrix();

        helixMesh.setMatrixAt(j, dummy.matrix);
        helixMesh.setColorAt(j, color);
      }
      helixMesh.instanceMatrix.needsUpdate = true;
      if (helixMesh.instanceColor) helixMesh.instanceColor.needsUpdate = true;

      helixMesh.position.set(xPos, 0, zPos);

      // Provide a slow elegant spin to showcase the helix
      gsap.to(helixMesh.rotation, {
        y: Math.PI * 2,
        duration: 35,
        ease: "none",
        repeat: -1
      });

      scene.add(helixMesh);
      blueprints.push({ mesh: helixMesh, mat: bpMat, z: zPos });

    } else {
      // Standard wireframe planes
      const bpMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
      });
      const bpMesh = new THREE.Mesh(bpGeo, bpMat);

      bpMesh.position.set(xPos, 0, zPos);
      bpMesh.rotation.y = (i % 2 === 0) ? Math.PI / 4 : -Math.PI / 4;

      scene.add(bpMesh);
      blueprints.push({ mesh: bpMesh, mat: bpMat, z: zPos });
    }
  }
});

// ── Loader Dismissal ──────────────────
modelLoadedPromise.then(() => {
  gsap.to('.loader-overlay', {
    yPercent: -100,
    duration: 1.2,
    ease: 'power3.inOut'
  });
});


const tick = () => {
  // getDelta() must come first — getElapsedTime() calls it internally and would reset the timer
  const delta = Math.min(clock.getDelta(), 0.05); // clamp: prevents huge jump on tab re-focus
  const elapsedTime = clock.elapsedTime;
  material.uniforms.uTime.value = elapsedTime;

  if (mainSphere) {
    mainSphere.rotation.y += 0.0015;
    mainSphere.rotation.x += 0.0005;
  }

  // Perfectly sync the duplicate sphere so the teleport transition is invisible
  if (duplicateSphere && mainSphere) {
    duplicateSphere.rotation.copy(mainSphere.rotation);
  }

  // Tesseract Dynamic Animation Setup (Spatial Occlusion active to prevent CPU exhaustion)
  if (tessMesh && Math.abs(currentCameraZ - tessMesh.position.z) < 55) {
    const scale = 5.0; // Uniform downscaling
    const chaos = 1.2;
    const pulseSpeed = 0.5; // Halved internal pulsing speed
    const warpDepth = 0.8;
    const time = elapsedTime;

    for (let i = 0; i < tessCount; i++) {
      // --- Normalized particle index ---
      const t = i / tessCount;
      const t2 = i / (tessCount - 1 + 1e-9);

      // --- Multi-layered phi/theta distribution ---
      const goldenAngle = 2.399963229728653;
      const phi = Math.acos(1.0 - 2.0 * t2);
      const theta = goldenAngle * i;

      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      const sinTh = Math.sin(theta);
      const cosTh = Math.cos(theta);

      // --- 4D Hyper-Tesseract rotation ---
      const a1 = time * 0.17 * pulseSpeed;
      const a2 = time * 0.23 * pulseSpeed;
      const a3 = time * 0.11 * pulseSpeed;

      const w4 = Math.cos(phi * 2.0 + time * 0.3 * pulseSpeed);
      let x4 = sinPhi * cosTh;
      let y4 = sinPhi * sinTh;
      let z4 = cosPhi;

      // XW rotation
      const cosA1 = Math.cos(a1), sinA1 = Math.sin(a1);
      const xr1 = x4 * cosA1 - w4 * sinA1;
      const wr1 = x4 * sinA1 + w4 * cosA1;
      x4 = xr1;
      const w1 = wr1;

      // YZ rotation
      const cosA2 = Math.cos(a2), sinA2 = Math.sin(a2);
      const yr2 = y4 * cosA2 - z4 * sinA2;
      const zr2 = y4 * sinA2 + z4 * cosA2;
      y4 = yr2;
      z4 = zr2;

      // ZW rotation
      const cosA3 = Math.cos(a3), sinA3 = Math.sin(a3);
      const zr3 = z4 * cosA3 - w1 * sinA3;
      const wr3 = z4 * sinA3 + w1 * cosA3;
      z4 = zr3;

      // Perspective-project 4D -> 3D
      const wProj = 1.0 / (2.2 - wr3 * 0.5 + 1e-6);
      const px = x4 * wProj;
      const py = y4 * wProj;
      const pz = z4 * wProj;

      // --- Lorenz attractor bias ---
      const lorenzSigma = 5.0 + chaos * 4.0;
      const lorenzBeta = 2.667;
      const lx = px * 0.4, ly = py * 0.4, lz = pz * 0.4;
      const ldx = lorenzSigma * (ly - lx);
      const ldy = lx * (28.0 - lz) - ly;
      const ldz = lx * ly - lorenzBeta * lz;
      const llen = Math.sqrt(ldx * ldx + ldy * ldy + ldz * ldz) + 1e-6;
      const lnx = ldx / llen, lny = ldy / llen, lnz = ldz / llen;

      const chaosMix = chaos * 0.18;

      // --- Breathing pulse ---
      const breathe = 1.0 + 0.22 * Math.sin(time * pulseSpeed * 1.4 + t * 6.283);

      // --- Radial warp ---
      const latBias = Math.abs(cosPhi);
      const warpPull = 1.0 - warpDepth * 0.35 * latBias * latBias;

      // --- Final position ---
      const fx = (px * (1.0 - chaosMix) + lnx * chaosMix) * scale * breathe * warpPull;
      const fy = (py * (1.0 - chaosMix) + lny * chaosMix) * scale * breathe * warpPull;
      const fz = (pz * (1.0 - chaosMix) + lnz * chaosMix) * scale * breathe * warpPull;

      tessTarget.set(fx, fy, fz);

      tessPositions[i].lerp(tessTarget, 0.1);
      tessDummy.position.copy(tessPositions[i]);
      tessDummy.lookAt(0, 0, 0);
      tessDummy.updateMatrix();

      tessMesh.setMatrixAt(i, tessDummy.matrix);
    }
    tessMesh.instanceMatrix.needsUpdate = true;
  }

  // Breathing Tesseract Dynamic Animation Setup (Spatial Occlusion active)
  if (breathMesh && Math.abs(currentCameraZ - breathMesh.position.z) < 55) {
    const scale = 5.0; // Uniform parameter bounding
    const breath = 1.5;
    const rotSpeed = 0.5;
    const morph = 4.0;
    const time = elapsedTime;

    for (let i = 0; i < breathCount; i++) {
      const u = i * 0.0234 * Math.PI * 2.0;
      const v = i * 0.00185 * Math.PI * 2.0;

      let x = Math.cos(u) * Math.cos(v);
      let y = Math.sin(u) * Math.cos(v);
      let z = Math.cos(u * morph) * Math.sin(v);
      let w = Math.sin(u * morph) * Math.sin(v);

      const cubeFactor = Math.sin(time * 0.5) * 0.5 + 0.5;
      x = x + cubeFactor * (x * x * x - x);
      y = y + cubeFactor * (y * y * y - y);
      z = z + cubeFactor * (z * z * z - z);
      w = w + cubeFactor * (w * w * w - w);

      const t1 = time * rotSpeed;
      const t2 = time * rotSpeed * 1.33;

      const xRot = x * Math.cos(t1) - w * Math.sin(t1);
      const wRot = x * Math.sin(t1) + w * Math.cos(t1);

      const yRot = y * Math.cos(t2) - z * Math.sin(t2);
      const zRot = y * Math.sin(t2) + z * Math.cos(t2);

      const wBreathe = wRot + Math.sin(time * breath) * 0.3;

      const projDist = 2.5;
      const wDenom = Math.max(0.01, projDist - wBreathe);
      const projScale = scale / wDenom;

      breathTarget.set(
        xRot * projScale,
        yRot * projScale,
        zRot * projScale
      );

      breathPositions[i].lerp(breathTarget, 0.1);
      breathDummy.position.copy(breathPositions[i]);
      breathDummy.lookAt(0, 0, 0);
      breathDummy.updateMatrix();

      breathMesh.setMatrixAt(i, breathDummy.matrix);
    }
    breathMesh.instanceMatrix.needsUpdate = true;
  }

  // Fire Swarm Dynamic Animation Setup (Spatial Occlusion active, optimized speed & bounded scope)
  if (fireMesh && Math.abs(currentCameraZ - fireMesh.position.z) < 100) {
    const scale = 12.0; // Tighter vertical mapping to match base radii equivalent 
    const twist = 5.0;
    const speed = 0.15; // Slowed down significantly further to a crawl
    const turbulence = 1.0;
    const time = elapsedTime;

    for (let i = 0; i < fireCount; i++) {
      const t = time * speed;
      const u = i / fireCount;

      // golden angle distribution
      const ga = 2.399963229728653;
      const theta = i * ga;

      // base cylindrical flame shape
      const height = u * scale;
      const radius = (1.0 - u) * scale * 0.4;

      let x = Math.cos(theta) * radius;
      let z = Math.sin(theta) * radius;
      let y = height;

      // swirling motion
      const swirl = twist * (1.0 - u) + t;
      const cs = Math.cos(swirl);
      const sn = Math.sin(swirl);

      const sx = x * cs - z * sn;
      const sz = x * sn + z * cs;

      // turbulence distortion
      const noise = Math.sin(i * 0.1 + t * 2.0) * turbulence * (1.0 - u);

      x = sx + noise;
      z = sz + noise * 0.5;
      y += Math.sin(i * 0.05 + t * 3.0) * turbulence * 0.5;

      // rising wrap (looping flame)
      y = (y + t * 20.0) % scale;

      // set position
      fireTarget.set(x, y - scale * 0.5, z);

      // UPDATE
      firePositions[i].lerp(fireTarget, 0.1);
      fireDummy.position.copy(firePositions[i]);
      fireDummy.lookAt(0, 0, 0);
      fireDummy.updateMatrix();

      fireMesh.setMatrixAt(i, fireDummy.matrix);
    }
    fireMesh.instanceMatrix.needsUpdate = true;
  }

  // ── Spatial LERP Logic ──
  // Frame-rate-independent exponential decay: same perceived speed at 30/60/120 FPS
  currentCameraZ += (targetCameraZ - currentCameraZ) * (1 - Math.pow(0.92, delta * 60));

  // Paradox Loop Teleport
  if (currentCameraZ <= -220) {
    const offset = currentCameraZ - (-220);
    currentCameraZ = 0 + offset;
    targetCameraZ = 0 + offset;

    // Smoothly teleport Lenis native scroll without freezing mathematically bridging the 235 multiplier
    const newProgress = (14 - targetCameraZ) / 235;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    const newScrollY = newProgress * maxScroll;

    lenis.scrollTo(newScrollY, { immediate: true });

    // Reset blueprint opacities — stale pre-teleport values would linger for many frames otherwise
    blueprints.forEach(bp => { bp.mat.opacity = 0; });

    // Reset cards for next loop — kill in-flight tweens first or gsap.set gets overridden
    cssObjects.forEach(card => {
      card.revealed = false;
      gsap.killTweensOf(card.inners);
      gsap.set(card.inners, { y: '110%' });
    });
  }

  camera.position.z = currentCameraZ;
  // Force the camera to always look forward down the tunnel, never turning back!
  if (controls) controls.target.set(0, 0, currentCameraZ - 20);

  // 1. Dynamic Portal Bloom & FOV warp based on actual camera.position.z
  let distanceToSphere = Math.abs(currentCameraZ);
  if (Math.abs(currentCameraZ - (-220)) < distanceToSphere) {
    distanceToSphere = Math.abs(currentCameraZ - (-220));
  }

  // Safe Bloom Scaling
  if (distanceToSphere < 10) {
    const intensity = Math.pow((10 - distanceToSphere) / 10, 3) * 4.0;
    bloomPass.strength = 0.5 + intensity;
    camera.fov = 50 + (70 * (1 - (distanceToSphere / 10))); // 50 -> 120 Warp
    camera.updateProjectionMatrix(); // FOV changes every frame in the portal zone
  } else {
    bloomPass.strength = 0.5;
    if (camera.fov !== 50) {
      camera.fov = 50; // Only update when transitioning out of the portal zone
      camera.updateProjectionMatrix();
    }
  }

  // 2. Blueprint Proxy Fading + Entry Animation
  blueprints.forEach(bp => {
    const zOffset = currentCameraZ - bp.z;
    let targetOpacity = 0;

    if (zOffset >= 0 && zOffset < 180) {
      // Objects slowly materialize out of the darkness up to 180 units ahead
      targetOpacity = 0.85 * (1 - (zOffset / 180));
    } else if (zOffset < 0 && zOffset > -15) {
      // Sharp fade exactly as the object passes behind the camera lens (FOV exit)
      targetOpacity = 0.85 * (1 - Math.abs(zOffset) / 15);
    }

    bp.mat.opacity += (targetOpacity - bp.mat.opacity) * 0.1;

    // X-axis entry: fly from screen extremity to resting position
    // Scaled to 1/0.7 so animation completes at 70% of travel — object lands 30% before camera arrives
    if (bp.startX !== undefined) {
      const raw = Math.min(1, Math.max(0, currentCameraZ / bp.z));
      const early = Math.min(1, raw / 0.7);
      const eased = 1 - Math.pow(1 - early, 3); // ease-out cubic
      bp.mesh.position.x = bp.startX + (bp.endX - bp.startX) * eased;
    }
  });

  // 3. CSS3D Text Animations Trigger Array
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

  if (controls) controls.update();
  composer.render();

  // Only composite the CSS3D layer when at least one card is within view range
  const anyCSSVisible = cssObjects.some(card => {
    const dist = currentCameraZ - card.z;
    return dist > -15 && dist < 200;
  });
  if (anyCSSVisible) css3dRenderer.render(scene, camera);

  window.requestAnimationFrame(tick);
};

tick();
