import WebGL from 'three/addons/capabilities/WebGL.js';

export function isWebGLSupported() {
  return WebGL.isWebGLAvailable();
}

// No-WebGL path: drop the loader and canvas, reveal the static navigation to every content page
export function showWebGLFallback() {
  document.querySelector('.loader-overlay')?.remove();
  document.getElementById('webgl-canvas')?.remove();
  document.getElementById('webgl-fallback')?.classList.add('is-visible');
}

// iOS Safari can drop the GL context under memory pressure (e.g. a backgrounded tab).
// preventDefault() allows the browser to restore it; three.js re-uploads resources on restore.
export function watchContextLoss(canvas, onChange) {
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    onChange(true);
  });
  canvas.addEventListener('webglcontextrestored', () => onChange(false));
}
