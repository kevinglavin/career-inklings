import { Container, Sprite } from 'pixi.js';
import { getStarTextures } from './textures';
import { GALAXY, PARALLAX } from '../config';

/* deterministic field so the sky doesn't reshuffle between frames/loads */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Twinkle {
  sprite: Sprite;
  base: number;
  phase: number;
  speed: number;
}

/**
 * Two layers of decorative deep-field stars that pan and zoom *slower* than the
 * foreground, faking depth (Google-Maps-style parallax, not 3D). Non-interactive.
 */
export class Starfield {
  readonly far = new Container();
  readonly near = new Container();
  private twinkles: Twinkle[] = [];

  constructor() {
    const tex = getStarTextures();
    const rng = mulberry32(0xc0ffee);
    const A = GALAXY.FIELD_AREA;

    const make = (layer: Container, count: number, sizeRange: [number, number], alphaRange: [number, number], tint: number) => {
      for (let i = 0; i < count; i++) {
        const s = new Sprite(tex.fieldStar);
        s.anchor.set(0.5);
        s.x = (rng() * 2 - 1) * A;
        s.y = (rng() * 2 - 1) * A;
        const size = sizeRange[0] + rng() * (sizeRange[1] - sizeRange[0]);
        s.scale.set(size);
        const base = alphaRange[0] + rng() * (alphaRange[1] - alphaRange[0]);
        s.alpha = base;
        s.tint = tint;
        layer.addChild(s);
        if (rng() > 0.55) {
          this.twinkles.push({ sprite: s, base, phase: rng() * Math.PI * 2, speed: 0.0006 + rng() * 0.0016 });
        }
      }
    };

    const total = GALAXY.FIELD_STAR_COUNT;
    make(this.far, Math.floor(total * 0.6), [0.18, 0.5], [0.12, 0.4], 0x9fb2ff);
    make(this.near, Math.floor(total * 0.4), [0.3, 0.85], [0.25, 0.7], 0xdfe6ff);
  }

  applyParallax(s: number, tx: number, ty: number) {
    this.far.position.set(tx * PARALLAX.FAR_STARS_FACTOR, ty * PARALLAX.FAR_STARS_FACTOR);
    this.far.scale.set(1 + (s - 1) * PARALLAX.FAR_STARS_FACTOR);
    this.near.position.set(tx * PARALLAX.NEAR_STARS_FACTOR, ty * PARALLAX.NEAR_STARS_FACTOR);
    this.near.scale.set(1 + (s - 1) * PARALLAX.NEAR_STARS_FACTOR);
  }

  update(timeMs: number) {
    for (const t of this.twinkles) {
      t.sprite.alpha = t.base * (0.55 + 0.45 * Math.sin(timeMs * t.speed + t.phase));
    }
  }

  destroy() {
    this.far.destroy({ children: true });
    this.near.destroy({ children: true });
  }
}
