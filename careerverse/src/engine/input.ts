import { CAMERA } from '../config';
import type { Camera } from './Camera';

export interface InputCallbacks {
  hitTest: (worldX: number, worldY: number) => string | null;
  onPick: (id: string | null) => void;       // tap/click (after drag-threshold check)
  onHover: (id: string | null, screenX: number, screenY: number) => void;
  onActivity: () => void;                     // any interaction (e.g. dismiss onboarding)
}

interface PointerRec {
  x: number;
  y: number;
  type: string;
}

/**
 * Translates raw pointer / wheel / touch events into camera moves and star
 * picks. Dragging always pans the camera (stars never get yanked); a press that
 * stays under the drag threshold is treated as a click/tap and selects a star.
 */
export class InputController {
  private pointers = new Map<number, PointerRec>();
  private start = { x: 0, y: 0 };
  private last = { x: 0, y: 0 };
  private panning = false;
  private maybeClick = false;

  // pinch state
  private pinching = false;
  private pinchDist = 0;
  private pinchMid = { x: 0, y: 0 };

  constructor(
    private canvas: HTMLCanvasElement,
    private camera: Camera,
    private cb: InputCallbacks,
  ) {}

  attach() {
    const c = this.canvas;
    c.addEventListener('pointerdown', this.onDown);
    c.addEventListener('pointermove', this.onMove);
    c.addEventListener('pointerup', this.onUp);
    c.addEventListener('pointercancel', this.onUp);
    c.addEventListener('pointerleave', this.onLeave);
    c.addEventListener('wheel', this.onWheel, { passive: false });
    c.addEventListener('dblclick', this.onDblClick);
  }

  detach() {
    const c = this.canvas;
    c.removeEventListener('pointerdown', this.onDown);
    c.removeEventListener('pointermove', this.onMove);
    c.removeEventListener('pointerup', this.onUp);
    c.removeEventListener('pointercancel', this.onUp);
    c.removeEventListener('pointerleave', this.onLeave);
    c.removeEventListener('wheel', this.onWheel);
    c.removeEventListener('dblclick', this.onDblClick);
  }

  private local(e: PointerEvent | WheelEvent | MouseEvent) {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private onDown = (e: PointerEvent) => {
    this.cb.onActivity();
    const p = this.local(e);
    this.pointers.set(e.pointerId, { x: p.x, y: p.y, type: e.pointerType });
    this.canvas.setPointerCapture(e.pointerId);

    if (this.pointers.size === 2) {
      // begin pinch
      this.panning = false;
      this.maybeClick = false;
      this.pinching = true;
      const [a, b] = [...this.pointers.values()];
      this.pinchDist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      this.pinchMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      return;
    }

    this.start = p;
    this.last = p;
    this.maybeClick = true;
    this.panning = false;
  };

  private onMove = (e: PointerEvent) => {
    const p = this.local(e);

    if (this.pinching && this.pointers.has(e.pointerId)) {
      this.pointers.set(e.pointerId, { x: p.x, y: p.y, type: e.pointerType });
      if (this.pointers.size >= 2) {
        const [a, b] = [...this.pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const scaleFactor = dist / this.pinchDist;
        const panDx = mid.x - this.pinchMid.x;
        const panDy = mid.y - this.pinchMid.y;
        this.camera.pinch(scaleFactor, mid.x, mid.y, panDx, panDy);
        this.pinchDist = dist;
        this.pinchMid = mid;
      }
      return;
    }

    // hovering (mouse/pen only, not while a button is down)
    if (!this.pointers.has(e.pointerId)) {
      if (e.pointerType !== 'touch') {
        const w = this.camera.screenToWorld(p.x, p.y);
        this.cb.onHover(this.cb.hitTest(w.x, w.y), p.x, p.y);
      }
      return;
    }

    // a tracked pointer is moving → drag/pan
    if (!this.panning) {
      const moved = Math.hypot(p.x - this.start.x, p.y - this.start.y);
      if (moved > CAMERA.DRAG_THRESHOLD_PX) {
        this.panning = true;
        this.maybeClick = false;
        this.camera.beginDrag();
        this.last = p; // reset baseline so the pan doesn't jump by the threshold
        this.cb.onHover(null, p.x, p.y);
      }
    }
    if (this.panning) {
      this.camera.dragBy(p.x - this.last.x, p.y - this.last.y);
      this.last = p;
    }
    this.pointers.set(e.pointerId, { x: p.x, y: p.y, type: e.pointerType });
  };

  private onUp = (e: PointerEvent) => {
    const had = this.pointers.delete(e.pointerId);
    try {
      this.canvas.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }

    if (this.pinching) {
      if (this.pointers.size < 2) {
        this.pinching = false;
        // hand control to the remaining finger without a jump
        const remaining = [...this.pointers.values()][0];
        if (remaining) {
          this.start = { x: remaining.x, y: remaining.y };
          this.last = { x: remaining.x, y: remaining.y };
          this.maybeClick = false;
          this.panning = false;
        }
      }
      return;
    }

    if (!had) return;

    if (this.panning) {
      this.camera.endDrag();
      this.panning = false;
    } else if (this.maybeClick) {
      const p = this.local(e);
      const w = this.camera.screenToWorld(p.x, p.y);
      this.cb.onPick(this.cb.hitTest(w.x, w.y));
    }
    this.maybeClick = false;
  };

  private onLeave = () => {
    this.cb.onHover(null, 0, 0);
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.cb.onActivity();
    const p = this.local(e);
    // trackpad pinch arrives as ctrl+wheel; treat as a stronger zoom
    const delta = e.ctrlKey ? e.deltaY * 2.2 : e.deltaY;
    this.camera.wheelZoom(delta, p.x, p.y);
  };

  private onDblClick = (e: MouseEvent) => {
    e.preventDefault();
    const p = this.local(e);
    this.camera.zoomBy(CAMERA.DOUBLECLICK_ZOOM_FACTOR, p.x, p.y);
  };
}
