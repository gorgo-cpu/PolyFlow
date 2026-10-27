import gsap from 'gsap';
import { trapFocus } from '../utils/focusTrap.js';

export function initContactModal(lenis) {
  const modal         = document.getElementById('contact-modal');
  const modalBackdrop = modal.querySelector('.contact-modal__backdrop');
  const modalPanel    = modal.querySelector('.contact-modal__panel');
  const modalClose    = modal.querySelector('.contact-modal__close');
  let releaseFocus = null;

  function openContactModal() {
    lenis.stop();
    releaseFocus = trapFocus(modalPanel);
    modal.classList.add('is-open');
    gsap.set(modalBackdrop, { opacity: 0 });
    gsap.set(modalPanel,    { scale: 0.94, opacity: 0 });
    gsap.timeline()
      .to(modalBackdrop, { opacity: 1, duration: 0.35, ease: 'power2.out' }, 0)
      .to(modalPanel,    { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.5)' }, 0.05);
    requestAnimationFrame(() => modalClose.focus());
  }

  function closeContactModal() {
    releaseFocus?.();
    releaseFocus = null;
    gsap.timeline({ onComplete: () => { modal.classList.remove('is-open'); } })
      .to(modalPanel,    { scale: 0.94, opacity: 0, duration: 0.3, ease: 'power2.in' }, 0)
      .to(modalBackdrop, { opacity: 0,              duration: 0.3, ease: 'power2.in' }, 0);
    lenis.start();
  }

  modalClose.addEventListener('click', closeContactModal);
  modalBackdrop.addEventListener('click', closeContactModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeContactModal();
  });

  return { openContactModal, closeContactModal };
}
