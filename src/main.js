import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import barba from '@barba/core';
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

// Prevent browser from restoring scroll position on reload
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

gsap.registerPlugin(ScrollTrigger);

// ── Smooth Scrolling (Lenis) ───────────────────
const lenis = new Lenis();
lenis.on('scroll', ScrollTrigger.update);
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

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Update composer on resize
  composer.setSize(sizes.width, sizes.height);
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// ── Camera ─────────────────────────────────────
const camera = new THREE.PerspectiveCamera(
  25,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(14, 14, 14);
scene.add(camera);

// ── Controls ───────────────────────────────────
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// ── Renderer ───────────────────────────────────
const rendererParameters = { clearColor: '#0A0A0A' };

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setClearColor(rendererParameters.clearColor);
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

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
  0.4,   // Strength (intensity of the glow - reduced to lessen blur)
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

// ── Application Load State ─────────────────────
let resolveModelLoad;
const modelLoadedPromise = new Promise(resolve => resolveModelLoad = resolve);

// ── Load GLTF Icosphere ────────────────────────
const gltfLoader = new GLTFLoader();

gltfLoader.load(
  '/models/POLY_SPHERE.glb',
  // Success
  (gltf) => {
    const sphere = gltf.scene;

    // Apply holographic shader to every mesh in the GLTF
    sphere.traverse((child) => {
      if (child.isMesh) {
        child.material = material;
        console.log('  Mesh found:', child.name, '— geometry vertices:', child.geometry.attributes.position?.count);
      }
    });

    // ── Architectural Wireframe Overlay ──────────
    // EdgesGeometry extracts clean structural contours — no messy triangles.
    // LineSegments renders only the polygon edges as precision blueprint lines.
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,          // Start subtle — just a whisper of structure
      depthTest: true,
      depthWrite: false,
    });

    sphere.traverse((child) => {
      if (child.isMesh) {
        // Extract only the structural edges (threshold angle filters out coplanar faces)
        const edges = new THREE.EdgesGeometry(child.geometry, 15);
        const wireframe = new THREE.LineSegments(edges, wireframeMaterial);

        // Scale 1.001 — sits perfectly above the solid surface, zero z-fighting
        wireframe.scale.setScalar(1.001);

        // Parent to the mesh for perfect rotation/position sync
        child.add(wireframe);
      }
    });

    console.log('✅ Wireframe overlay applied');

    scene.add(sphere);
    console.log('✅ POLY_SPHERE loaded —', sphere.children.length, 'children');

    // Link object rotation and position to scroll position using ScrollTrigger
    const scrollTl = gsap.timeline({
      scrollTrigger: {
        trigger: ".page-wrapper",
        start: "top top",
        end: "bottom bottom",
        scrub: 1
      }
    });
    
    // Rotation — continuous throughout scroll
    scrollTl.to(sphere.rotation, {
      y: Math.PI * 4,
      x: Math.PI * 0.5,
      ease: "none",
      duration: 1 // Span the full scroll range
    }, 0);

    // ── Wireframe Opacity — reveal the math as user scrolls ──
    // STATE 0 (0%–25%): Barely visible — just a hint
    scrollTl.to(wireframeMaterial, {
      opacity: 0.25,
      ease: "none",
      duration: 0.25
    }, 0);

    // STATE 1 (25%–50%): Architecture section — the math reveals itself
    scrollTl.to(wireframeMaterial, {
      opacity: 0.7,
      ease: "power2.in",
      duration: 0.25
    }, 0.25);

    // STATE 2 (50%–75%): The Bridge — pull back to elegance
    scrollTl.to(wireframeMaterial, {
      opacity: 0.4,
      ease: "power1.out",
      duration: 0.25
    }, 0.50);

    // STATE 3 (75%–100%): The Summons — full reveal, all veins visible
    scrollTl.to(wireframeMaterial, {
      opacity: 1.0,
      ease: "power2.in",
      duration: 0.25
    }, 0.75);
    
    // Position continuous path (reverted from 4-state keyframes)
    scrollTl.to(sphere.position, {
      y: -3.0,
      z: -2.0,      // Pulls slightly back and down globally
      ease: "none",
      duration: 1   // 0%–100%
    }, 0);

    // Precompile heavy shaders to prevent first-render stutter
    renderer.compile(scene, camera);
    
    // Announce the engine is ready
    resolveModelLoad();
  },
  // Progress
  (progress) => {
    console.log('Loading...', Math.round((progress.loaded / progress.total) * 100) + '%');
  },
  // Error
  (error) => {
    console.error('❌ Failed to load POLY_SPHERE.glb:', error);
  }
);

// ── Animate ────────────────────────────────────
const clock = new THREE.Clock();

// ── Barba.js Page Transitions ──────────────────
barba.init({
  transitions: [{
    name: 'default-transition',
    once(data) {
      // Wait for the full 3D asset, EdgesGeometry extraction, and Shader compilation
      // before attempting to animate with GSAP. This eliminates the brutal mobile lag.
      return modelLoadedPromise.then(() => {
        return gsap.to('.loader-overlay', {
          yPercent: -100,
          duration: 1.2,
          ease: 'power3.inOut'
        });
      });
    },
    leave(data) {
      // Scroll down from the top to cover the screen
      return gsap.fromTo('.loader-overlay', 
        { yPercent: -100 }, 
        { yPercent: 0, duration: 1.2, ease: 'power3.inOut' }
      );
    },
    enter(data) {
      // Scroll back up to reveal new page
      return gsap.to('.loader-overlay', {
        yPercent: -100,
        duration: 1.2,
        ease: 'power3.inOut'
      });
    }
  }]
});

// ── Text Reveals Setup ─────────────────────────
function initTextReveals() {
  const elements = document.querySelectorAll('.split-target');
  
  elements.forEach((el) => {
    // Wrap to recreate exact line masks if they haven't been wrapped yet
    if (!el.querySelector('.line-wrapper')) {
      const originalHTML = el.innerHTML;
      el.innerHTML = `<span class="line-wrapper"><span class="line-inner">${originalHTML}</span></span>`;
    }

    const inner = el.querySelector('.line-inner');
    gsap.to(inner, {
      y: '0%',
      ease: 'power4.out',
      duration: 1.2,
      scrollTrigger: {
        trigger: el,
        start: 'top 90%',
        toggleActions: 'play none none none' // Play once it enters
      }
    });
  });
}

// Initial text reveal call
initTextReveals();

// Re-init logic whenever Barba changes pages
barba.hooks.after(() => {
  ScrollTrigger.refresh();
  initTextReveals();
});

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update shader time uniform
  material.uniforms.uTime.value = elapsedTime;

  // Update controls
  controls.update();

  // Render via Composer
  // renderer.render(scene, camera);
  composer.render();

  window.requestAnimationFrame(tick);
};

tick();
