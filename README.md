# career-inklings

Project for the Inklings app, a swipe-based RIASEC career-interest explorer for students. Swipe
through 60 real occupations (O\*NET data) and get a Holland-code interest profile, a downloadable
PDF report, and links to explore careers on O\*NET / My Next Move. English + Spanish.

- Netlify project/site: `career-inklings`
- Production URL: https://career-inklings.netlify.app/
- Deploy source: https://github.com/kevinglavin/career-inklings

A React 19 + Vite + TypeScript single-page app — **no router**. Swipe responses and results stay
on this device (localStorage + IndexedDB) and are never sent off-device. The one exception is the
**Ink** guide: messages you type to Ink, plus the minimal context listed below (app language,
current screen, current card while swiping, and interest-code / scores / liked + unsure occupations
on the results screen), are sent to Anthropic's API to generate replies and are **not stored by the
app**. The Anthropic key never ships to the browser — a Netlify Function (`netlify/functions/
ink-chat.ts`) proxies the request server-side.

## Run locally

**Prerequisites:** Node.js 18+

```bash
npm install
npm run dev            # app only
netlify dev            # app + the Ink function (reads ANTHROPIC_API_KEY from .env.local)
npm test               # unit tests (Vitest)
npm run test:e2e       # end-to-end tests (Playwright)
```

### Environment variables (set in the Netlify dashboard, never committed)

- `ANTHROPIC_API_KEY` — used only by the Ink function at runtime. Create it in a dedicated
  "Inklings" Anthropic workspace with a monthly spend cap. Locally, put it in `.env.local`
  (gitignored) for `netlify dev`.
- `SITE_PASSWORD` — the password for the site-wide Basic Auth gate (edge function). Username is
  `inklings`.

> Note: `npm run dev` / `vite build` write into `node_modules`/`dist`, which can hit Dropbox file
> locks (EBUSY) since this project lives under a synced folder. If a build fails to wipe `dist`,
> build to a temp dir instead: `npx vite build --outDir <temp> --emptyOutDir`.

## Build & deploy (Netlify static hosting)

```bash
npm run build
netlify deploy --prod --no-build --dir dist
```

`npm run build` runs Vite and then `scripts/prune-deploy.mjs` as a safety pass. The app's
runtime art in `public/images/occupations/` is now WebP-only, so the prune step should usually
remove nothing.

`netlify deploy` bundles both the Netlify Function (`netlify/functions/ink-chat.ts`) and the
site-wide password-gate **edge** function (`netlify/edge-functions/gate.ts`) from `netlify.toml`,
including with `--no-build`. The whole site is behind HTTP Basic Auth (username `inklings`,
password `SITE_PASSWORD`) during the private beta.

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

- The app serves card art as `.webp`. Raw PNG masters, incomplete art packs, O*NET database files,
  and review material were moved out of the app folder to
  `C:\Users\kevin\Dropbox\codex\career-inklings-assets`.
- The "Customize Deck" screen is local-only demo/customization mode. It is not authentication and
  only edits data saved on the current device.
- Regression coverage lives in `tests/` and currently checks weighted scoring plus selectable
  image-pack completeness.
