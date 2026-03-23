/**
 * EventEmitter (Helpers)
 * ──────────────────────
 * Minimal event system used by Sizes and other classes
 * that need to emit/listen for events.
 *
 * API:
 *   emitter.on(event, callback)
 *   emitter.off(event, callback?)
 *   emitter.trigger(event, ...args)
 */

export default class EventEmitter {
  constructor() {
    this.callbacks = {};
  }

  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
    return this;
  }

  off(event, callback) {
    if (!this.callbacks[event]) return this;

    if (callback) {
      this.callbacks[event] = this.callbacks[event].filter(
        (cb) => cb !== callback
      );
    } else {
      delete this.callbacks[event];
    }
    return this;
  }

  trigger(event, ...args) {
    if (!this.callbacks[event]) return this;

    this.callbacks[event].forEach((cb) => cb(...args));
    return this;
  }
}

/**
 * Utility: Clamp a value between min and max.
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Utility: Linear interpolation.
 */
export function lerp(start, end, t) {
  return start + (end - start) * t;
}

/**
 * Utility: Map a value from one range to another.
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}
