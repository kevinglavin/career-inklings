# Inklings

A swipe-based RIASEC career-interest explorer for students. Swipe through 60 real occupations
(O\*NET data) and get a Holland-code interest profile, a downloadable PDF report, and links to
explore careers on O\*NET / My Next Move. English + Spanish. Live at https://careerswipe.netlify.app

It's a **client-only** React 19 + Vite + TypeScript single-page app — **no backend, no router**.
All state lives on the device (localStorage + IndexedDB); nothing is sent off-device at runtime.

## Run locally

**Prerequisites:** Node.js 18+

```bash
npm install
npm run dev
```

> Note: `npm run dev` / `vite build` write into `node_modules`/`dist`, which can hit Dropbox file
> locks (EBUSY) since this project lives under a synced folder. If a build fails to wipe `dist`,
> build to a temp dir instead: `npx vite build --outDir <temp> --emptyOutDir`.

## Build & deploy (Netlify static hosting)

```bash
# 1. Build to a temp dir (outside the synced tree)
npx vite build --outDir <tempDist> --emptyOutDir
# 2. Prune non-served files (PNG masters, *.docx/*.md briefs, not-ready packs) — REQUIRED,
#    or ~1 GB of internal assets ships publicly
node scripts/prune-deploy.mjs <tempDist>
# 3. Deploy
netlify deploy --prod --no-build --dir <tempDist>
```

Security headers and the SPA fallback live in `public/_headers` and `public/_redirects`
(copied into the build by Vite).

## Card-art generation (optional, build-time only)

`scripts/generate-cards.mjs` generates occupation card art via the OpenAI Images API. It reads
`OPENAI_API_KEY` from `.env.local`. **This key is only used by that local script — it is never
imported by the app and never ships in the bundle.** The running app needs no API key.

```bash
node scripts/generate-cards.mjs <pack|all-packs> [id|all]
```

## Notes

- The app serves card art as `.webp`; `.png` masters are kept in source but excluded from deploys.
- The "Admin / Customize Deck" screen is gated by a client-side password (a deterrent only, not
  real security) and only edits the local deck.
