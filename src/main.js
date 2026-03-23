import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import GUI from 'lil-gui';
import holographicVertexShader from './shaders/sphere/vertex.glsl';
import holographicFragmentShader from './shaders/sphere/fragment.glsl';

/**
 * POLYFLOWS — Main Entry Point
 * ────────────────────────────
 * Loads the GLTF icosphere and applies the holographic shader.
 */

// ── Debug ──────────────────────────────────────
const gui = new GUI({ title: 'POLYFLOWS Debug' });

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
});

// ── Camera ─────────────────────────────────────
const camera = new THREE.PerspectiveCamera(
  75, // wider FOV to pull the view back
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(7, 7, 7);
scene.add(camera);

// ── Controls ───────────────────────────────────
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// ── Renderer ───────────────────────────────────
const rendererParameters = { clearColor: '#1d1f2a' };

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setClearColor(rendererParameters.clearColor);
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

gui.addColor(rendererParameters, 'clearColor').onChange(() => {
  renderer.setClearColor(rendererParameters.clearColor);
});

// ── Holographic Material ───────────────────────
const materialParameters = { color: '#70c1ff' };

const material = new THREE.ShaderMaterial({
  vertexShader: holographicVertexShader,
  fragmentShader: holographicFragmentShader,
  uniforms: {
    uTime: new THREE.Uniform(0),
    uColor: new THREE.Uniform(new THREE.Color(materialParameters.color)),
  },
  // Opaque rendering so tiles are always visible
  transparent: false,
  depthWrite: true,
  blending: THREE.NormalBlending,
  side: THREE.DoubleSide,
});

gui.addColor(materialParameters, 'color').onChange(() => {
  material.uniforms.uColor.value.set(materialParameters.color);
});

// ── Load GLTF Icosphere ────────────────────────
const gltfLoader = new GLTFLoader();

gltfLoader.load(
  '/models/POLYFLOW.glb',
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

    scene.add(sphere);
    console.log('✅ POLYFLOW loaded —', sphere.children.length, 'children');
  },
  // Progress
  (progress) => {
    console.log('Loading...', Math.round((progress.loaded / progress.total) * 100) + '%');
  },
  // Error
  (error) => {
    console.error('❌ Failed to load POLYFLOW.glb:', error);
  }
);

// ── Animate ────────────────────────────────────
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update shader time uniform
  material.uniforms.uTime.value = elapsedTime;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  window.requestAnimationFrame(tick);
};

tick();
