import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { sizes } from './Sizes.js';

export function createComposer({ renderer, scene, camera, isMobileDevice }) {
  const renderTarget = new THREE.WebGLRenderTarget(sizes.width, sizes.height, {
    samples: renderer.getPixelRatio() === 1 ? 2 : 0, // Anti-aliasing if supported
  });

  const composer = new EffectComposer(renderer, renderTarget);
  composer.setSize(sizes.width, sizes.height);
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(sizes.width, sizes.height),
    0.5,   // Strength — softened from 0.8 to 0.5
    0.1,   // Radius — tighter glow
    0.5    // Threshold
  );
  composer.addPass(bloomPass);

  // noise intensity, scanline intensity, scanline count, grayscale
  const filmPass = new FilmPass(0.35, 0.0, 0, false);
  composer.addPass(filmPass);

  const rgbShiftPass = new ShaderPass(RGBShiftShader);
  rgbShiftPass.uniforms['amount'].value = 0.0008; // Extremely subtle to prevent edge blur
  composer.addPass(rgbShiftPass);

  composer.addPass(new OutputPass());

  // Mobile performance tier (thermal/battery override)
  // Bloom needs no override: UnrealBloomPass sizes its mip chain from the composer, already at half resolution
  if (isMobileDevice) {
    renderer.setPixelRatio(1);
    composer.setPixelRatio(1);
    // Kill the two most expensive extra passes — saves 2 full-screen GPU blits per frame
    filmPass.enabled = false;
    rgbShiftPass.enabled = false;
  }

  return { composer, bloomPass, filmPass, rgbShiftPass };
}
