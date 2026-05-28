import { getIsMobile } from '../utils/device.js';

export function initMobileMenu(lenis) {
  // Desktop: skip everything — no listeners, no DOM lookups beyond an early check.
  if (!getIsMobile()) return;

  const toggle = document.getElementById('mobile-menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  const closers = menu.querySelectorAll('[data-mobile-menu-close]');
  let isOpen = false;

  function open() {
    if (isOpen) return;
    isOpen = true;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    lenis?.stop();
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    lenis?.start();
  }

  toggle.addEventListener('click', open);
  closers.forEach(el => el.addEventListener('click', close));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) close();
  });
}
