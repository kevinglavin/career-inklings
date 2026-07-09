import { describe, it, expect } from 'vitest';
import { TRANSLATIONS, type Lang } from '../i18n';
import { generateSummary, computeProfile } from '../careerProfile';
import { OCCUPATIONS } from '../constants';

// INK item 5: the counselor summary and PDF report must not frame results with
// like/curious COUNTS, and must use "occupation" wording rather than "career" or
// "card" terminology. These strings feed both surfaces (report.* -> PDF,
// summary.* + results.printableFocus -> Copy Counselor Summary / counselor view).
const SURFACE_KEYS = (lang: Lang) =>
  Object.keys(TRANSLATIONS[lang]).filter(
    k => k.startsWith('report.') || k.startsWith('summary.') || k === 'results.printableFocus',
  );

describe('counselor summary + PDF report copy (item 5)', () => {
  for (const lang of ['en', 'es'] as const) {
    it(`${lang}: no like/curious counts`, () => {
      for (const key of SURFACE_KEYS(lang)) {
        const v = TRANSLATIONS[lang][key];
        // A count interpolation next to a like/curious word is the INK-A violation.
        const isLikeCount = v.includes('{n}') && /\b(lik|gust|curious|curios)/i.test(v);
        expect(isLikeCount, `${key} = "${v}" frames a like/curious count`).toBe(false);
      }
    });

    it(`${lang}: no "career" or "card" terminology`, () => {
      for (const key of SURFACE_KEYS(lang)) {
        const v = TRANSLATIONS[lang][key];
        expect(v, `${key} uses "career(s)"`).not.toMatch(/\bcareers?\b|\bcarreras?\b/i);
        expect(v, `${key} uses "card(s)"`).not.toMatch(/\bcards?\b|\btarjetas?\b/i);
      }
    });
  }

  it('dead report.spoken like-count string is gone (results.spoken is the clean one)', () => {
    expect(TRANSLATIONS.en['report.spoken']).toBeUndefined();
    expect(TRANSLATIONS.es['report.spoken']).toBeUndefined();
    expect(TRANSLATIONS.en['results.spoken']).not.toMatch(/\{n\}/);
  });

  it('generateSummary uses occupation wording, never a like count', () => {
    const empty = generateSummary(computeProfile([], []));
    expect(empty.body).toMatch(/occupations/i);
    expect(empty.body).not.toMatch(/\bcareers?\b/i);

    const profile = computeProfile(OCCUPATIONS.slice(0, 6), OCCUPATIONS.slice(6, 9));
    const summary = generateSummary(profile);
    expect(summary.body).not.toMatch(/you liked|\bcards?\b|\bcareers?\b/i);
  });
});
