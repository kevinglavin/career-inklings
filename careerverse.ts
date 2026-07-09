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
// Each entry also stores CareerVerse's canonical display `title`, so the CTA can
// warn students when CareerVerse lists an occupation under a broader official
// title (e.g. "School Counselor" -> "Educational, Guidance, and Career Counselors
// and Advisors"). See titlesDifferMaterially().
//
// Never guess a slug. To add the hidden one (or new occupations), verify the id
// exists in CareerVerse's occupation data before adding it here.
export const CAREERVERSE_BASE = 'https://careerverse-cyw3.netlify.app/';

export interface CareerVerseTarget {
  slug: string; // CareerVerse canonical id (?occupation= value)
  title: string; // CareerVerse's canonical display title (as it appears there)
}

// id (this app's occupation id) -> verified CareerVerse target.
export const CAREERVERSE_SLUGS: Record<string, CareerVerseTarget> = {
  // Realistic
  r1: { slug: 'chefs-and-head-cooks', title: 'Chefs and Head Cooks' },
  r2: { slug: 'firefighters', title: 'Firefighters' },
  r3: { slug: 'park-naturalists', title: 'Park Naturalists' },
  r4: { slug: 'airline-pilots-copilots-and-flight-engineers', title: 'Airline Pilots, Copilots, and Flight Engineers' },
  r5: { slug: 'police-and-sheriff-s-patrol-officers', title: "Police and Sheriff's Patrol Officers" },
  r6: { slug: 'heavy-and-tractor-trailer-truck-drivers', title: 'Heavy and Tractor-Trailer Truck Drivers' },
  r7: { slug: 'carpenters', title: 'Carpenters' },
  r8: { slug: 'electricians', title: 'Electricians' },
  r9: { slug: 'farmers-ranchers-and-other-agricultural-managers', title: 'Farmers, Ranchers, and Other Agricultural Managers' },
  r10: { slug: 'automotive-service-technicians-and-mechanics', title: 'Automotive Service Technicians and Mechanics' },
  // Investigative (i9 Psychologist intentionally omitted — no verified target)
  i1: { slug: 'biologists', title: 'Biologists' },
  i2: { slug: 'chemists', title: 'Chemists' },
  i3: { slug: 'computer-programmers', title: 'Computer Programmers' },
  i4: { slug: 'economists', title: 'Economists' },
  i5: { slug: 'geoscientists-except-hydrologists-and-geographers', title: 'Geoscientists, Except Hydrologists and Geographers' },
  i6: { slug: 'mathematicians', title: 'Mathematicians' },
  i7: { slug: 'medical-scientists-except-epidemiologists', title: 'Medical Scientists, Except Epidemiologists' },
  i8: { slug: 'pharmacists', title: 'Pharmacists' },
  i10: { slug: 'general-internal-medicine-physicians', title: 'General Internal Medicine Physicians' },
  // Artistic
  a1: { slug: 'actors', title: 'Actors' },
  a2: { slug: 'art-drama-and-music-teachers-postsecondary', title: 'Art, Drama, and Music Teachers, Postsecondary' },
  a3: { slug: 'dancers', title: 'Dancers' },
  a4: { slug: 'fashion-designers', title: 'Fashion Designers' },
  a5: { slug: 'producers-and-directors', title: 'Producers and Directors' },
  a6: { slug: 'graphic-designers', title: 'Graphic Designers' },
  a7: { slug: 'interior-designers', title: 'Interior Designers' },
  a8: { slug: 'musicians-and-singers', title: 'Musicians and Singers' },
  a9: { slug: 'photographers', title: 'Photographers' },
  a10: { slug: 'writers-and-authors', title: 'Writers and Authors' },
  // Social
  s1: { slug: 'educational-guidance-and-career-counselors-and-advisors', title: 'Educational, Guidance, and Career Counselors and Advisors' },
  s2: { slug: 'physical-therapists', title: 'Physical Therapists' },
  s3: { slug: 'child-family-and-school-social-workers', title: 'Child, Family, and School Social Workers' },
  s4: { slug: 'speech-language-pathologists', title: 'Speech-Language Pathologists' },
  s5: { slug: 'rehabilitation-counselors', title: 'Rehabilitation Counselors' },
  s6: { slug: 'registered-nurses', title: 'Registered Nurses' },
  s7: { slug: 'elementary-school-teachers-except-special-education', title: 'Elementary School Teachers, Except Special Education' },
  s8: { slug: 'childcare-workers', title: 'Childcare Workers' },
  s9: { slug: 'occupational-therapists', title: 'Occupational Therapists' },
  s10: { slug: 'clergy', title: 'Clergy' },
  // Enterprising
  e1: { slug: 'chief-executives', title: 'Chief Executives' },
  e2: { slug: 'sales-managers', title: 'Sales Managers' },
  e3: { slug: 'lawyers', title: 'Lawyers' },
  e4: { slug: 'general-and-operations-managers', title: 'General and Operations Managers' },
  e5: { slug: 'personal-financial-advisors', title: 'Personal Financial Advisors' },
  e6: { slug: 'public-relations-specialists', title: 'Public Relations Specialists' },
  e7: { slug: 'sales-representatives-wholesale-and-manufacturing-technical-and-scientific-products', title: 'Sales Representatives, Wholesale and Manufacturing, Technical and Scientific Products' },
  e8: { slug: 'media-and-communication-workers-all-other', title: 'Media and Communication Workers, All Other' },
  e9: { slug: 'legislators', title: 'Legislators' },
  e10: { slug: 'property-real-estate-and-community-association-managers', title: 'Property, Real Estate, and Community Association Managers' },
  // Conventional
  c1: { slug: 'accountants-and-auditors', title: 'Accountants and Auditors' },
  c2: { slug: 'financial-and-investment-analysts', title: 'Financial and Investment Analysts' },
  c3: { slug: 'paralegals-and-legal-assistants', title: 'Paralegals and Legal Assistants' },
  c4: { slug: 'medical-records-specialists', title: 'Medical Records Specialists' },
  c5: { slug: 'court-municipal-and-license-clerks', title: 'Court, Municipal, and License Clerks' },
  c6: { slug: 'loan-officers', title: 'Loan Officers' },
  c7: { slug: 'first-line-supervisors-of-office-and-administrative-support-workers', title: 'First-Line Supervisors of Office and Administrative Support Workers' },
  c8: { slug: 'tax-preparers', title: 'Tax Preparers' },
  c9: { slug: 'payroll-and-timekeeping-clerks', title: 'Payroll and Timekeeping Clerks' },
  c10: { slug: 'librarians-and-media-collections-specialists', title: 'Librarians and Media Collections Specialists' },
};

// Build the deep link for an occupation id, or null when no verified slug exists
// (caller must hide the CTA on null). Includes the analytics attribution flag.
export function careerVerseUrl(occupationId: string): string | null {
  const target = CAREERVERSE_SLUGS[occupationId];
  if (!target) return null;
  return `${CAREERVERSE_BASE}?occupation=${encodeURIComponent(target.slug)}&from=inklings`;
}

// Normalize for a title comparison: lowercase, drop non-alphanumerics, and strip a
// single trailing plural "s" so "Actor" == "Actors" but "Chef" != "Chefs and Head
// Cooks".
const normalizeTitle = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '').replace(/s$/, '');

// True when CareerVerse lists the occupation under a materially different official
// title than the Inklings card (i.e. more than a plural/punctuation difference).
// Compare against the ENGLISH Inklings title — the canonical title is always
// English as CareerVerse displays it, so a localized title would always "differ".
export function titlesDifferMaterially(inklingsEnglishTitle: string, canonicalTitle: string): boolean {
  return normalizeTitle(inklingsEnglishTitle) !== normalizeTitle(canonicalTitle);
}

// Everything the CTA needs for the top occupation, or null when no verified target
// exists (caller hides the CTA). `officialTitle` is set only when CareerVerse's
// canonical title differs materially from the Inklings card title.
export function careerVerseHandoff(
  occupationId: string,
  inklingsEnglishTitle: string,
): { url: string; officialTitle: string | null } | null {
  const target = CAREERVERSE_SLUGS[occupationId];
  if (!target) return null;
  return {
    url: `${CAREERVERSE_BASE}?occupation=${encodeURIComponent(target.slug)}&from=inklings`,
    officialTitle: titlesDifferMaterially(inklingsEnglishTitle, target.title) ? target.title : null,
  };
}
