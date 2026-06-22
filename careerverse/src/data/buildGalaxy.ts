import type {
  Galaxy,
  InterestVector,
  NeighbourLink,
  RawOccupation,
  Riasec,
  RegionDatum,
  StarDatum,
} from '../types';
import { RIASEC_ORDER } from '../types';
import { RIASEC } from './riasec';
import { GALAXY } from '../config';

/* ── deterministic RNG so the galaxy is identical every load ─────────────── */
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
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

/* ── RIASEC regions on Holland's hexagon (adjacent types = correlated) ───── */
export function regionCenters(): Record<Riasec, { x: number; y: number }> {
  const out = {} as Record<Riasec, { x: number; y: number }>;
  RIASEC_ORDER.forEach((type, i) => {
    const angle = (-90 + i * 60) * (Math.PI / 180); // R at top, clockwise
    out[type] = {
      x: Math.cos(angle) * GALAXY.REGION_RING_RADIUS,
      y: Math.sin(angle) * GALAXY.REGION_RING_RADIUS,
    };
  });
  return out;
}

/* ── interest-vector maths ───────────────────────────────────────────────── */
function values(v: InterestVector): number[] {
  return RIASEC_ORDER.map((t) => v[t]);
}

/** Sharpened, normalised weights — dominant type leads, secondaries still pull. */
function interestWeights(v: InterestVector): Record<Riasec, number> {
  const vals = values(v);
  const min = Math.min(...vals);
  const w = {} as Record<Riasec, number>;
  let sum = 0;
  RIASEC_ORDER.forEach((t) => {
    const raw = Math.pow(Math.max(0, v[t] - min) + 0.25, 2.2);
    w[t] = raw;
    sum += raw;
  });
  RIASEC_ORDER.forEach((t) => (w[t] /= sum || 1));
  return w;
}

/** Overall interest intensity → 0–1, drives core size. */
function importanceOf(v: InterestVector): number {
  const vals = values(v).sort((a, b) => b - a);
  const top2 = (vals[0] + vals[1]) / 2; // 1..7
  return Math.max(0, Math.min(1, (top2 - 2.5) / 4.5));
}

/** Top-n interest types by score. */
function topTypes(v: InterestVector, n: number): Riasec[] {
  return [...RIASEC_ORDER].sort((a, b) => v[b] - v[a]).slice(0, n);
}

/** Pearson correlation of two interest profiles → similarity of *shape*. */
function profileSimilarity(a: InterestVector, b: InterestVector): number {
  const av = values(a);
  const bv = values(b);
  const ma = av.reduce((s, x) => s + x, 0) / av.length;
  const mb = bv.reduce((s, x) => s + x, 0) / bv.length;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < av.length; i++) {
    const xa = av[i] - ma;
    const xb = bv[i] - mb;
    num += xa * xb;
    da += xa * xa;
    db += xb * xb;
  }
  const denom = Math.sqrt(da * db);
  const r = denom === 0 ? 0 : num / denom;
  return (r + 1) / 2; // map -1..1 → 0..1
}

const article = (word: string) =>
  /^[aeiou]/i.test(word) ? 'an' : 'a';

/** A genuinely informative sentence for why `dst` sits near `src`. */
function neighbourReason(
  src: RawOccupation,
  dst: RawOccupation,
): { reason: string; shared: Riasec[]; samePrep: boolean } {
  const srcTop = topTypes(src.interests, 3);
  const dstTop = topTypes(dst.interests, 3);
  // Shared interests, ordered by their combined strength across both.
  const shared = srcTop
    .filter((t) => dstTop.includes(t))
    .sort(
      (a, b) =>
        dst.interests[b] + src.interests[b] - (dst.interests[a] + src.interests[a]),
    );

  const samePrep = Math.abs(dst.jobZone - src.jobZone) <= 1;
  const prep = samePrep
    ? `similar preparation (Job Zone ${dst.jobZone})`
    : `${dst.jobZone > src.jobZone ? 'more' : 'less'} preparation (Job Zone ${dst.jobZone} vs ${src.jobZone})`;

  let lead: string;
  if (shared.length >= 2) {
    const a = RIASEC[shared[0]].name;
    const b = RIASEC[shared[1]].name;
    lead = `Shares ${article(a)} strong ${a} pull with ${article(b)} ${b} streak`;
  } else if (shared.length === 1) {
    const a = RIASEC[shared[0]].name;
    lead = `Shares ${article(a)} clear ${a} pull`;
  } else {
    const a = RIASEC[dst.category].name;
    lead = `A nearby ${a} world worth a look`;
  }
  return { reason: `${lead} · ${prep}.`, shared, samePrep };
}

/* ── main builder ────────────────────────────────────────────────────────── */
export function buildGalaxy(raw: RawOccupation[]): Galaxy {
  const centers = regionCenters();

  // 1. Place each star in interest-space: a weighted blend of region centres,
  //    plus deterministic jitter. Pure types land in the outer arms; blended
  //    profiles drift toward the core.
  const placed: StarDatum[] = raw.map((o) => {
    const w = interestWeights(o.interests);
    let x = 0;
    let y = 0;
    RIASEC_ORDER.forEach((t) => {
      x += w[t] * centers[t].x;
      y += w[t] * centers[t].y;
    });
    const rng = mulberry32(hashStr(o.id));
    const jr = GALAXY.REGION_SPREAD * 0.7 * Math.sqrt(rng());
    const ja = rng() * Math.PI * 2;
    x += Math.cos(ja) * jr;
    y += Math.sin(ja) * jr;
    return {
      ...o,
      x,
      y,
      importance: importanceOf(o.interests),
      neighbours: [],
    };
  });

  // 2. Relax overlaps so no two stars sit on top of each other.
  const minSep = GALAXY.MIN_STAR_SEPARATION;
  for (let iter = 0; iter < 9; iter++) {
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i];
        const b = placed[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d = Math.hypot(dx, dy);
        if (d === 0) {
          dx = (i - j) || 1;
          dy = 1;
          d = Math.hypot(dx, dy);
        }
        if (d < minSep) {
          const push = (minSep - d) / 2;
          const ux = dx / d;
          const uy = dy / d;
          a.x -= ux * push;
          a.y -= uy * push;
          b.x += ux * push;
          b.y += uy * push;
        }
      }
    }
  }

  // 3. Resolve neighbours by interest-profile similarity.
  for (const star of placed) {
    const scored = placed
      .filter((o) => o.id !== star.id)
      .map((o) => ({ o, sim: profileSimilarity(star.interests, o.interests) }))
      .sort((a, b) => b.sim - a.sim)
      .slice(0, GALAXY.NEIGHBOUR_COUNT);
    star.neighbours = scored.map(({ o, sim }): NeighbourLink => {
      const { reason, shared, samePrep } = neighbourReason(star, o);
      return { id: o.id, similarity: sim, reason, sharedTypes: shared, samePrep };
    });
  }

  // 4. Region label anchors, pushed a little further out than the stars.
  const regions: RegionDatum[] = RIASEC_ORDER.map((type) => ({
    type,
    cx: centers[type].x * 1.18,
    cy: centers[type].y * 1.18,
    label: RIASEC[type].name,
  }));

  // 5. Bounds (for Home framing + mini-map).
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const s of placed) {
    minX = Math.min(minX, s.x);
    minY = Math.min(minY, s.y);
    maxX = Math.max(maxX, s.x);
    maxY = Math.max(maxY, s.y);
  }

  const byId = new Map(placed.map((s) => [s.id, s]));
  return { stars: placed, byId, regions, bounds: { minX, minY, maxX, maxY } };
}
