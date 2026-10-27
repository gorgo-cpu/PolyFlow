const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Keeps Tab / Shift+Tab cycling inside `container` while a dialog is open, and returns
// focus to whatever opened it on release. Queries focusables per keypress because
// overlay content is injected asynchronously after open.
export function trapFocus(container) {
  const returnTarget = document.activeElement;

  const onKeyDown = (e) => {
    if (e.key !== 'Tab') return;
    const focusables = container.querySelectorAll(FOCUSABLE);
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (e.shiftKey && (active === first || !container.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !container.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  };

  document.addEventListener('keydown', onKeyDown);

  return function release() {
    document.removeEventListener('keydown', onKeyDown);
    if (returnTarget instanceof HTMLElement && document.contains(returnTarget)) {
      returnTarget.focus();
    }
  };
}
