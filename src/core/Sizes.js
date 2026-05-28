export const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

export function attachResize({ camera, renderer, css3dRenderer, composer, bloomPass, filmPass, rgbShiftPass }) {
  window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Crucial iOS fix: dynamically protect pixel ratio during Safari URL bar shifts
    const nowMobile = window.innerWidth <= 768;
    const targetPixelRatio = nowMobile ? 1 : Math.min(window.devicePixelRatio, 2);

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(targetPixelRatio);

    css3dRenderer.setSize(sizes.width, sizes.height);

    composer.setSize(sizes.width, sizes.height);
    composer.setPixelRatio(targetPixelRatio);

    // Reactively toggle expensive passes based on current breakpoint (handles orientation change)
    filmPass.enabled = !nowMobile;
    rgbShiftPass.enabled = !nowMobile;
    bloomPass.resolution.set(
      nowMobile ? sizes.width / 2 : sizes.width,
      nowMobile ? sizes.height / 2 : sizes.height
    );
  });
}
