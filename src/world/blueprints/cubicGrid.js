import * as THREE from 'three';
import gsap from 'gsap';
import { BLUEPRINT_COLOR } from './constants.js';

// i=1: 5x5x5 cubic grid, flies in from off-screen right.
export function createCubicGrid(scene, { xPos, zPos, isMobile }) {
  const count = 125; // 5x5x5 perfect cube, thinned out from 512
  const dummy = new THREE.Object3D();
  const target = new THREE.Vector3();
  const color = new THREE.Color();

  const dotGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  const bpMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, wireframe: true });
  const bpMesh = new THREE.InstancedMesh(dotGeo, bpMat, count);

  const s = Math.ceil(Math.pow(count, 1 / 3));
  const sep = 2.0; // Expanded separation to maintain bounding width with fewer dots
  const off = (s * sep) / 2;

  for (let j = 0; j < count; j++) {
    const z = Math.floor(j / (s * s));
    const y = Math.floor((j % (s * s)) / s);
    const x = j % s;

    target.set(x * sep - off, y * sep - off, z * sep - off);

    dummy.position.copy(target);
    dummy.lookAt(0, 0, 0);
    dummy.updateMatrix();

    bpMesh.setMatrixAt(j, dummy.matrix);
    color.setHex(BLUEPRINT_COLOR);
    bpMesh.setColorAt(j, color);
  }

  bpMesh.instanceMatrix.needsUpdate = true;
  if (bpMesh.instanceColor) bpMesh.instanceColor.needsUpdate = true;

  // Start off-screen right — flies in to xPos as camera enters corridor
  const cubeStartX = 32;
  bpMesh.position.set(cubeStartX, 0, zPos);

  gsap.to(bpMesh.rotation, { y: Math.PI * 2, duration: 40, ease: 'none', repeat: -1 });

  scene.add(bpMesh);
  return {
    blueprint: { mesh: bpMesh, mat: bpMat, z: zPos, startX: cubeStartX, endX: isMobile ? 4 : xPos }
  };
}
