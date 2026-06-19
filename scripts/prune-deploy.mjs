// Prune a built dist/ directory down to only what the running app actually serves,
// BEFORE deploying. The app loads .webp for the "ready" packs only; PNG masters,
// authoring docs (*.docx/*.md), and not-ready packs are kept in source but must NOT
// ship to the public CDN (saves ~1 GB and avoids exposing internal docs).
//
// Usage: node scripts/prune-deploy.mjs <distDir>
import { readdirSync, statSync, rmSync } from 'fs';
import { join } from 'path';

const dist = process.argv[2];
if (!dist) { console.error('Usage: node scripts/prune-deploy.mjs <distDir>'); process.exit(1); }

const OCC = join(dist, 'images', 'occupations');
// Whole folders that are not "ready" packs (or are scratch) — drop entirely.
const DROP_DIRS = new Set(['Anime', 'League of Legends', 'Fortnite Characters', '_review']);
// File extensions the app never requests at runtime.
const DROP_EXT = ['.png', '.docx', '.md'];

let removedFiles = 0, removedBytes = 0, removedDirs = 0;

const dirSize = (p) => {
  let total = 0;
  for (const e of readdirSync(p, { withFileTypes: true })) {
    const fp = join(p, e.name);
    if (e.isDirectory()) total += dirSize(fp);
    else { try { total += statSync(fp).size; } catch { /* ignore */ } }
  }
  return total;
};

const walk = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const fp = join(dir, e.name);
    if (e.isDirectory()) {
      if (DROP_DIRS.has(e.name)) {
        removedBytes += dirSize(fp); removedDirs++;
        rmSync(fp, { recursive: true, force: true });
      } else {
        walk(fp);
      }
    } else {
      const lower = e.name.toLowerCase();
      if (DROP_EXT.some(ext => lower.endsWith(ext))) {
        try { removedBytes += statSync(fp).size; } catch { /* ignore */ }
        rmSync(fp, { force: true });
        removedFiles++;
      }
    }
  }
};

try { walk(OCC); } catch (e) { console.error('prune failed:', e.message); process.exit(1); }

const mb = (b) => (b / 1024 / 1024).toFixed(1);
console.log(`Pruned ${removedFiles} files + ${removedDirs} folders (${mb(removedBytes)} MB) from ${OCC}`);
console.log(`Remaining dist size: ${mb(dirSize(dist))} MB`);
