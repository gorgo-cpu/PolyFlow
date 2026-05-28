import * as THREE from 'three';
import gsap from 'gsap';
import { BLUEPRINT_COLOR } from './constants.js';

// i=0: Fibonacci-sphere distribution of small boxes, flies in from off-screen left.
export function createFibonacciSphere(scene, { xPos, zPos, isMobile }) {
  const count = 150; // Thinned out from 400 for aesthetics
  const r = 5; // Uniformly downscaled to match boundaries
  const dummy = new THREE.Object3D();
  const target = new THREE.Vector3();
  const color = new THREE.Color();

  const dotGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  const bpMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, wireframe: true });
  const bpMesh = new THREE.InstancedMesh(dotGeo, bpMat, count);

  for (let j = 0; j < count; j++) {
    const phi = Math.acos(-1 + (2 * j) / count);
    const theta = Math.sqrt(count * Math.PI) * phi;
    target.set(r * Math.cos(theta) * Math.sin(phi), r * Math.sin(theta) * Math.sin(phi), r * Math.cos(phi));

    dummy.position.copy(target);
    dummy.lookAt(0, 0, 0);
    dummy.updateMatrix();

    bpMesh.setMatrixAt(j, dummy.matrix);
    color.setHex(BLUEPRINT_COLOR);
    bpMesh.setColorAt(j, color);
  }

  bpMesh.instanceMatrix.needsUpdate = true;
  if (bpMesh.instanceColor) bpMesh.instanceColor.needsUpdate = true;

  // Start off-screen left — flies in to xPos as camera enters corridor
  const fibStartX = -22;
  bpMesh.position.set(fibStartX, 0, zPos);

  // Smooth, continuous single-axis spin
  gsap.to(bpMesh.rotation, { y: Math.PI * 2, duration: 40, ease: 'none', repeat: -1 });

  scene.add(bpMesh);
  return {
    blueprint: { mesh: bpMesh, mat: bpMat, z: zPos, startX: fibStartX, endX: isMobile ? -4 : xPos }
  };
}
