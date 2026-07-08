// CareerVerse handoff (ink-build-spec "CareerVerse handoff").
//
// CareerVerse keys occupations by a kebab-case TITLE slug, not the SOC code, and
// naive slugging of O*NET titles fails on punctuation (commas, slashes,
// ampersands, "Except ..."). Per the spec we must therefore VERIFY each slug
// against CareerVerse's real occupation list and, for any occupation without a
// confirmed slug, HIDE the CTA rather than link to a wrong or empty star.
//
// The verified map below is intentionally the single source of truth. It starts
// empty: populate it from the CareerVerse project's occupation data file
// (ask Kevin for the folder / occupation list), keyed by this app's occupation
// id (r1, i10, s6, …). Until an id has a confirmed slug here, its CTA stays
// hidden — never guessed.
export const CAREERVERSE_BASE = 'https://careerverse-cyw3.netlify.app/';

// id -> verified CareerVerse title slug. Example once populated:
//   psychologist: 'psychologists',
//   i9: 'psychology-teachers-postsecondary',
export const CAREERVERSE_SLUGS: Record<string, string> = {
  // (empty until verified against CareerVerse's occupation list)
};

// Build the deep link for an occupation id, or null when no verified slug exists
// (caller must hide the CTA on null). Includes the analytics attribution flag.
export function careerVerseUrl(occupationId: string): string | null {
  const slug = CAREERVERSE_SLUGS[occupationId];
  if (!slug) return null;
  return `${CAREERVERSE_BASE}?occupation=${encodeURIComponent(slug)}&from=inklings`;
}
