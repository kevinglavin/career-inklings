import { describe, it, expect } from 'vitest';
import {
  CAREERVERSE_SLUGS,
  CAREERVERSE_BASE,
  careerVerseUrl,
  careerVerseHandoff,
  titlesDifferMaterially,
} from '../careerverse';
import { OCCUPATIONS } from '../constants';

describe('CareerVerse slug map', () => {
  it('keys are real occupation ids; slugs are clean kebab-case; titles are non-empty', () => {
    const ids = new Set(OCCUPATIONS.map(o => o.id));
    for (const [id, target] of Object.entries(CAREERVERSE_SLUGS)) {
      expect(ids.has(id), `${id} is a known occupation id`).toBe(true);
      expect(target.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(target.title.length).toBeGreaterThan(0);
    }
  });

  it('slug values are unique (no two occupations point at the same star)', () => {
    const slugs = Object.values(CAREERVERSE_SLUGS).map(t => t.slug);
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

describe('titlesDifferMaterially', () => {
  it('treats plural / punctuation-only differences as NOT material', () => {
    expect(titlesDifferMaterially('Actor', 'Actors')).toBe(false);
    expect(titlesDifferMaterially('Firefighter', 'Firefighters')).toBe(false);
    expect(titlesDifferMaterially('Biologist', 'Biologists')).toBe(false);
    expect(titlesDifferMaterially('Speech-Language Pathologist', 'Speech-Language Pathologists')).toBe(false);
    expect(titlesDifferMaterially('Clergy', 'Clergy')).toBe(false);
  });

  it('flags genuinely different official titles as material', () => {
    expect(titlesDifferMaterially('School Counselor', 'Educational, Guidance, and Career Counselors and Advisors')).toBe(true);
    expect(titlesDifferMaterially('Chef', 'Chefs and Head Cooks')).toBe(true);
    expect(titlesDifferMaterially('Doctor', 'General Internal Medicine Physicians')).toBe(true);
    expect(titlesDifferMaterially('Film Director', 'Producers and Directors')).toBe(true);
  });
});

describe('careerVerseHandoff', () => {
  it('returns url + official title when CareerVerse uses a broader title', () => {
    // s1 School Counselor -> Educational, Guidance, and Career Counselors and Advisors
    const h = careerVerseHandoff('s1', 'School Counselor');
    expect(h).not.toBeNull();
    expect(h!.url).toContain('?occupation=educational-guidance-and-career-counselors-and-advisors&from=inklings');
    expect(h!.officialTitle).toBe('Educational, Guidance, and Career Counselors and Advisors');
  });

  it('omits the official title (null) when it only differs by plural', () => {
    // a1 Actor -> Actors
    const h = careerVerseHandoff('a1', 'Actor');
    expect(h).not.toBeNull();
    expect(h!.officialTitle).toBeNull();
  });

  it('returns null for an occupation with no verified target', () => {
    expect(careerVerseHandoff('i9', 'Psychologist')).toBeNull();
  });

  it('compares against the passed English title, not a localized one', () => {
    // Every mapped occupation must resolve, and the official-title note must only
    // fire on a real English-vs-canonical difference.
    for (const o of OCCUPATIONS) {
      const target = CAREERVERSE_SLUGS[o.id];
      const h = careerVerseHandoff(o.id, o.title);
      if (!target) {
        expect(h).toBeNull();
        continue;
      }
      expect(h).not.toBeNull();
      const expected = titlesDifferMaterially(o.title, target.title) ? target.title : null;
      expect(h!.officialTitle).toBe(expected);
    }
  });
});
