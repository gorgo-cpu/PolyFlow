import { CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

const MAILTO_HREF = 'mailto:clients.polyflow@gmail.com?subject=%5B%20BLUEPRINT%20REQUEST%20%5D&body=NAME%3A%20%0ACOMPANY%3A%20%0ABUDGET%3A%20%0A%0AMESSAGE%3A%20';

export function createContentCards(scene, openContactModal) {
  const cssObjects = [];

  const cardElements = [
    { el: document.querySelector('.state-void'),         z: -10 },
    { el: document.querySelector('.state-architecture'), z: -60 },
    { el: document.querySelector('.state-bridge'),       z: -120 },
    { el: document.querySelector('.state-summons'),      z: -180 }
  ];

  cardElements.forEach(data => {
    if (!data.el) return;

    const cssObj = new CSS3DObject(data.el);
    cssObj.scale.set(0.015, 0.015, 0.015);
    cssObj.position.set(0, 0, data.z);
    scene.add(cssObj);

    cssObjects.push({
      obj: cssObj,
      dom: data.el,
      z: data.z,
      inners: Array.from(data.el.querySelectorAll('.line-inner'))
    });

    const button = data.el.querySelector('.cta-button');
    if (!button) return;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      const isMobileNow = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
      if (isMobileNow) {
        window.location.href = MAILTO_HREF;
      } else {
        openContactModal();
      }
    });
  });

  // Reveal the wrapper now that CSS3D has reparented every section into its overlay layer.
  // Done after the loop so all four sections are detached from .page-wrapper before it becomes visible.
  document.querySelector('.page-wrapper')?.classList.add('is-mounted');

  return cssObjects;
}
