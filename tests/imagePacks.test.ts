import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { OCCUPATIONS, SELECTABLE_PACKS, defaultImageUrl, resolvePackImageUrl } from '../constants';

const projectRoot = path.resolve(__dirname, '..');

const publicFile = (url: string) => {
  const clean = decodeURIComponent(url.replace(/^\//, ''));
  return path.join(projectRoot, 'public', clean);
};

describe('selectable image packs', () => {
  it('keeps every picker-visible pack complete', () => {
    expect(SELECTABLE_PACKS.length).toBeGreaterThan(0);

    const missing: string[] = [];
    for (const pack of SELECTABLE_PACKS) {
      for (const occupation of OCCUPATIONS) {
        const url = pack.folder
          ? resolvePackImageUrl(occupation.imageUrl, pack.id)
          : defaultImageUrl(occupation.imageUrl);
        if (!existsSync(publicFile(url))) {
          missing.push(`${pack.label}: ${url}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });

  it('serves WebP images for canonical occupation art', () => {
    for (const pack of SELECTABLE_PACKS) {
      for (const occupation of OCCUPATIONS) {
        const url = pack.folder
          ? resolvePackImageUrl(occupation.imageUrl, pack.id)
          : defaultImageUrl(occupation.imageUrl);
        expect(url.endsWith('.webp')).toBe(true);
      }
    }
  });
});
