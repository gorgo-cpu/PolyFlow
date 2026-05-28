import * as THREE from 'three';
import gsap from 'gsap';
import { BLUEPRINT_COLOR } from './constants.js';

// i=2: Torus knot traced by small boxes.
export function createTorusKnot(scene, { xPos, zPos }) {
  const count = 200; // Thinned from 600
  const dummy = new THREE.Object3D();
  const target = new THREE.Vector3();
  const color = new THREE.Color();

  const dotGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  const bpMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, wireframe: true });
  const bpMesh = new THREE.InstancedMesh(dotGeo, bpMat, count);

  for (let j = 0; j < count; j++) {
    const R_scaled = 3.5;
    const r_scaled = 1.5;
    const u = (j / count) * Math.PI * 2 * 40;
    const v = (j / count) * Math.PI * 2;
    target.set(
      (R_scaled + r_scaled * Math.cos(u)) * Math.cos(v),
      (R_scaled + r_scaled * Math.cos(u)) * Math.sin(v),
      r_scaled * Math.sin(u)
    );

    dummy.position.copy(target);
    dummy.lookAt(0, 0, 0);
    dummy.updateMatrix();

    bpMesh.setMatrixAt(j, dummy.matrix);
    color.setHex(BLUEPRINT_COLOR);
    bpMesh.setColorAt(j, color);
  }

  bpMesh.instanceMatrix.needsUpdate = true;
  if (bpMesh.instanceColor) bpMesh.instanceColor.needsUpdate = true;

  bpMesh.position.set(xPos, 0, zPos);

  gsap.to(bpMesh.rotation, { y: Math.PI * 2, duration: 40, ease: 'none', repeat: -1 });

  scene.add(bpMesh);
  return { blueprint: { mesh: bpMesh, mat: bpMat, z: zPos } };
}
