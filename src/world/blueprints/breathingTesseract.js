import * as THREE from 'three';
import { BLUEPRINT_COLOR } from './constants.js';

// i=5: Dynamic breathing tesseract — morphs between sphere/cube and projects 4D->3D with a wBreathe wobble.
export function createBreathingTesseract(scene, { xPos, zPos, isMobile }) {
  const breathCount = isMobile ? 60 : 450; // Mobile cut to 60 — each particle costs ~6 trig calls + 4D projection per frame
  const breathPositions = [];
  const breathTarget = new THREE.Vector3();
  const breathColor = new THREE.Color();
  const breathDummy = new THREE.Object3D();

  const dotGeo = new THREE.TetrahedronGeometry(0.25);
  const bpMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, wireframe: true });
  const breathMesh = new THREE.InstancedMesh(dotGeo, bpMat, breathCount);
  breathMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  for (let j = 0; j < breathCount; j++) {
    breathPositions.push(new THREE.Vector3(
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 100
    ));
    breathMesh.setColorAt(j, breathColor.setHex(BLUEPRINT_COLOR));
  }

  // Overriding generic blueprint bounds to pull the 6th element alongside the camera
  breathMesh.position.set(isMobile ? xPos * 0.2 : xPos * 0.4, 0, zPos);
  scene.add(breathMesh);

  function update(elapsedTime, currentCameraZ) {
    if (Math.abs(currentCameraZ - breathMesh.position.z) >= 55) return;

    const scale = 5.0;
    const breath = 1.5;
    const rotSpeed = 0.5;
    const morph = 4.0;
    const time = elapsedTime;

    for (let i = 0; i < breathCount; i++) {
      const u = i * 0.0234 * Math.PI * 2.0;
      const v = i * 0.00185 * Math.PI * 2.0;

      let x = Math.cos(u) * Math.cos(v);
      let y = Math.sin(u) * Math.cos(v);
      let z = Math.cos(u * morph) * Math.sin(v);
      let w = Math.sin(u * morph) * Math.sin(v);

      const cubeFactor = Math.sin(time * 0.5) * 0.5 + 0.5;
      x = x + cubeFactor * (x * x * x - x);
      y = y + cubeFactor * (y * y * y - y);
      z = z + cubeFactor * (z * z * z - z);
      w = w + cubeFactor * (w * w * w - w);

      const t1 = time * rotSpeed;
      const t2 = time * rotSpeed * 1.33;

      const xRot = x * Math.cos(t1) - w * Math.sin(t1);
      const wRot = x * Math.sin(t1) + w * Math.cos(t1);

      const yRot = y * Math.cos(t2) - z * Math.sin(t2);
      const zRot = y * Math.sin(t2) + z * Math.cos(t2);

      const wBreathe = wRot + Math.sin(time * breath) * 0.3;

      const projDist = 2.5;
      const wDenom = Math.max(0.01, projDist - wBreathe);
      const projScale = scale / wDenom;

      breathTarget.set(xRot * projScale, yRot * projScale, zRot * projScale);

      breathPositions[i].lerp(breathTarget, 0.1);
      breathDummy.position.copy(breathPositions[i]);
      breathDummy.lookAt(0, 0, 0);
      breathDummy.updateMatrix();

      breathMesh.setMatrixAt(i, breathDummy.matrix);
    }
    breathMesh.instanceMatrix.needsUpdate = true;
  }

  return {
    blueprint: { mesh: breathMesh, mat: bpMat, z: zPos },
    update
  };
}
