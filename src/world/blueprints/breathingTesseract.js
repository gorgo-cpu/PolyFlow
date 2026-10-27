import * as THREE from 'three';
import { BLUEPRINT_COLOR } from './constants.js';
import { isMobileDevice } from '../../utils/device.js';

const MORPH = 4.0;

// i=5: Dynamic breathing tesseract — morphs between sphere/cube and projects 4D->3D with a wBreathe wobble.
export function createBreathingTesseract(scene, { xPos, zPos, isMobile }) {
  // Device tier, not viewport width: a landscape phone must not get the desktop count
  const breathCount = isMobileDevice ? 60 : 450;
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

  // 4D Clifford-torus base coordinates (x, y, z, w interleaved), computed once
  const base = new Float32Array(breathCount * 4);
  for (let i = 0; i < breathCount; i++) {
    const u = i * 0.0234 * Math.PI * 2.0;
    const v = i * 0.00185 * Math.PI * 2.0;
    base[i * 4] = Math.cos(u) * Math.cos(v);
    base[i * 4 + 1] = Math.sin(u) * Math.cos(v);
    base[i * 4 + 2] = Math.cos(u * MORPH) * Math.sin(v);
    base[i * 4 + 3] = Math.sin(u * MORPH) * Math.sin(v);
  }

  function update(elapsedTime, currentCameraZ) {
    if (Math.abs(currentCameraZ - breathMesh.position.z) >= 55) return;

    const scale = 5.0;
    const breath = 1.5;
    const rotSpeed = 0.5;
    const time = elapsedTime;

    // Shared by every particle this frame
    const cubeFactor = Math.sin(time * 0.5) * 0.5 + 0.5;
    const t1 = time * rotSpeed;
    const t2 = time * rotSpeed * 1.33;
    const cosT1 = Math.cos(t1), sinT1 = Math.sin(t1);
    const cosT2 = Math.cos(t2), sinT2 = Math.sin(t2);
    const wOffset = Math.sin(time * breath) * 0.3;
    const projDist = 2.5;

    for (let i = 0; i < breathCount; i++) {
      let x = base[i * 4];
      let y = base[i * 4 + 1];
      let z = base[i * 4 + 2];
      let w = base[i * 4 + 3];

      x = x + cubeFactor * (x * x * x - x);
      y = y + cubeFactor * (y * y * y - y);
      z = z + cubeFactor * (z * z * z - z);
      w = w + cubeFactor * (w * w * w - w);

      const xRot = x * cosT1 - w * sinT1;
      const wRot = x * sinT1 + w * cosT1;

      const yRot = y * cosT2 - z * sinT2;
      const zRot = y * sinT2 + z * cosT2;

      const wBreathe = wRot + wOffset;

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
