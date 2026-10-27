import * as THREE from 'three';
import { BLUEPRINT_COLOR } from './constants.js';
import { isMobileDevice } from '../../utils/device.js';

const GOLDEN_ANGLE = 2.399963229728653;
const SCALE = 12.0;
const TWIST = 5.0;

// i=6: Dynamic fire swarm — cylindrical flame with swirl + turbulence + rising wrap.
// 100-unit occlusion range (wider than the tesseracts) because the column is tall.
export function createFireSwarm(scene, { xPos, zPos, isMobile }) {
  // Device tier, not viewport width: a landscape phone must not get the desktop count
  const fireCount = isMobileDevice ? 80 : 2000; // Reduced from 10000; mobile A16 chokes above ~100 swirl particles
  const firePositions = [];
  const fireTarget = new THREE.Vector3();
  const fireColor = new THREE.Color();
  const fireDummy = new THREE.Object3D();

  const dotGeo = new THREE.TetrahedronGeometry(0.25);
  const bpMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, wireframe: true });
  const fireMesh = new THREE.InstancedMesh(dotGeo, bpMat, fireCount);
  fireMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  for (let j = 0; j < fireCount; j++) {
    firePositions.push(new THREE.Vector3(
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 100
    ));
    fireMesh.setColorAt(j, fireColor.setHex(BLUEPRINT_COLOR));
  }

  fireMesh.position.set(isMobile ? xPos * 0.45 : xPos, 0, zPos);
  scene.add(fireMesh);

  // Per-particle static terms: cylindrical base, swirl offset and both noise phases as cos/sin pairs.
  // Time-dependent sin/cos(a + b) in update() are expanded via angle addition against these.
  const baseX = new Float32Array(fireCount);
  const baseZ = new Float32Array(fireCount);
  const cosSwirl = new Float32Array(fireCount);
  const sinSwirl = new Float32Array(fireCount);
  const cosNoiseA = new Float32Array(fireCount);
  const sinNoiseA = new Float32Array(fireCount);
  const cosNoiseB = new Float32Array(fireCount);
  const sinNoiseB = new Float32Array(fireCount);
  for (let i = 0; i < fireCount; i++) {
    const u = i / fireCount;
    const theta = i * GOLDEN_ANGLE;
    const radius = (1.0 - u) * SCALE * 0.4;
    baseX[i] = Math.cos(theta) * radius;
    baseZ[i] = Math.sin(theta) * radius;
    const swirlOffset = TWIST * (1.0 - u);
    cosSwirl[i] = Math.cos(swirlOffset);
    sinSwirl[i] = Math.sin(swirlOffset);
    cosNoiseA[i] = Math.cos(i * 0.1);
    sinNoiseA[i] = Math.sin(i * 0.1);
    cosNoiseB[i] = Math.cos(i * 0.05);
    sinNoiseB[i] = Math.sin(i * 0.05);
  }

  function update(elapsedTime, currentCameraZ) {
    if (Math.abs(currentCameraZ - fireMesh.position.z) >= 70) return;

    const scale = SCALE;
    const speed = 0.15; // Slowed to a crawl
    const turbulence = 1.0;
    const time = elapsedTime;

    // Shared by every particle this frame
    const t = time * speed;
    const cosT = Math.cos(t), sinT = Math.sin(t);
    const cos2T = Math.cos(t * 2.0), sin2T = Math.sin(t * 2.0);
    const cos3T = Math.cos(t * 3.0), sin3T = Math.sin(t * 3.0);

    for (let i = 0; i < fireCount; i++) {
      const u = i / fireCount;

      // Base cylindrical flame shape (golden angle distribution)
      let x = baseX[i];
      let z = baseZ[i];
      let y = u * scale;

      // Swirling motion: cos/sin(twist * (1 - u) + t)
      const cs = cosSwirl[i] * cosT - sinSwirl[i] * sinT;
      const sn = sinSwirl[i] * cosT + cosSwirl[i] * sinT;

      const sx = x * cs - z * sn;
      const sz = x * sn + z * cs;

      // Turbulence distortion: sin(i * 0.1 + 2t) and sin(i * 0.05 + 3t)
      const noise = (sinNoiseA[i] * cos2T + cosNoiseA[i] * sin2T) * turbulence * (1.0 - u);

      x = sx + noise;
      z = sz + noise * 0.5;
      y += (sinNoiseB[i] * cos3T + cosNoiseB[i] * sin3T) * turbulence * 0.5;

      // Rising wrap (looping flame)
      y = (y + t * 20.0) % scale;

      fireTarget.set(x, y - scale * 0.5, z);

      firePositions[i].lerp(fireTarget, 0.1);
      fireDummy.position.copy(firePositions[i]);
      fireDummy.lookAt(0, 0, 0);
      fireDummy.updateMatrix();

      fireMesh.setMatrixAt(i, fireDummy.matrix);
    }
    fireMesh.instanceMatrix.needsUpdate = true;
  }

  return {
    blueprint: { mesh: fireMesh, mat: bpMat, z: zPos },
    update
  };
}
