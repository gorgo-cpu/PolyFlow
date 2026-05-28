import gsap from 'gsap';

/**
 * GalleryNavigation
 * Arrow buttons (desktop) and swipe (mobile) to yaw the camera 90° left/right
 * toward a nearby object. Exposes `orbitAngle` (radians) — applied via sin/cos
 * to controls.target in tick().
 *
 * State machine:
 *   center (0) → press toward object side → 90° that direction
 *   90° left/right → press opposite arrow → back to center
 *   Already at 90° → pressing same direction does nothing
 */
const HALF_PI = Math.PI * 0.5;

export class GalleryNavigation {
  constructor(checkpointManager, camera, isMobile) {
    this.checkpointManager = checkpointManager;
    this.camera = camera;
    this.isMobile = isMobile;

    // Current orbit angle in radians: 0 = forward, -HALF_PI = left, +HALF_PI = right
    this.orbitAngle = 0;
    // Target angle (for state tracking)
    this._targetAngle = 0;
    this.isNavigating = false;

    // DOM refs
    this.prevBtn = document.querySelector('.gallery-nav--prev');
    this.nextBtn = document.querySelector('.gallery-nav--next');

    // Bind
    this._onLeft = this._onLeft.bind(this);
    this._onRight = this._onRight.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);

    // Desktop: arrow buttons
    this.prevBtn.addEventListener('click', this._onLeft);
    this.nextBtn.addEventListener('click', this._onRight);

    // Keyboard
    document.addEventListener('keydown', this._onKeyDown);

    // Mobile: swipe
    if (this.isMobile) {
      this._touchStartX = 0;
      this._touchStartY = 0;
      this._onTouchStart = this._onTouchStart.bind(this);
      this._onTouchEnd = this._onTouchEnd.bind(this);
      document.addEventListener('touchstart', this._onTouchStart, { passive: true });
      document.addEventListener('touchend', this._onTouchEnd, { passive: true });
    }

    this._tween = null;
  }

  _onLeft() {
    if (this.checkpointManager.isOverlayOpen) return;
    if (!this.checkpointManager.isNearCheckpoint) return;

    if (this._targetAngle > 0) {
      // At right → return to center
      this._orbitTo(0);
    } else if (this._targetAngle === 0) {
      // At center → go left
      this._orbitTo(-HALF_PI);
    }
    // Already at left → do nothing
  }

  _onRight() {
    if (this.checkpointManager.isOverlayOpen) return;
    if (!this.checkpointManager.isNearCheckpoint) return;

    if (this._targetAngle < 0) {
      // At left → return to center
      this._orbitTo(0);
    } else if (this._targetAngle === 0) {
      // At center → go right
      this._orbitTo(HALF_PI);
    }
    // Already at right → do nothing
  }

  _onKeyDown(e) {
    if (this.checkpointManager.isOverlayOpen) return;
    if (!this.checkpointManager.isNearCheckpoint) return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this._onLeft();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      this._onRight();
    }
  }

  /**
   * Animate orbitAngle to target radians.
   */
  _orbitTo(angle) {
    this._targetAngle = angle;
    this.isNavigating = true;

    if (this._tween) this._tween.kill();

    this._tween = gsap.to(this, {
      orbitAngle: angle,
      duration: 0.8,
      ease: 'power2.inOut',
      onComplete: () => {
        this.isNavigating = angle !== 0;
      },
    });
  }

  /**
   * Reset orbit to center (called when user scrolls away from checkpoint).
   */
  resetOrbit() {
    if (this._targetAngle === 0 && this.orbitAngle === 0) return;
    this._orbitTo(0);
  }

  // Mobile swipe
  _onTouchStart(e) {
    if (e.touches.length !== 1) return;
    this._touchStartX = e.touches[0].clientX;
    this._touchStartY = e.touches[0].clientY;
  }

  _onTouchEnd(e) {
    if (this.checkpointManager.isOverlayOpen) return;
    if (!this.checkpointManager.isNearCheckpoint) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - this._touchStartX;
    const dy = touch.clientY - this._touchStartY;

    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx > 0) {
        this._onLeft();
      } else {
        this._onRight();
      }
    }
  }

  /**
   * Called every frame. Shows/hides nav arrows based on proximity and orbit state.
   */
  update() {
    const near = this.checkpointManager.isNearCheckpoint && !this.checkpointManager.isOverlayOpen;

    if (!near) {
      this.prevBtn.classList.remove('is-visible');
      this.nextBtn.classList.remove('is-visible');
      // Reset orbit when leaving checkpoint proximity
      if (this._targetAngle !== 0 || this.orbitAngle !== 0) {
        this.resetOrbit();
      }
      return;
    }

    const cp = this.checkpointManager.getActive();
    if (!cp) return;

    // Determine which arrows to show based on orbit state and object side
    if (this._targetAngle === 0) {
      // At center: show arrow toward the object's side
      if (cp.side === 'left') {
        this.prevBtn.classList.add('is-visible');
        this.nextBtn.classList.remove('is-visible');
      } else {
        this.prevBtn.classList.remove('is-visible');
        this.nextBtn.classList.add('is-visible');
      }
    } else if (this._targetAngle < 0) {
      // At 90° left: show right arrow to return
      this.prevBtn.classList.remove('is-visible');
      this.nextBtn.classList.add('is-visible');
    } else {
      // At 90° right: show left arrow to return
      this.prevBtn.classList.add('is-visible');
      this.nextBtn.classList.remove('is-visible');
    }
  }

  dispose() {
    this.prevBtn.removeEventListener('click', this._onLeft);
    this.nextBtn.removeEventListener('click', this._onRight);
    document.removeEventListener('keydown', this._onKeyDown);
    if (this.isMobile) {
      document.removeEventListener('touchstart', this._onTouchStart);
      document.removeEventListener('touchend', this._onTouchEnd);
    }
    if (this._tween) this._tween.kill();
  }
}
