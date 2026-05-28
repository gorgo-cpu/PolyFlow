import * as THREE from 'three';
import gsap from 'gsap';
import { BLUEPRINT_COLOR } from './constants.js';

// i=7: Static helix traced by tetrahedrons, elegant spin.
export function createHelix(scene, { xPos, zPos }) {
  const count = 1500; // Drastically reduced from 10000
  const dotGeo = new THREE.TetrahedronGeometry(0.25);
  const bpMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, wireframe: true });
  const helixMesh = new THREE.InstancedMesh(dotGeo, bpMat, count);

  const dummy = new THREE.Object3D();
  const target = new THREE.Vector3();
  const color = new THREE.Color();

  for (let j = 0; j < count; j++) {
    const r = 5;
    const h = count * 0.01;
    const off = h / 2;
    const t = j * 0.333; // Twist count ratio compensated for thinned particles

    target.set(Math.cos(t) * r, (j * 0.01) - off, Math.sin(t) * r);
    color.setHex(BLUEPRINT_COLOR);

    dummy.position.copy(target);
    dummy.updateMatrix();

    helixMesh.setMatrixAt(j, dummy.matrix);
    helixMesh.setColorAt(j, color);
  }
  helixMesh.instanceMatrix.needsUpdate = true;
  if (helixMesh.instanceColor) helixMesh.instanceColor.needsUpdate = true;

  helixMesh.position.set(xPos, 0, zPos);

  gsap.to(helixMesh.rotation, {
    y: Math.PI * 2,
    duration: 35,
    ease: 'none',
    repeat: -1
  });

  scene.add(helixMesh);
  return { blueprint: { mesh: helixMesh, mat: bpMat, z: zPos } };
}
