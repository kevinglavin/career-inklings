import { CAMERA, MOTION } from '../config';
import type { Galaxy } from '../types';

export interface Viewport {
  width: number;
  height: number;
}

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * The camera is the soul of the feel. `current` (s, tx, ty) is the single
 * source of truth; a world point (wx,wy) renders to screen at
 * (wx*s + tx, wy*s + ty). Different interactions drive `current` differently:
 *   • active drag    → 1:1, no smoothing (zero lag under the finger)
 *   • drag release   → inertia with frame-rate-independent friction
 *   • wheel / pinch  → scale eases toward a target while the cursor/finger
 *                      stays pinned to the same world point
 *   • select / Home  → a timed eased tween that cancels momentum
 * A soft bound keeps the galaxy from ever leaving the screen, so you can't get
 * lost in empty space.
 */
export class Camera {
  s: number = CAMERA.DEFAULT_ZOOM;
  tx = 0;
  ty = 0;

  viewport: Viewport = { width: 1, height: 1 };
  private bounds = { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 };

  // zoom easing
  private targetScale: number = this.s;
  private anchorScreen = { x: 0, y: 0 };
  private anchorWorld = { x: 0, y: 0 };

  // pan inertia (screen px / ms)
  private vx = 0;
  private vy = 0;
  private dragging = false;
  private lastMoveT = 0;

  // keyboard pan accumulator
  private keyVec = { x: 0, y: 0 };

  // programmatic tween
  private tween:
    | null
    | {
        from: { s: number; tx: number; ty: number };
        to: { s: number; tx: number; ty: number };
        t0: number;
        dur: number;
      } = null;

  setBounds(galaxy: Galaxy) {
    this.bounds = galaxy.bounds;
  }

  setViewport(width: number, height: number) {
    this.viewport = { width: Math.max(1, width), height: Math.max(1, height) };
  }

  /* ── coordinate transforms ──────────────────────────────────────────── */
  screenToWorld(sx: number, sy: number) {
    return { x: (sx - this.tx) / this.s, y: (sy - this.ty) / this.s };
  }
  worldToScreen(wx: number, wy: number) {
    return { x: wx * this.s + this.tx, y: wy * this.s + this.ty };
  }

  /* ── panning ────────────────────────────────────────────────────────── */
  beginDrag() {
    this.dragging = true;
    this.tween = null;
    this.vx = 0;
    this.vy = 0;
    this.lastMoveT = performance.now();
  }

  dragBy(dxScreen: number, dyScreen: number) {
    this.tx += dxScreen;
    this.ty += dyScreen;
    const now = performance.now();
    const dt = now - this.lastMoveT;
    if (dt > 0) {
      const instVx = dxScreen / dt;
      const instVy = dyScreen / dt;
      // exponential blend keeps the fling velocity stable against jitter
      this.vx = this.vx * 0.6 + instVx * 0.4;
      this.vy = this.vy * 0.6 + instVy * 0.4;
      this.lastMoveT = now;
    }
    this.clampPan();
  }

  endDrag() {
    this.dragging = false;
    // a deliberate pause before release = no fling
    if (performance.now() - this.lastMoveT > 80 || MOTION.reduced) {
      this.vx = 0;
      this.vy = 0;
    }
  }

  /* ── zooming (pointer-anchored, eased) ──────────────────────────────── */
  /** Multiply zoom by `factor`, keeping the world point under (sx,sy) fixed. */
  zoomBy(factor: number, sx: number, sy: number) {
    this.tween = null;
    const next = clamp(this.targetScale * factor, CAMERA.MIN_ZOOM, CAMERA.MAX_ZOOM);
    if (next === this.targetScale) return;
    // anchor on the live transform so re-anchoring each frame stays exact
    this.anchorScreen = { x: sx, y: sy };
    this.anchorWorld = this.screenToWorld(sx, sy);
    this.targetScale = next;
    if (MOTION.reduced) this.applyZoomImmediate();
  }

  /** Wheel handler — converts deltaY into a clamped zoom factor. */
  wheelZoom(deltaY: number, sx: number, sy: number) {
    const raw = -deltaY * CAMERA.WHEEL_ZOOM_SENSITIVITY;
    const clamped = clamp(raw, -CAMERA.WHEEL_ZOOM_MAX_STEP, CAMERA.WHEEL_ZOOM_MAX_STEP);
    this.zoomBy(1 + clamped, sx, sy);
  }

  private applyZoomImmediate() {
    this.s = this.targetScale;
    this.tx = this.anchorScreen.x - this.anchorWorld.x * this.s;
    this.ty = this.anchorScreen.y - this.anchorWorld.y * this.s;
    this.clampPan();
  }

  /* ── pinch (two-finger): direct, continuous control ─────────────────── */
  pinch(scaleFactor: number, centerX: number, centerY: number, panDx: number, panDy: number) {
    this.tween = null;
    const world = this.screenToWorld(centerX, centerY);
    this.s = clamp(this.s * scaleFactor, CAMERA.MIN_ZOOM, CAMERA.MAX_ZOOM);
    this.targetScale = this.s;
    // keep the pinch midpoint pinned, then add its drift as a pan
    this.tx = centerX - world.x * this.s + panDx;
    this.ty = centerY - world.y * this.s + panDy;
    this.clampPan();
  }

  /* ── keyboard ───────────────────────────────────────────────────────── */
  setKeyVector(x: number, y: number) {
    this.keyVec = { x, y };
    if (x !== 0 || y !== 0) {
      this.tween = null;
      this.vx = 0;
      this.vy = 0;
    }
  }

  /* ── programmatic moves ─────────────────────────────────────────────── */
  /** Glide so that world point (wx,wy) lands at the given screen fraction. */
  easeTo(
    wx: number,
    wy: number,
    scale: number,
    duration = CAMERA.EASE_TO_DURATION_MS,
    screenFracX = 0.5,
    screenFracY = 0.5,
  ) {
    const s = clamp(scale, CAMERA.MIN_ZOOM, CAMERA.MAX_ZOOM);
    const targetTx = this.viewport.width * screenFracX - wx * s;
    const targetTy = this.viewport.height * screenFracY - wy * s;
    this.startTween(s, targetTx, targetTy, duration);
  }

  /** Frame the whole galaxy with margin. */
  home(duration = CAMERA.HOME_DURATION_MS) {
    const { s, tx, ty } = this.frameAllTransform();
    this.startTween(s, tx, ty, duration);
  }

  /** Snap (no animation) — used on first paint. */
  snapHome() {
    const { s, tx, ty } = this.frameAllTransform();
    this.s = s;
    this.targetScale = s;
    this.tx = tx;
    this.ty = ty;
  }

  private frameAllTransform() {
    const { minX, minY, maxX, maxY } = this.bounds;
    const w = maxX - minX;
    const h = maxY - minY;
    const margin = 1.25;
    const sx = this.viewport.width / (w * margin);
    const sy = this.viewport.height / (h * margin);
    const s = clamp(Math.min(sx, sy), CAMERA.MIN_ZOOM, CAMERA.MAX_ZOOM);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    return {
      s,
      tx: this.viewport.width / 2 - cx * s,
      ty: this.viewport.height / 2 - cy * s,
    };
  }

  private startTween(s: number, tx: number, ty: number, dur: number) {
    this.vx = 0;
    this.vy = 0;
    if (MOTION.reduced || dur <= 0) {
      this.s = s;
      this.targetScale = s;
      this.tx = tx;
      this.ty = ty;
      this.clampPan();
      return;
    }
    this.tween = {
      from: { s: this.s, tx: this.tx, ty: this.ty },
      to: { s, tx, ty },
      t0: performance.now(),
      dur,
    };
    this.targetScale = s;
  }

  get isAnimating() {
    return (
      this.tween !== null ||
      Math.abs(this.s - this.targetScale) / this.targetScale > 0.001 ||
      Math.hypot(this.vx, this.vy) > CAMERA.PAN_INERTIA_MIN_SPEED ||
      this.keyVec.x !== 0 ||
      this.keyVec.y !== 0
    );
  }

  /* ── per-frame integrator ───────────────────────────────────────────── */
  update(dtMs: number) {
    const dt = Math.min(dtMs, 50); // guard against tab-switch jumps

    if (this.tween) {
      const p = clamp((performance.now() - this.tween.t0) / this.tween.dur, 0, 1);
      const e = easeInOutCubic(p);
      this.s = lerp(this.tween.from.s, this.tween.to.s, e);
      this.tx = lerp(this.tween.from.tx, this.tween.to.tx, e);
      this.ty = lerp(this.tween.from.ty, this.tween.to.ty, e);
      this.targetScale = this.s;
      if (p >= 1) this.tween = null;
      return;
    }

    // eased zoom — keep the anchor pinned while the scale glides
    const zooming = Math.abs(this.s - this.targetScale) / this.targetScale > 0.001;
    if (zooming) {
      const k = MOTION.reduced ? 1 : 1 - Math.exp(-dt / CAMERA.ZOOM_SMOOTH_TAU);
      this.s = lerp(this.s, this.targetScale, k);
      this.tx = this.anchorScreen.x - this.anchorWorld.x * this.s;
      this.ty = this.anchorScreen.y - this.anchorWorld.y * this.s;
      this.clampPan();
    }

    // keyboard pan
    if (this.keyVec.x !== 0 || this.keyVec.y !== 0) {
      this.tx += this.keyVec.x * CAMERA.KEYBOARD_PAN_SPEED * dt;
      this.ty += this.keyVec.y * CAMERA.KEYBOARD_PAN_SPEED * dt;
      this.clampPan();
    }

    // pan inertia
    if (!this.dragging && Math.hypot(this.vx, this.vy) > CAMERA.PAN_INERTIA_MIN_SPEED) {
      this.tx += this.vx * dt;
      this.ty += this.vy * dt;
      const decay = Math.pow(CAMERA.PAN_INERTIA_FRICTION, dt / 16.6667);
      this.vx *= decay;
      this.vy *= decay;
      if (Math.hypot(this.vx, this.vy) < CAMERA.PAN_INERTIA_MIN_SPEED) {
        this.vx = 0;
        this.vy = 0;
      }
      this.clampPan();
    }
  }

  /* ── soft bound: the galaxy centre region can't leave the screen ────── */
  private clampPan() {
    const { minX, minY, maxX, maxY } = this.bounds;
    const padX = 0.35 * (maxX - minX);
    const padY = 0.35 * (maxY - minY);
    const txLo = this.viewport.width / 2 - this.s * (maxX + padX);
    const txHi = this.viewport.width / 2 - this.s * (minX - padX);
    const tyLo = this.viewport.height / 2 - this.s * (maxY + padY);
    const tyHi = this.viewport.height / 2 - this.s * (minY - padY);

    const clamped = clampRange(this.tx, txLo, txHi);
    if (clamped !== this.tx) {
      this.tx = clamped;
      this.vx = 0;
    }
    const clampedY = clampRange(this.ty, tyLo, tyHi);
    if (clampedY !== this.ty) {
      this.ty = clampedY;
      this.vy = 0;
    }
  }
}

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}
function clampRange(v: number, a: number, b: number) {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return v < lo ? lo : v > hi ? hi : v;
}
