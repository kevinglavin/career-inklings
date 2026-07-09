import { describe, it, expect } from 'vitest';
import { CAREERVERSE_SLUGS, CAREERVERSE_BASE, careerVerseUrl } from '../careerverse';
import { OCCUPATIONS } from '../constants';

describe('CareerVerse slug map', () => {
  it('keys are real occupation ids and slugs are clean kebab-case', () => {
    const ids = new Set(OCCUPATIONS.map(o => o.id));
    for (const [id, slug] of Object.entries(CAREERVERSE_SLUGS)) {
      expect(ids.has(id), `${id} is a known occupation id`).toBe(true);
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it('slug values are unique (no two occupations point at the same star)', () => {
    const slugs = Object.values(CAREERVERSE_SLUGS);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('builds an attributed deep link for a mapped occupation', () => {
    expect(careerVerseUrl('r1')).toBe(`${CAREERVERSE_BASE}?occupation=chefs-and-head-cooks&from=inklings`);
  });

  it('hides the CTA (null) for an unmapped occupation', () => {
    // i9 (Psychologist) has no verified CareerVerse target and is intentionally omitted.
    expect(CAREERVERSE_SLUGS.i9).toBeUndefined();
    expect(careerVerseUrl('i9')).toBeNull();
    expect(careerVerseUrl('does-not-exist')).toBeNull();
  });

  it('covers every occupation except the ones without a verified slug', () => {
    // 60 occupations, exactly 1 intentionally hidden (Psychologist).
    expect(OCCUPATIONS.length).toBe(60);
    expect(Object.keys(CAREERVERSE_SLUGS).length).toBe(59);
  });
});
