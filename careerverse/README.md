# CareerVerse 🌌

Explore occupations as a galaxy. Every star is a different future world, coloured
by Holland's RIASEC interest type and clustered into regions of the sky. Select a
star to make it the glowing "sun", see its details, and follow thin constellation
lines to nearby careers.

> This is not a verdict. It is a neighbourhood — a map of adjacent possibilities.

A self-contained **React + TypeScript + Vite + PixiJS + Zustand** app. The PixiJS
canvas renders the starfield (GPU-accelerated); React renders every panel, the
search, breadcrumb, mini-map and onboarding; Zustand is the shared brain.

## Run

```bash
cd careerverse
npm install
npm run dev        # http://localhost:5180
npm run build      # typecheck + production build to dist/
npm run preview    # serve the production build
```

## The one file you'll want: `src/config.ts`

Every tunable that affects how movement and the galaxy *feel* lives in
`src/config.ts`, grouped and annotated — zoom limits, easing time-constants,
inertia friction, the drag threshold, star/glow sizes, constellation particles,
parallax factors, layout spread. Tune the experience there without touching
engine code.

## Architecture

```
src/
  config.ts            ← all feel tunables (start here)
  types.ts             ← domain types
  data/
    occupationsCore.json    60 authoritative O*NET occupations (rich detail)
    occupationsExtra.ts      114 curated occupations (→ 174 total)
    buildGalaxy.ts           interest-space layout (Holland hexagon) + neighbours
    occupations.ts           merges sources → GALAXY_DATA  (drop in full O*NET here)
    riasec.ts                colour + meaning for each RIASEC type
    search.ts                ranked search with synonyms
  engine/                ← PixiJS, no React
    Camera.ts            1:1 drag + inertia, pointer-anchored eased zoom, tweens, soft bounds
    Galaxy.ts            bootstrap, layers, render loop, public API
    StarNodes.ts         star glow/core/label sprites, hover, sun, dimming
    Constellations.ts    lines + travelling particles to neighbours
    Starfield.ts         parallax deep-field layers + twinkle
    input.ts             pointer / wheel / pinch → camera + picking
  store/useStore.ts      ← Zustand: selection, history, filters, UI
  hooks/                 ← React ↔ engine bridge, breakpoints
  ui/                    ← React DOM overlay (search, panel, breadcrumb, mini-map, …)
```

### How movement works (the non-negotiable)

`Camera` keeps `current = { s, tx, ty }` as the single source of truth; a world
point `(wx, wy)` renders at `(wx*s + tx, wy*s + ty)`. Different interactions drive
it differently:

- **drag** pans 1:1 (no lag under the finger); **release** flings with
  frame-rate-independent inertia.
- **wheel / pinch** eases the scale toward a target while keeping the world point
  under the cursor/fingers pinned.
- **select / Home / breadcrumb** run a timed eased tween that cancels momentum.

A soft bound keeps the galaxy's centre region from ever leaving the screen, so you
can't get lost in empty space. There's always Back, Home, a breadcrumb and a
"you are here" mini-map.

### Swapping in the full O*NET dataset

`occupations.ts` merges two sources and calls `buildGalaxy()`. Replace the two
sources with the full O*NET occupation list (each needs a 6-dim RIASEC vector and
a Job Zone) and everything downstream — layout, neighbours, search — just works.

## Verifying the feel headlessly

`scripts/shoot*.mjs` drive the app with Playwright (software WebGL) to screenshot
states and assert things like search results and panel widths. They need
Playwright installed separately:

```bash
npm i -D playwright && npx playwright install chromium
node scripts/shoot.mjs            # overview, search, selection, pan, zoom
node scripts/shoot-responsive.mjs # tablet/phone layouts + search precision
```

## Accessibility

Keyboard pan (arrows), zoom (`+` / `-`), `Esc` to deselect, `h` Home, `b` Back;
focusable aria-labelled controls; honours `prefers-reduced-motion` (disables
inertia/easing); ≥44px touch targets.
