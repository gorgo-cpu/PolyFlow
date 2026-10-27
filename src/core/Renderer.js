import * as THREE from 'three';
import { CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import { sizes } from './Sizes.js';

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false, // Scene renders into the composer's target; canvas MSAA would only smooth the final fullscreen quad
    powerPreference: 'high-performance', // Prefer discrete GPU on dual-GPU laptops
  });
  renderer.setClearColor('#0A0A0A');
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  return renderer;
}

export function createCSS3DRenderer() {
  const css3dRenderer = new CSS3DRenderer();
  css3dRenderer.setSize(sizes.width, sizes.height);
  css3dRenderer.domElement.style.position = 'absolute';
  css3dRenderer.domElement.style.top = '0';
  css3dRenderer.domElement.style.pointerEvents = 'none';
  document.getElementById('css3d-container').appendChild(css3dRenderer.domElement);
  return css3dRenderer;
}
