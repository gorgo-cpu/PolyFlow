import { isMobileDevice } from '../utils/device.js';

// Touch devices: iOS Safari's toolbar collapses on the first scroll and fires a stream of
// height-only resizes. Reallocating the renderer + composer targets on each one stalls the GPU,
// and a moving innerHeight shifts the scroll -> camera Z mapping mid-gesture. So touch devices
// size to the *large* viewport (100lvh), which is constant while the toolbar animates; the
// canvas simply extends under the toolbar. Only width/orientation changes trigger a resize.

let lvhProbe = null;

function measureLargeViewportHeight() {
  if (!lvhProbe) {
    lvhProbe = document.createElement('div');
    lvhProbe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100lvh;visibility:hidden;pointer-events:none;';
    document.body.appendChild(lvhProbe);
  }
  const lvh = lvhProbe.offsetHeight;
  // Pre-iOS 15.4 has no lvh unit: fall back to the tallest height currently known
  return lvh > 0 ? lvh : Math.max(window.innerHeight, Math.round(window.visualViewport?.height ?? 0));
}

function readViewport() {
  if (isMobileDevice) {
    return { width: window.innerWidth, height: measureLargeViewportHeight() };
  }
  // visualViewport reflects the area not covered by browser UI; fall back for non-supporting browsers
  const vv = window.visualViewport;
  return {
    width: vv ? Math.round(vv.width) : window.innerWidth,
    height: vv ? Math.round(vv.height) : window.innerHeight,
  };
}

const initial = readViewport();
// width/height: render size. height doubles as the scroll viewport height for the
// scroll -> camera Z mapping (stable on touch devices; see above).
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
    // Toolbar collapse on touch devices lands here with identical values: skip all reallocation
    if (width === sizes.width && height === sizes.height) return;

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
