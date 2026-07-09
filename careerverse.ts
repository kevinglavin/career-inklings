// CareerVerse handoff (ink-build-spec "CareerVerse handoff").
//
// CareerVerse deep-links to an occupation via `?occupation=<id>`, where <id> is
// the occupation's canonical id = slugify(title) (career-verse
// src/utils/math.ts + occupationAdapter.ts: `id: slugify(raw.title)`, matched by
// `occupationsById.has(param)` in career-verse src/App.tsx). So the value we send
// is CareerVerse's title slug, and it must be a real occupation in CareerVerse's
// list or the star is empty.
//
// The map below was built by JOINING the two datasets on the O*NET SOC code
// (this app's `onetCode` vs. CareerVerse's per-row O*NET code in
// src/data/generated/onetOccupations.ts), then taking CareerVerse's slugify(title)
// as the verified id. 57 of 60 occupations matched on an exact O*NET code; two
// more (Biologist, Film Director) matched an unambiguous CareerVerse occupation
// by title / base SOC code and were verified by hand. One occupation has NO
// verified target and its CTA stays hidden:
//   * i9 Psychologist (19-3031.00) — CareerVerse split this legacy code into
//     Industrial-Organizational / Clinical & Counseling / School / All-Other with
//     no single "Psychologists" node, so any pick would be a guess. Omitted.
//
// Never guess a slug. To add the hidden one (or new occupations), verify the id
// exists in CareerVerse's occupation data before adding it here.
export const CAREERVERSE_BASE = 'https://careerverse-cyw3.netlify.app/';

// id (this app's occupation id) -> verified CareerVerse title slug.
export const CAREERVERSE_SLUGS: Record<string, string> = {
  // Realistic
  r1: 'chefs-and-head-cooks',
  r2: 'firefighters',
  r3: 'park-naturalists',
  r4: 'airline-pilots-copilots-and-flight-engineers',
  r5: 'police-and-sheriff-s-patrol-officers',
  r6: 'heavy-and-tractor-trailer-truck-drivers',
  r7: 'carpenters',
  r8: 'electricians',
  r9: 'farmers-ranchers-and-other-agricultural-managers',
  r10: 'automotive-service-technicians-and-mechanics',
  // Investigative (i9 Psychologist intentionally omitted — no verified target)
  i1: 'biologists',
  i2: 'chemists',
  i3: 'computer-programmers',
  i4: 'economists',
  i5: 'geoscientists-except-hydrologists-and-geographers',
  i6: 'mathematicians',
  i7: 'medical-scientists-except-epidemiologists',
  i8: 'pharmacists',
  i10: 'general-internal-medicine-physicians',
  // Artistic
  a1: 'actors',
  a2: 'art-drama-and-music-teachers-postsecondary',
  a3: 'dancers',
  a4: 'fashion-designers',
  a5: 'producers-and-directors',
  a6: 'graphic-designers',
  a7: 'interior-designers',
  a8: 'musicians-and-singers',
  a9: 'photographers',
  a10: 'writers-and-authors',
  // Social
  s1: 'educational-guidance-and-career-counselors-and-advisors',
  s2: 'physical-therapists',
  s3: 'child-family-and-school-social-workers',
  s4: 'speech-language-pathologists',
  s5: 'rehabilitation-counselors',
  s6: 'registered-nurses',
  s7: 'elementary-school-teachers-except-special-education',
  s8: 'childcare-workers',
  s9: 'occupational-therapists',
  s10: 'clergy',
  // Enterprising
  e1: 'chief-executives',
  e2: 'sales-managers',
  e3: 'lawyers',
  e4: 'general-and-operations-managers',
  e5: 'personal-financial-advisors',
  e6: 'public-relations-specialists',
  e7: 'sales-representatives-wholesale-and-manufacturing-technical-and-scientific-products',
  e8: 'media-and-communication-workers-all-other',
  e9: 'legislators',
  e10: 'property-real-estate-and-community-association-managers',
  // Conventional
  c1: 'accountants-and-auditors',
  c2: 'financial-and-investment-analysts',
  c3: 'paralegals-and-legal-assistants',
  c4: 'medical-records-specialists',
  c5: 'court-municipal-and-license-clerks',
  c6: 'loan-officers',
  c7: 'first-line-supervisors-of-office-and-administrative-support-workers',
  c8: 'tax-preparers',
  c9: 'payroll-and-timekeeping-clerks',
  c10: 'librarians-and-media-collections-specialists',
};

// Build the deep link for an occupation id, or null when no verified slug exists
// (caller must hide the CTA on null). Includes the analytics attribution flag.
export function careerVerseUrl(occupationId: string): string | null {
  const slug = CAREERVERSE_SLUGS[occupationId];
  if (!slug) return null;
  return `${CAREERVERSE_BASE}?occupation=${encodeURIComponent(slug)}&from=inklings`;
}
