import { Container, Sprite, Text, TextStyle } from 'pixi.js';
import type { StarDatum } from '../types';
import { RIASEC } from '../data/riasec';
import { STARS, MOTION } from '../config';
import { getStarTextures } from './textures';
import type { Camera } from './Camera';

const GLOW_TEX = 160;
const CORE_TEX = 128;
const RING_TEX = 160;

interface StarSprite {
  datum: StarDatum;
  glow: Sprite;
  core: Sprite;
  label: Text;
  coreRadius: number;
  glowRadius: number;
  baseGlowAlpha: number;
  // smoothed visual state
  scale: number;
  targetScale: number;
  alpha: number;
  targetAlpha: number;
}

/**
 * The interactive occupation stars: a tinted glow + bright core + (zoom-gated)
 * label each. Hover, selection ("sun"), neighbour-highlight and dimming are all
 * smoothed per frame so nothing pops. Picking is a cheap nearest-star scan.
 */
export class StarNodes {
  readonly glowLayer = new Container();
  readonly coreLayer = new Container();
  readonly labelLayer = new Container();
  readonly sunLayer = new Container(); // rings behind the selected star

  private sprites: StarSprite[] = [];
  private byId = new Map<string, StarSprite>();
  private rings: Sprite[] = [];

  private hoverId: string | null = null;
  private selectedId: string | null = null;
  private relatedIds = new Set<string>();
  private dimOthers = false;
  private visibleIds: Set<string> | null = null; // job-zone filter; null = all visible

  constructor(stars: StarDatum[], private camera: Camera) {
    const tex = getStarTextures();
    this.glowLayer.blendMode = 'add';

    // selected-sun rings
    for (let i = 0; i < STARS.SUN_RING_COUNT; i++) {
      const r = new Sprite(tex.ring);
      r.anchor.set(0.5);
      r.alpha = 0;
      r.blendMode = 'add';
      this.rings.push(r);
      this.sunLayer.addChild(r);
    }

    for (const datum of stars) {
      const coreRadius =
        STARS.CORE_MIN_RADIUS + (STARS.CORE_MAX_RADIUS - STARS.CORE_MIN_RADIUS) * datum.importance;
      const glowRadius = coreRadius * STARS.GLOW_SCALE;
      const color = RIASEC[datum.category].color;

      const glow = new Sprite(tex.glow);
      glow.anchor.set(0.5);
      glow.position.set(datum.x, datum.y);
      glow.scale.set(glowRadius / (GLOW_TEX / 2));
      glow.tint = color;
      glow.blendMode = 'add';
      const baseGlowAlpha = STARS.GLOW_ALPHA * (0.6 + 0.4 * datum.importance);
      glow.alpha = baseGlowAlpha;

      const core = new Sprite(tex.core);
      core.anchor.set(0.5);
      core.position.set(datum.x, datum.y);
      core.scale.set(coreRadius / (CORE_TEX / 2));
      // cores are a brightened tint so they read as light, not paint
      core.tint = mix(color, 0xffffff, 0.55);
      core.blendMode = 'add';

      const label = new Text({
        text: datum.title,
        style: labelStyle(RIASEC[datum.category].css),
      });
      label.anchor.set(0.5, 0);
      label.position.set(datum.x, datum.y);
      label.alpha = 0;
      label.visible = false;

      this.glowLayer.addChild(glow);
      this.coreLayer.addChild(core);
      this.labelLayer.addChild(label);

      const sprite: StarSprite = {
        datum,
        glow,
        core,
        label,
        coreRadius,
        glowRadius,
        baseGlowAlpha,
        scale: 1,
        targetScale: 1,
        alpha: 1,
        targetAlpha: 1,
      };
      this.sprites.push(sprite);
      this.byId.set(datum.id, sprite);
    }
  }

  /** Nearest interactive star to a world point, within a forgiving radius. */
  hitTest(wx: number, wy: number): string | null {
    // generous hit radius: at least ~16 screen px, scaled into world units
    const screenPad = 16 / this.camera.s;
    let best: string | null = null;
    let bestD = Infinity;
    for (const s of this.sprites) {
      if (this.visibleIds && !this.visibleIds.has(s.datum.id)) continue;
      const hit = Math.max(s.coreRadius * s.scale, s.coreRadius + screenPad);
      const dx = wx - s.datum.x;
      const dy = wy - s.datum.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < hit * hit && d2 < bestD) {
        bestD = d2;
        best = s.datum.id;
      }
    }
    return best;
  }

  setHover(id: string | null) {
    this.hoverId = id;
  }

  setSelection(selectedId: string | null, related: Set<string>, dimOthers: boolean) {
    this.selectedId = selectedId;
    this.relatedIds = related;
    this.dimOthers = dimOthers;
  }

  /** Job-Zone filter: ids to keep fully present; others fade right back. */
  setVisible(ids: Set<string> | null) {
    this.visibleIds = ids;
  }

  getDatum(id: string): StarDatum | undefined {
    return this.byId.get(id)?.datum;
  }

  /** Per-frame smoothing, pulse, label gating. */
  update(dtMs: number, timeMs: number) {
    const s = this.camera.s;
    const tau = STARS.HOVER_TRANSITION_TAU;
    const k = MOTION.reduced ? 1 : 1 - Math.exp(-dtMs / tau);
    const pulse = MOTION.reduced
      ? 1
      : 1 + STARS.SUN_PULSE_AMPLITUDE * Math.sin((timeMs / STARS.SUN_PULSE_PERIOD_MS) * Math.PI * 2);
    const showLabelsAtZoom = s >= STARS.LABEL_VISIBLE_ZOOM;
    const vp = this.camera.viewport;

    for (const sp of this.sprites) {
      const id = sp.datum.id;
      const isSelected = id === this.selectedId;
      const isRelated = this.relatedIds.has(id);
      const isHover = id === this.hoverId;
      const filteredOut = this.visibleIds !== null && !this.visibleIds.has(id);

      // target scale
      let target = 1;
      if (isSelected) target = STARS.SUN_CORE_SCALE * pulse;
      else if (isHover) target = STARS.HOVER_SCALE;
      else if (isRelated) target = 1.12;
      sp.targetScale = target;

      // target alpha (dimming only kicks in once something is actually selected)
      let alpha = 1;
      if (filteredOut) alpha = 0.06;
      else if (this.dimOthers && this.selectedId && !isSelected && !isRelated && !isHover)
        alpha = STARS.DIMMED_ALPHA;
      sp.targetAlpha = alpha;

      sp.scale += (sp.targetScale - sp.scale) * k;
      sp.alpha += (sp.targetAlpha - sp.alpha) * k;

      const glowBoost = isSelected ? STARS.SUN_GLOW_SCALE : isRelated ? 1.25 : 1;
      sp.core.scale.set((sp.coreRadius / (CORE_TEX / 2)) * sp.scale);
      sp.glow.scale.set((sp.glowRadius / (GLOW_TEX / 2)) * (isSelected ? sp.scale : 1) * glowBoost);
      sp.core.alpha = sp.alpha;
      sp.glow.alpha = sp.baseGlowAlpha * sp.alpha * (isSelected ? 1.6 : isRelated ? 1.3 : 1);

      // labels
      const wantLabel =
        !filteredOut &&
        (isSelected ||
          isRelated ||
          isHover ||
          (showLabelsAtZoom && inViewport(sp, this.camera, vp)));
      if (wantLabel) {
        sp.label.visible = true;
        const la = isSelected || isHover ? 1 : isRelated ? 0.92 : 0.7;
        sp.label.alpha += (la * sp.alpha - sp.label.alpha) * k;
        // counter-scale so label stays a constant on-screen size
        const inv = 1 / s;
        sp.label.scale.set(inv);
        sp.label.position.set(sp.datum.x, sp.datum.y + (sp.coreRadius * sp.scale) + 10 * inv);
      } else if (sp.label.visible) {
        sp.label.alpha += (0 - sp.label.alpha) * k;
        if (sp.label.alpha < 0.02) sp.label.visible = false;
      }
    }

    // selected-sun rings
    const sel = this.selectedId ? this.byId.get(this.selectedId) : null;
    if (sel) {
      this.sunLayer.visible = true;
      const baseR = sel.glowRadius * 0.9;
      this.rings.forEach((ring, i) => {
        const rr = baseR * (1.1 + i * 0.55) * pulse;
        ring.position.set(sel.datum.x, sel.datum.y);
        ring.scale.set((rr * 2) / RING_TEX);
        ring.tint = RIASEC[sel.datum.category].color;
        const targetA = (0.32 - i * 0.08) * sel.alpha;
        ring.alpha += (targetA - ring.alpha) * k;
      });
    } else if (this.sunLayer.visible) {
      let anyVisible = false;
      this.rings.forEach((ring) => {
        ring.alpha += (0 - ring.alpha) * k;
        if (ring.alpha > 0.02) anyVisible = true;
      });
      if (!anyVisible) this.sunLayer.visible = false;
    }
  }

  destroy() {
    this.glowLayer.destroy({ children: true });
    this.coreLayer.destroy({ children: true });
    this.labelLayer.destroy({ children: true });
    this.sunLayer.destroy({ children: true });
  }
}

function inViewport(sp: StarSprite, camera: Camera, vp: { width: number; height: number }) {
  const p = camera.worldToScreen(sp.datum.x, sp.datum.y);
  const m = 60;
  return p.x > -m && p.x < vp.width + m && p.y > -m && p.y < vp.height + m;
}

function labelStyle(fill: string) {
  return new TextStyle({
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 15,
    fontWeight: '600',
    fill,
    stroke: { color: 0x05060f, width: 3 },
    align: 'center',
  });
}

/* simple hex colour mix */
function mix(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}
