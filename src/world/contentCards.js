import { CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { isMobileDevice, getIsMobile } from '../utils/device.js';

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
      // Phones/tablets hand off to the native mail app; narrow desktop windows too, as before
      if (isMobileDevice || getIsMobile()) {
        window.location.href = MAILTO_HREF;
      } else {
        openContactModal();
      }
    });
  });

  return cssObjects;
}
