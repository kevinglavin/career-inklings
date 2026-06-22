import { Container, Graphics, Sprite } from 'pixi.js';
import { CONSTELLATION, MOTION } from '../config';
import { getStarTextures } from './textures';
import type { Camera } from './Camera';

interface Link {
  fx: number;
  fy: number;
  tx: number;
  ty: number;
  cx: number; // bezier control point
  cy: number;
  color: number;
}

function bezier(l: Link, t: number) {
  const mt = 1 - t;
  const x = mt * mt * l.fx + 2 * mt * t * l.cx + t * t * l.tx;
  const y = mt * mt * l.fy + 2 * mt * t * l.cy + t * t * l.ty;
  return { x, y };
}

/**
 * Thin constellation lines from the selected star to its neighbours, drawn in
 * world space but with a constant on-screen width, plus particles that drift
 * outward to evoke "travel" toward related careers. Lines grow out on select.
 */
export class Constellations {
  readonly container = new Container();
  private g = new Graphics();
  private links: Link[] = [];
  private particles: Sprite[] = [];
  private progress = 0;

  constructor(private camera: Camera) {
    this.container.addChild(this.g);
    const tex = getStarTextures();
    for (let i = 0; i < CONSTELLATION.PARTICLES_PER_LINE * 8; i++) {
      const p = new Sprite(tex.core);
      p.anchor.set(0.5);
      p.visible = false;
      p.blendMode = 'add';
      this.particles.push(p);
      this.container.addChild(p);
    }
  }

  setLinks(from: { x: number; y: number }, tos: { x: number; y: number; color: number }[]) {
    this.links = tos.map((to) => {
      const mx = (from.x + to.x) / 2;
      const my = (from.y + to.y) / 2;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.hypot(dx, dy) || 1;
      // perpendicular bow
      const nx = -dy / len;
      const ny = dx / len;
      const bow = len * CONSTELLATION.LINE_CURVE;
      return {
        fx: from.x,
        fy: from.y,
        tx: to.x,
        ty: to.y,
        cx: mx + nx * bow,
        cy: my + ny * bow,
        color: to.color,
      };
    });
    this.progress = MOTION.reduced ? 1 : 0;
  }

  clear() {
    this.links = [];
    this.g.clear();
    for (const p of this.particles) p.visible = false;
  }

  update(dtMs: number, timeMs: number) {
    if (this.links.length === 0) return;
    if (this.progress < 1) {
      this.progress = Math.min(1, this.progress + dtMs / CONSTELLATION.DRAW_DURATION_MS);
    }
    const width = CONSTELLATION.LINE_WIDTH / this.camera.s;

    // redraw lines (cheap: a handful of short polylines)
    this.g.clear();
    const SEG = 18;
    for (const l of this.links) {
      const pts: { x: number; y: number }[] = [];
      const end = this.progress;
      for (let i = 0; i <= SEG; i++) {
        const t = (i / SEG) * end;
        pts.push(bezier(l, t));
      }
      this.g.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) this.g.lineTo(pts[i].x, pts[i].y);
      this.g.stroke({ width, color: l.color, alpha: CONSTELLATION.LINE_ALPHA, cap: 'round' });
    }

    // particles drifting outward
    const psize = CONSTELLATION.PARTICLE_SIZE / this.camera.s;
    let pi = 0;
    for (const l of this.links) {
      for (let k = 0; k < CONSTELLATION.PARTICLES_PER_LINE; k++) {
        const sprite = this.particles[pi++];
        if (!sprite) continue;
        const offset = k / CONSTELLATION.PARTICLES_PER_LINE;
        let frac = ((timeMs * CONSTELLATION.PARTICLE_SPEED + offset) % 1);
        if (MOTION.reduced) frac = offset; // static dots when motion reduced
        if (frac > this.progress) {
          sprite.visible = false;
          continue;
        }
        const pos = bezier(l, frac);
        sprite.visible = true;
        sprite.position.set(pos.x, pos.y);
        sprite.scale.set((psize * 2) / 128);
        sprite.tint = l.color;
        sprite.alpha = 0.85 * Math.sin(frac * Math.PI); // fade in/out along the path
      }
    }
    for (; pi < this.particles.length; pi++) this.particles[pi].visible = false;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
