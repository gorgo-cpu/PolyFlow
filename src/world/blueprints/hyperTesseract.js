import * as THREE from 'three';
import gsap from 'gsap';
import { BLUEPRINT_COLOR } from './constants.js';

// i=3: Dynamic 4D hyper-tesseract with Lorenz-attractor bias + breathing pulse.
// Spatial occlusion guard inside update() prevents CPU exhaustion when off-camera.
export function createHyperTesseract(scene, { xPos, zPos, isMobile }) {
  const tessCount = isMobile ? 60 : 500; // Mobile cut to 60 — each particle costs ~8 trig calls + Lorenz step per frame
  const tessPositions = [];
  const tessTarget = new THREE.Vector3();
  const tessColor = new THREE.Color();
  const tessDummy = new THREE.Object3D();

  const dotGeo = new THREE.TetrahedronGeometry(0.25);
  const bpMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, wireframe: true });
  const tessMesh = new THREE.InstancedMesh(dotGeo, bpMat, tessCount);
  tessMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  for (let j = 0; j < tessCount; j++) {
    tessPositions.push(new THREE.Vector3(
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 100
    ));
    tessMesh.setColorAt(j, tessColor.setHex(BLUEPRINT_COLOR));
  }

  // Re-mapped lateral spacing to drag the object 60% inward, forcing a camera collision overlap
  tessMesh.position.set(xPos * 0.4, 0, zPos);

  // Replicates global sequence rotation natively via GSAP
  gsap.to(tessMesh.rotation, {
    x: Math.PI * 4,
    y: Math.PI * 8,
    duration: 90,
    ease: 'none',
    repeat: -1
  });

  scene.add(tessMesh);

  function update(elapsedTime, currentCameraZ) {
    if (Math.abs(currentCameraZ - tessMesh.position.z) >= 55) return;

    const scale = 5.0;
    const chaos = 1.2;
    const pulseSpeed = 0.5; // Halved internal pulsing speed
    const warpDepth = 0.8;
    const time = elapsedTime;

    for (let i = 0; i < tessCount; i++) {
      const t = i / tessCount;
      const t2 = i / (tessCount - 1 + 1e-9);

      // Multi-layered phi/theta distribution
      const goldenAngle = 2.399963229728653;
      const phi = Math.acos(1.0 - 2.0 * t2);
      const theta = goldenAngle * i;

      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      const sinTh = Math.sin(theta);
      const cosTh = Math.cos(theta);

      // 4D hyper-tesseract rotation
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

      // Lorenz attractor bias
      const lorenzSigma = 5.0 + chaos * 4.0;
      const lorenzBeta = 2.667;
      const lx = px * 0.4, ly = py * 0.4, lz = pz * 0.4;
      const ldx = lorenzSigma * (ly - lx);
      const ldy = lx * (28.0 - lz) - ly;
      const ldz = lx * ly - lorenzBeta * lz;
      const llen = Math.sqrt(ldx * ldx + ldy * ldy + ldz * ldz) + 1e-6;
      const lnx = ldx / llen, lny = ldy / llen, lnz = ldz / llen;

      const chaosMix = chaos * 0.18;

      // Breathing pulse
      const breathe = 1.0 + 0.22 * Math.sin(time * pulseSpeed * 1.4 + t * 6.283);

      // Radial warp
      const latBias = Math.abs(cosPhi);
      const warpPull = 1.0 - warpDepth * 0.35 * latBias * latBias;

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

  return {
    blueprint: { mesh: tessMesh, mat: bpMat, z: zPos },
    update
  };
}
