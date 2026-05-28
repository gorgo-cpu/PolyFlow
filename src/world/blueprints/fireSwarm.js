import * as THREE from 'three';
import { BLUEPRINT_COLOR } from './constants.js';

// i=6: Dynamic fire swarm — cylindrical flame with swirl + turbulence + rising wrap.
// 100-unit occlusion range (wider than the tesseracts) because the column is tall.
export function createFireSwarm(scene, { xPos, zPos, isMobile }) {
  const fireCount = isMobile ? 200 : 2000; // Reduced from 10000
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

  function update(elapsedTime, currentCameraZ) {
    if (Math.abs(currentCameraZ - fireMesh.position.z) >= 100) return;

    const scale = 12.0;
    const twist = 5.0;
    const speed = 0.15; // Slowed to a crawl
    const turbulence = 1.0;
    const time = elapsedTime;

    for (let i = 0; i < fireCount; i++) {
      const t = time * speed;
      const u = i / fireCount;

      // Golden angle distribution
      const ga = 2.399963229728653;
      const theta = i * ga;

      // Base cylindrical flame shape
      const height = u * scale;
      const radius = (1.0 - u) * scale * 0.4;

      let x = Math.cos(theta) * radius;
      let z = Math.sin(theta) * radius;
      let y = height;

      // Swirling motion
      const swirl = twist * (1.0 - u) + t;
      const cs = Math.cos(swirl);
      const sn = Math.sin(swirl);

      const sx = x * cs - z * sn;
      const sz = x * sn + z * cs;

      // Turbulence distortion
      const noise = Math.sin(i * 0.1 + t * 2.0) * turbulence * (1.0 - u);

      x = sx + noise;
      z = sz + noise * 0.5;
      y += Math.sin(i * 0.05 + t * 3.0) * turbulence * 0.5;

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
