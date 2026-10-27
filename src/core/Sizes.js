import { isMobileDevice } from '../utils/device.js';

function readViewport() {
  // visualViewport reflects the area NOT covered by iOS Safari's address bar / keyboard.
  // Fall back to window dimensions for non-supporting browsers.
  const vv = window.visualViewport;
  return {
    width: vv ? Math.round(vv.width) : window.innerWidth,
    height: vv ? Math.round(vv.height) : window.innerHeight,
  };
}

const initial = readViewport();
export const sizes = {
  width: initial.width,
  height: initial.height,
};

// Pass enablement is set once in createComposer: the device tier cannot change on rotation.
export function attachResize({ camera, renderer, css3dRenderer, composer }) {
  let rafScheduled = false;

  const apply = () => {
    rafScheduled = false;

    const { width, height } = readViewport();
    sizes.width = width;
    sizes.height = height;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    const targetPixelRatio = isMobileDevice ? 1 : Math.min(window.devicePixelRatio, 2);

    renderer.setSize(width, height);
    renderer.setPixelRatio(targetPixelRatio);

    css3dRenderer.setSize(width, height);

    composer.setSize(width, height);
    composer.setPixelRatio(targetPixelRatio);
  };

  const schedule = () => {
    if (rafScheduled) return;
    rafScheduled = true;
    requestAnimationFrame(apply);
  };

  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', schedule);
  }
}
