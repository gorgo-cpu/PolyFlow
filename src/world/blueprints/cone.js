import * as THREE from 'three';
import gsap from 'gsap';
import { BLUEPRINT_COLOR } from './constants.js';

// i=4: Slightly spinning wireframe cone.
export function createCone(scene, { xPos, zPos, isMobile }) {
  const coneGeo = new THREE.ConeGeometry(4, 9, 16);
  const bpMat = new THREE.MeshBasicMaterial({ color: BLUEPRINT_COLOR, transparent: true, opacity: 0, wireframe: true });
  const coneMesh = new THREE.Mesh(coneGeo, bpMat);
  coneMesh.position.set(isMobile ? xPos * 0.45 : xPos, 0, zPos);

  gsap.to(coneMesh.rotation, {
    y: Math.PI * 2,
    x: Math.PI * 0.1,
    duration: 35,
    ease: 'none',
    repeat: -1
  });

  scene.add(coneMesh);
  return { blueprint: { mesh: coneMesh, mat: bpMat, z: zPos } };
}
