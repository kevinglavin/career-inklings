import { Texture } from 'pixi.js';

/**
 * All star visuals are tinted white radial-gradient sprites, so the GPU can
 * batch thousands of them in one draw call. We bake a few gradients to canvases
 * once and reuse them everywhere.
 */

function radial(
  size: number,
  stops: [number, string][],
): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [stop, color] of stops) g.addColorStop(stop, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return Texture.from(canvas);
}

export interface StarTextures {
  glow: Texture;     // broad, soft halo
  core: Texture;     // tight bright centre
  ring: Texture;     // hollow ring for the selected sun
  nebula: Texture;   // huge soft blob for background clouds
  fieldStar: Texture; // tiny dot for the deep field
}

let cached: StarTextures | null = null;

export function getStarTextures(): StarTextures {
  if (cached) return cached;
  cached = {
    glow: radial(160, [
      [0, 'rgba(255,255,255,0.85)'],
      [0.25, 'rgba(255,255,255,0.35)'],
      [0.6, 'rgba(255,255,255,0.08)'],
      [1, 'rgba(255,255,255,0)'],
    ]),
    core: radial(128, [
      [0, 'rgba(255,255,255,1)'],
      [0.28, 'rgba(255,255,255,0.95)'],
      [0.5, 'rgba(255,255,255,0.45)'],
      [0.8, 'rgba(255,255,255,0.08)'],
      [1, 'rgba(255,255,255,0)'],
    ]),
    ring: makeRing(160),
    nebula: radial(512, [
      [0, 'rgba(255,255,255,0.55)'],
      [0.4, 'rgba(255,255,255,0.22)'],
      [0.75, 'rgba(255,255,255,0.05)'],
      [1, 'rgba(255,255,255,0)'],
    ]),
    fieldStar: radial(32, [
      [0, 'rgba(255,255,255,1)'],
      [0.4, 'rgba(255,255,255,0.7)'],
      [1, 'rgba(255,255,255,0)'],
    ]),
  };
  return cached;
}

function makeRing(size: number): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const r = size / 2;
  const g = ctx.createRadialGradient(r, r, r * 0.62, r, r, r);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.5)');
  g.addColorStop(0.7, 'rgba(255,255,255,0.0)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return Texture.from(canvas);
}
