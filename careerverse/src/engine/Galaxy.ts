import { Application, Container, Graphics, Sprite, Text, TextStyle, Texture } from 'pixi.js';
import { Camera } from './Camera';
import { Starfield } from './Starfield';
import { StarNodes } from './StarNodes';
import { Constellations } from './Constellations';
import { InputController } from './input';
import { getStarTextures } from './textures';
import { GALAXY_DATA } from '../data/occupations';
import { RIASEC } from '../data/riasec';
import { VISUAL, CAMERA, MOTION } from '../config';
import type { Galaxy as GalaxyData } from '../types';

export interface GalaxyCallbacks {
  onPick: (id: string | null) => void;
  onHoverChange: (id: string | null) => void;
  onReady?: () => void;
  onActivity?: () => void;
}

export interface CameraState {
  s: number;
  tx: number;
  ty: number;
  width: number;
  height: number;
  center: { x: number; y: number };
  rect: { minX: number; minY: number; maxX: number; maxY: number };
}

export class Galaxy {
  readonly data: GalaxyData = GALAXY_DATA;
  private app!: Application;
  private camera = new Camera();
  private starfield!: Starfield;
  private nodes!: StarNodes;
  private constellations!: Constellations;
  private input!: InputController;

  private world = new Container();
  private nebula = new Container();
  private regionLabels = new Container();
  private trail = new Graphics();
  private trailPts: { x: number; y: number }[] = [];
  private vignette!: Sprite;

  private hoverId: string | null = null;
  private selectedId: string | null = null;
  private dim = false;
  private cb!: GalaxyCallbacks;
  private destroyed = false;

  async init(container: HTMLElement, cb: GalaxyCallbacks) {
    this.cb = cb;
    this.app = new Application();
    await this.app.init({
      resizeTo: container,
      background: VISUAL.BG_TOP,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      preference: 'webgl',
    });
    // guard against React StrictMode unmounting mid-init
    if (this.destroyed) {
      try {
        this.app.destroy(true);
      } catch {
        /* ignore */
      }
      return;
    }
    const canvas = this.app.canvas as HTMLCanvasElement;
    canvas.style.touchAction = 'none';
    canvas.style.display = 'block';
    container.appendChild(canvas);

    this.camera.setBounds(this.data);
    this.camera.setViewport(this.app.screen.width, this.app.screen.height);

    getStarTextures(); // warm cache
    this.buildBackdrop();
    this.buildNebula();
    this.buildRegions();

    this.starfield = new Starfield();
    this.constellations = new Constellations(this.camera);
    this.nodes = new StarNodes(this.data.stars, this.camera);

    // layer order (back → front)
    this.app.stage.addChild(this.vignette);
    this.app.stage.addChild(this.starfield.far);
    this.app.stage.addChild(this.starfield.near);
    this.app.stage.addChild(this.world);
    this.world.addChild(this.nebula);
    this.world.addChild(this.regionLabels);
    this.world.addChild(this.trail);
    this.world.addChild(this.nodes.glowLayer);
    this.world.addChild(this.constellations.container);
    this.world.addChild(this.nodes.sunLayer);
    this.world.addChild(this.nodes.coreLayer);
    this.world.addChild(this.nodes.labelLayer);

    this.camera.snapHome();

    this.input = new InputController(canvas, this.camera, {
      hitTest: (x, y) => this.nodes.hitTest(x, y),
      onPick: (id) => this.cb.onPick(id),
      onHover: (id) => this.applyHover(id),
      onActivity: () => this.cb.onActivity?.(),
    });
    this.input.attach();

    this.app.ticker.add((ticker) => this.frame(ticker.deltaMS));
    this.cb.onReady?.();
  }

  private frame(dtMs: number) {
    if (this.destroyed) return;
    const now = performance.now();
    this.camera.setViewport(this.app.screen.width, this.app.screen.height);
    this.camera.update(dtMs);

    this.world.position.set(this.camera.tx, this.camera.ty);
    this.world.scale.set(this.camera.s);

    this.starfield.applyParallax(this.camera.s, this.camera.tx, this.camera.ty);
    this.starfield.update(now);
    this.nodes.update(dtMs, now);
    this.constellations.update(dtMs, now);
    this.drawTrail();
    this.updateRegionFade();

    // keep the vignette covering the screen
    this.vignette.width = this.app.screen.width;
    this.vignette.height = this.app.screen.height;
  }

  /* ── backdrop, nebula, region labels ────────────────────────────────── */
  private buildBackdrop() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    // vertical navy gradient
    const lin = ctx.createLinearGradient(0, 0, 0, size);
    lin.addColorStop(0, hex(VISUAL.BG_TOP));
    lin.addColorStop(1, hex(VISUAL.BG_BOTTOM));
    ctx.fillStyle = lin;
    ctx.fillRect(0, 0, size, size);
    // corner vignette
    const rad = ctx.createRadialGradient(size / 2, size / 2, size * 0.2, size / 2, size / 2, size * 0.72);
    rad.addColorStop(0, 'rgba(0,0,0,0)');
    rad.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, size, size);
    this.vignette = new Sprite(Texture.from(canvas));
    this.vignette.width = this.app.screen.width;
    this.vignette.height = this.app.screen.height;
  }

  private buildNebula() {
    const tex = getStarTextures();
    for (const region of this.data.regions) {
      const meta = RIASEC[region.type];
      // a couple of offset blobs per region for an organic cloud
      for (let i = 0; i < 2; i++) {
        const s = new Sprite(tex.nebula);
        s.anchor.set(0.5);
        const jitter = 280;
        s.position.set(
          region.cx * 0.82 + (Math.random() * 2 - 1) * jitter,
          region.cy * 0.82 + (Math.random() * 2 - 1) * jitter,
        );
        const r = 1500 + Math.random() * 700;
        s.scale.set((r * 2) / 512);
        s.tint = meta.color;
        s.alpha = VISUAL.NEBULA_ALPHA * (i === 0 ? 0.16 : 0.1);
        s.blendMode = 'add';
        this.nebula.addChild(s);
      }
    }
  }

  private buildRegions() {
    for (const region of this.data.regions) {
      const meta = RIASEC[region.type];
      const style = new TextStyle({
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 64,
        fontWeight: '700',
        fill: meta.css,
        letterSpacing: 8,
        align: 'center',
      });
      const t = new Text({ text: meta.name.toUpperCase(), style });
      t.anchor.set(0.5);
      t.position.set(region.cx, region.cy);
      t.alpha = 0.16;
      this.regionLabels.addChild(t);
    }
  }

  private updateRegionFade() {
    const s = this.camera.s;
    const t = Math.max(0, Math.min(1, (1.2 - s) / (1.2 - 0.25)));
    const a = 0.05 + 0.16 * t;
    for (const child of this.regionLabels.children) child.alpha = a;
  }

  /* ── public API (driven by React/store) ─────────────────────────────── */
  setSelection(id: string | null, opts: { dim?: boolean; ease?: boolean; focusY?: number } = {}) {
    this.selectedId = id;
    this.dim = opts.dim ?? this.dim;
    const related = new Set<string>();
    if (id) {
      const star = this.data.byId.get(id);
      if (star) {
        for (const n of star.neighbours) related.add(n.id);
        this.constellations.setLinks(
          { x: star.x, y: star.y },
          star.neighbours
            .map((n) => this.data.byId.get(n.id))
            .filter((s): s is NonNullable<typeof s> => !!s)
            .map((s) => ({ x: s.x, y: s.y, color: RIASEC[s.category].color })),
        );
        if (opts.ease) {
          const fy = opts.focusY ?? 0.5 - CAMERA.SELECT_VERTICAL_BIAS;
          this.camera.easeTo(star.x, star.y, CAMERA.SELECT_ZOOM, CAMERA.EASE_TO_DURATION_MS, 0.5, fy);
        }
      }
    } else {
      this.constellations.clear();
    }
    this.nodes.setSelection(id, related, this.dim);
  }

  setDim(dim: boolean) {
    this.dim = dim;
    const related = new Set<string>();
    if (this.selectedId) {
      const star = this.data.byId.get(this.selectedId);
      star?.neighbours.forEach((n) => related.add(n.id));
    }
    this.nodes.setSelection(this.selectedId, related, dim);
  }

  setVisibleIds(ids: Set<string> | null) {
    this.nodes.setVisible(ids);
  }

  /** Faint "journey trail" through the stars you've opened, in order. */
  setTrail(ids: string[]) {
    this.trailPts = ids
      .map((id) => this.data.byId.get(id))
      .filter((s): s is NonNullable<typeof s> => !!s)
      .map((s) => ({ x: s.x, y: s.y }));
  }

  private drawTrail() {
    this.trail.clear();
    if (this.trailPts.length < 2) return;
    const w = 1.1 / this.camera.s;
    this.trail.moveTo(this.trailPts[0].x, this.trailPts[0].y);
    for (let i = 1; i < this.trailPts.length; i++) {
      this.trail.lineTo(this.trailPts[i].x, this.trailPts[i].y);
    }
    this.trail.stroke({ width: w, color: 0x9fb2ff, alpha: 0.16, cap: 'round', join: 'round' });
    for (const p of this.trailPts) {
      this.trail.circle(p.x, p.y, 2.4 / this.camera.s).fill({ color: 0x9fb2ff, alpha: 0.22 });
    }
  }

  /** Glide to a star without changing what's "selected" (used by mini-map etc). */
  flyTo(id: string) {
    const star = this.data.byId.get(id);
    if (star) this.camera.easeTo(star.x, star.y, CAMERA.SELECT_ZOOM, CAMERA.EASE_TO_DURATION_MS);
  }

  /** Glide to centre a world point at the current zoom (mini-map clicks). */
  lookAt(wx: number, wy: number) {
    this.camera.easeTo(wx, wy, this.camera.s, CAMERA.EASE_TO_DURATION_MS);
  }

  home() {
    this.camera.home();
  }

  zoomInButton() {
    this.camera.zoomBy(CAMERA.BUTTON_ZOOM_FACTOR, this.app.screen.width / 2, this.app.screen.height / 2);
  }
  zoomOutButton() {
    this.camera.zoomBy(1 / CAMERA.BUTTON_ZOOM_FACTOR, this.app.screen.width / 2, this.app.screen.height / 2);
  }

  keyPan(x: number, y: number) {
    this.camera.setKeyVector(x, y);
  }
  keyZoom(inward: boolean) {
    const f = inward ? CAMERA.BUTTON_ZOOM_FACTOR : 1 / CAMERA.BUTTON_ZOOM_FACTOR;
    this.camera.zoomBy(f, this.app.screen.width / 2, this.app.screen.height / 2);
  }

  setReducedMotion(on: boolean) {
    MOTION.reduced = on;
  }

  private applyHover(id: string | null) {
    if (id === this.hoverId) return;
    this.hoverId = id;
    this.nodes.setHover(id);
    this.cb.onHoverChange(id);
  }

  getCameraState(): CameraState {
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const tl = this.camera.screenToWorld(0, 0);
    const br = this.camera.screenToWorld(w, h);
    const center = this.camera.screenToWorld(w / 2, h / 2);
    return {
      s: this.camera.s,
      tx: this.camera.tx,
      ty: this.camera.ty,
      width: w,
      height: h,
      center,
      rect: { minX: tl.x, minY: tl.y, maxX: br.x, maxY: br.y },
    };
  }

  /** world → screen, for positioning DOM overlays on stars. */
  worldToScreen(x: number, y: number) {
    return this.camera.worldToScreen(x, y);
  }

  destroy() {
    this.destroyed = true;
    try {
      this.input?.detach();
      this.app?.destroy(true, { children: true });
    } catch {
      /* ignore double-destroy / mid-init teardown */
    }
  }
}

function hex(n: number) {
  return '#' + n.toString(16).padStart(6, '0');
}
