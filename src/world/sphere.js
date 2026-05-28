import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Shared refs so tick() and the teleport-loop init can both read the live sphere.
export const sphereRefs = {
  mainSphere: null,
  duplicateSphere: null,
};

export function loadSphere(scene, material, manager, renderer, camera) {
  const gltfLoader = new GLTFLoader(manager);

  gltfLoader.load(
    '/models/POLY_SPHERE.glb',
    (gltf) => {
      const sphere = gltf.scene;
      sphereRefs.mainSphere = sphere;

      // Apply holographic shader to every mesh in the GLTF
      sphere.traverse((child) => {
        if (child.isMesh) {
          child.material = material;
        }
      });

      // Architectural wireframe overlay
      const wireframeMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.15,
        depthTest: true,
        depthWrite: false,
      });

      sphere.traverse((child) => {
        if (child.isMesh) {
          const edges = new THREE.EdgesGeometry(child.geometry, 15);
          const wireframe = new THREE.LineSegments(edges, wireframeMaterial);
          wireframe.scale.setScalar(1.001);
          child.add(wireframe);
        }
      });

      const spherePivot = new THREE.Group();
      spherePivot.add(sphere);
      scene.add(spherePivot);

      renderer.compile(scene, camera);
    },
    undefined,
    (error) => {
      console.error('❌ Failed to load POLY_SPHERE.glb:', error);
    }
  );
}

// Duplicate sphere at Z=-220 for seamless teleport loop.
// Must be called after the main sphere finished loading.
export function createDuplicateSphere(scene) {
  if (!sphereRefs.mainSphere) return;
  sphereRefs.duplicateSphere = sphereRefs.mainSphere.clone();
  sphereRefs.duplicateSphere.position.z = -220;
  scene.add(sphereRefs.duplicateSphere);
}
