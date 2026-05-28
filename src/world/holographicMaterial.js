import * as THREE from 'three';
import vertexShader from '../shaders/sphere/vertex.glsl';
import fragmentShader from '../shaders/sphere/fragment.glsl';

export function createHolographicMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: new THREE.Uniform(0),
      uColor: new THREE.Uniform(new THREE.Color('#ffffff')),
    }
  });
}
