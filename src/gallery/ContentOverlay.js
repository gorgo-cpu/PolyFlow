import { CHECKPOINTS } from './checkpointConfig.js';
import gsap from 'gsap';
import { prefersReducedMotion } from '../utils/device.js';
import { trapFocus } from '../utils/focusTrap.js';

/**
 * ContentOverlay
 * Full-viewport overlay that fetches and displays content from static HTML pages.
 * Opens with a depth-zoom animation originating from the 3D object's screen position.
 */
export class ContentOverlay {
  constructor(lenis, checkpointManager, camera) {
    this.lenis = lenis;
    this.checkpointManager = checkpointManager;
    this.camera = camera;

    this.isOpen = false;
    this._cache = new Map();
    this._timeline = null;
    this._releaseFocus = null;

    // DOM refs
    this.overlay = document.getElementById('content-overlay');
    this.backdrop = this.overlay.querySelector('.content-overlay__backdrop');
    this.panel = this.overlay.querySelector('.content-overlay__panel');
    this.closeBtn = this.overlay.querySelector('.content-overlay__close');
    this.contentEl = this.overlay.querySelector('.content-overlay__content');
    this.canvas = document.getElementById('webgl-canvas');

    // Bind
    this._onClose = this._onClose.bind(this);
    this._onBackdropClick = this._onBackdropClick.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);

    // Listeners
    this.closeBtn.addEventListener('click', this._onClose);
    this.backdrop.addEventListener('click', this._onBackdropClick);
    document.addEventListener('keydown', this._onKeyDown);
  }

  /**
   * Open the overlay for a given checkpoint index.
   * screenOrigin: { x, y } in viewport pixels — the 2D position of the 3D object.
   */
  open(checkpointIndex, screenOrigin) {
    const checkpoint = CHECKPOINTS[checkpointIndex];
    if (!checkpoint || !checkpoint.interactive || !checkpoint.page) return;
    if (this.isOpen) return;

    this.isOpen = true;
    this.checkpointManager.isOverlayOpen = true;

    // Set transform-origin to the object's screen position for depth-zoom effect
    if (screenOrigin) {
      this.panel.style.transformOrigin = `${screenOrigin.x}px ${screenOrigin.y}px`;
    } else {
      this.panel.style.transformOrigin = '50% 50%';
    }

    // Stop scroll
    this.lenis.stop();

    // Show overlay
    this.overlay.classList.add('is-open');

    // Blur the 3D canvas (CSS transition handles the animation)
    this.canvas.classList.add('is-blurred');

    // Animate in
    gsap.set(this.backdrop, { opacity: 0 });
    // Reduced motion: fade only, no depth-zoom
    const reduced = prefersReducedMotion();
    gsap.set(this.panel, { scale: reduced ? 1 : 0, opacity: 0 });

    this._timeline = gsap.timeline();
    this._timeline
      .to(this.backdrop, { opacity: 1, duration: 0.35, ease: 'power2.out' }, 0)
      .to(this.panel, { scale: 1, opacity: 1, duration: reduced ? 0.2 : 0.5, ease: reduced ? 'none' : 'back.out(1.2)' }, 0.05);

    // Load content
    this._loadContent(checkpoint.page);

    // Keep keyboard focus inside the panel; release restores it to the [ EXPLORE ] trigger
    this._releaseFocus = trapFocus(this.panel);
    requestAnimationFrame(() => this.closeBtn.focus());
  }

  /**
   * Close the overlay with reverse animation.
   */
  close() {
    if (!this.isOpen) return;

    this._releaseFocus?.();
    this._releaseFocus = null;

    this._timeline = gsap.timeline({
      onComplete: () => {
        this.overlay.classList.remove('is-open');
        this.canvas.classList.remove('is-blurred');
        this.isOpen = false;
        this.checkpointManager.isOverlayOpen = false;
        this.lenis.start();
      },
    });

    this._timeline
      .to(this.panel, { scale: prefersReducedMotion() ? 1 : 0, opacity: 0, duration: 0.3, ease: 'power2.in' }, 0)
      .to(this.backdrop, { opacity: 0, duration: 0.3, ease: 'power2.in' }, 0);
  }

  /**
   * Fetch page content, parse, cache, and inject into the overlay.
   */
  async _loadContent(url) {
    // Check cache first
    if (this._cache.has(url)) {
      this.contentEl.innerHTML = this._cache.get(url);
      this._interceptLinks();
      return;
    }

    // Show loading state
    this.contentEl.innerHTML = '<p style="color: rgba(232,228,224,0.4); font-size: 0.8rem; letter-spacing: 0.1em; text-transform: uppercase;">Loading...</p>';

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${url}`);

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const main = doc.querySelector('main.page');

      if (main) {
        const content = main.innerHTML;
        this._cache.set(url, content);
        this.contentEl.innerHTML = content;
        this._interceptLinks();
      } else {
        this.contentEl.innerHTML = '<p style="color: rgba(232,228,224,0.5);">Content could not be loaded.</p>';
      }
    } catch (err) {
      console.error('ContentOverlay fetch error:', err);
      this.contentEl.innerHTML = '<p style="color: rgba(232,228,224,0.5);">Content could not be loaded.</p>';
    }
  }

  /**
   * Intercept internal links in loaded content.
   * If a link matches another checkpoint's page, navigate to that checkpoint instead.
   */
  _interceptLinks() {
    const links = this.contentEl.querySelectorAll('a[href]');
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const href = link.getAttribute('href');

      // Check if this link matches a checkpoint page
      const targetCheckpoint = CHECKPOINTS.find((cp) => {
        if (!cp.page) return false;
        // Match /about/ or /about/index.html patterns
        const pagePath = cp.page.replace('/index.html', '/');
        return href === pagePath || href === cp.page;
      });

      if (targetCheckpoint) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          this.close();
          // Wait for close animation, then navigate
          setTimeout(() => {
            this.checkpointManager.snapTo(targetCheckpoint.index);
          }, 400);
        });
      }

      // External links: open in new tab
      if (href.startsWith('http') || href.startsWith('mailto:')) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    }
  }

  _onClose() {
    this.close();
  }

  _onBackdropClick(e) {
    if (e.target === this.backdrop) {
      this.close();
    }
  }

  _onKeyDown(e) {
    if (e.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }

  dispose() {
    this.closeBtn.removeEventListener('click', this._onClose);
    this.backdrop.removeEventListener('click', this._onBackdropClick);
    document.removeEventListener('keydown', this._onKeyDown);
    this._cache.clear();
  }
}
