import * as THREE from 'three';
import vertexShader from '../shaders/dust/vertex.glsl';
import fragmentShader from '../shaders/dust/fragment.glsl';
import { isMobileDevice, prefersReducedMotion } from '../utils/device.js';

// Depth-field dust: one THREE.Points draw call; all motion lives in the vertex shader.
// CPU cost per frame is four uniform writes.

const DUST_COUNT = isMobileDevice ? 1200 : 3500;
const DUST_FIELD_DEPTH = 110;   // Mirrors FIELD_DEPTH in dust/vertex.glsl
const DUST_INNER_RADIUS = 4;    // Keeps the corridor axis clear so points never fill the lens
const DUST_OUTER_RADIUS = 42;
const DUST_VERTICAL_SQUASH = 0.65;
const DUST_SIZE = 90;           // px at 1 unit depth; ~4.5px at 20 units for an average mote
const DUST_COLOR = '#FFF5E4';   // Site cream, matches blueprint/UI accents
const DUST_OPACITY = 0.3;       // x1.6 at full scroll speed = 0.48, still under the bloom threshold (0.5)
const DUST_DRIFT = 0.6;
const SPEED_FOR_FULL_BOOST = 60; // Camera units/second that map to uSpeed = 1
const SPEED_SMOOTHING = 4;       // Higher = speed response follows scrolling more tightly
const TELEPORT_GUARD = 50;       // Per-frame z jumps above this are the loop teleport, not motion

export function createDust(scene, renderer) {
  const positions = new Float32Array(DUST_COUNT * 3);
  const scales = new Float32Array(DUST_COUNT);
  const seeds = new Float32Array(DUST_COUNT);

  for (let i = 0; i < DUST_COUNT; i++) {
    // Uniform-by-area annulus around the corridor axis (sqrt keeps the outer ring from thinning)
    const angle = Math.random() * Math.PI * 2;
    const t = Math.random();
    const radius = Math.sqrt(
      DUST_INNER_RADIUS * DUST_INNER_RADIUS +
      t * (DUST_OUTER_RADIUS * DUST_OUTER_RADIUS - DUST_INNER_RADIUS * DUST_INNER_RADIUS)
    );

    positions[i * 3 + 0] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = Math.sin(angle) * radius * DUST_VERTICAL_SQUASH;
    positions[i * 3 + 2] = -Math.random() * DUST_FIELD_DEPTH;

    // Skewed toward small: most points are fine grain, a few read as nearer motes
    scales[i] = 0.4 + Math.pow(Math.random(), 3) * 1.4;
    seeds[i] = Math.random();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: new THREE.Uniform(0),
      uCameraZ: new THREE.Uniform(0),
      uSize: new THREE.Uniform(DUST_SIZE),
      uPixelRatio: new THREE.Uniform(renderer.getPixelRatio()),
      uDrift: new THREE.Uniform(prefersReducedMotion() ? 0 : DUST_DRIFT),
      uSpeed: new THREE.Uniform(0),
      uColor: new THREE.Uniform(new THREE.Color(DUST_COLOR)),
      uOpacity: new THREE.Uniform(DUST_OPACITY),
    },
    transparent: true,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false; // Positions are rewritten in the shader; CPU bounds are meaningless
  points.renderOrder = -1;      // Draw first so every blueprint composites over it
  scene.add(points);

  let lastCameraZ = undefined;
  let smoothedSpeed = 0;

  function update(elapsedTime, delta, cameraZ) {
    const uniforms = material.uniforms;
    uniforms.uTime.value = elapsedTime;
    uniforms.uCameraZ.value = cameraZ;
    uniforms.uPixelRatio.value = renderer.getPixelRatio();
    uniforms.uDrift.value = prefersReducedMotion() ? 0 : DUST_DRIFT;

    // Scroll speed in camera units/second, ignoring the teleport jump, eased for a soft swell
    const dz = lastCameraZ === undefined ? 0 : Math.abs(cameraZ - lastCameraZ);
    lastCameraZ = cameraZ;
    const rawSpeed = dz > TELEPORT_GUARD || delta <= 0 ? 0 : dz / delta;
    const targetSpeed = prefersReducedMotion() ? 0 : Math.min(rawSpeed / SPEED_FOR_FULL_BOOST, 1);
    smoothedSpeed += (targetSpeed - smoothedSpeed) * Math.min(delta * SPEED_SMOOTHING, 1);
    uniforms.uSpeed.value = smoothedSpeed;
  }

  function dispose() {
    scene.remove(points);
    geometry.dispose();
    material.dispose();
  }

  return { update, dispose };
}
