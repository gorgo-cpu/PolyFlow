import { trapFocus } from '../utils/focusTrap.js';

export function initMobileMenu(lenis) {
  // Always bind: the toggle's visibility is a CSS media query that flips on rotation/resize,
  // so a load-time width check would leave a visible but dead button. Idle listeners cost nothing.
  const toggle = document.getElementById('mobile-menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  const panel = menu.querySelector('.mobile-menu__panel') ?? menu;
  const closers = menu.querySelectorAll('[data-mobile-menu-close]');
  let isOpen = false;
  let releaseFocus = null;

  function open() {
    if (isOpen) return;
    isOpen = true;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    lenis?.stop();
    // Keep focus in the panel; release returns it to the toggle
    releaseFocus = trapFocus(panel);
    panel.querySelector('[data-mobile-menu-close]')?.focus();
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    lenis?.start();
    releaseFocus?.();
    releaseFocus = null;
  }

  toggle.addEventListener('click', open);
  closers.forEach(el => el.addEventListener('click', close));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) close();
  });
}
