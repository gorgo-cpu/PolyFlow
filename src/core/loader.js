import * as THREE from 'three';
import gsap from 'gsap';

export function createLoadingManager() {
  const progressBar = document.querySelector('.loader-progress-bar');
  const manager = new THREE.LoadingManager();

  let resolveModelLoad;
  const modelLoadedPromise = new Promise(resolve => { resolveModelLoad = resolve; });

  manager.onProgress = (url, itemsLoaded, itemsTotal) => {
    const progressRatio = itemsLoaded / itemsTotal;
    gsap.to(progressBar, {
      scaleX: progressRatio,
      duration: 0.3,
      ease: 'power1.out'
    });
  };

  manager.onLoad = () => resolveModelLoad();

  manager.onError = (url) => {
    console.error('Asset failed to load:', url);
    resolveModelLoad();
  };

  // Dismiss loader after 10s even if model fails to load
  setTimeout(() => resolveModelLoad(), 10000);

  return { manager, modelLoadedPromise };
}

export function playSignatureAnimation() {
  const loaderSignature = document.querySelector('.loader-signature');
  const signaturePath = document.querySelector('.signature-path');
  const progressContainer = document.querySelector('.loader-progress-container');
  if (!signaturePath) return;

  const pathLength = signaturePath.getTotalLength();
  gsap.set(signaturePath, { strokeDasharray: pathLength, strokeDashoffset: pathLength });
  gsap.set(loaderSignature, { opacity: 1 });
  gsap.set(progressContainer, { opacity: 1 });

  // Draw the signature over 2.5 seconds
  gsap.to(signaturePath, {
    strokeDashoffset: 0,
    duration: 2.5,
    ease: 'power2.inOut'
  });
}

export function dismissLoader() {
  gsap.to('.loader-overlay', {
    yPercent: -100,
    duration: 1.2,
    ease: 'power3.inOut'
  });
}
