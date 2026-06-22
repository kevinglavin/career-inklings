import { OCCUPATIONS } from './occupations';
import type { Riasec } from '../types';

/**
 * Occupation-specific aliases so real-world terms find the right star even when
 * the official O*NET title differs (e.g. "cybersecurity" → Information Security
 * Analysts). The reference site failed exactly here.
 */
const ALIASES: Record<string, string[]> = {
  'Registered Nurse': ['rn', 'nurse', 'nursing'],
  'Nurse Practitioners': ['np', 'nurse', 'nursing', 'arnp', 'advanced practice nurse'],
  'Licensed Practical and Licensed Vocational Nurses': ['lpn', 'lvn', 'nurse', 'nursing', 'practical nurse', 'vocational nurse'],
  'Physician Assistants': ['pa', 'physician assistant'],
  Doctor: ['physician', 'md', 'medical doctor', 'gp'],
  Surgeons: ['surgeon', 'surgery'],
  'Information Security Analysts': ['cybersecurity', 'cyber security', 'cyber', 'infosec', 'security analyst', 'security engineer'],
  'Network and Computer Systems Administrators': ['network administrator', 'network admin', 'sysadmin', 'systems administrator', 'it admin'],
  'Database Administrators': ['dba', 'database admin'],
  'Software Developers': ['programmer', 'coder', 'software engineer', 'swe', 'dev', 'developer', 'coding'],
  'Computer Programmer': ['coder', 'programmer', 'coding', 'developer'],
  'Web Developers': ['web developer', 'frontend', 'front end', 'backend', 'back end', 'full stack', 'web programmer'],
  'Web Designers': ['web designer', 'ui designer'],
  'Data Scientists': ['data science', 'ml engineer', 'machine learning', 'data analyst'],
  Veterinarians: ['vet', 'animal doctor'],
  Lawyer: ['attorney', 'solicitor', 'counsel'],
  Accountant: ['cpa', 'bookkeeper', 'accounting'],
  'Graphic Designer': ['designer', 'visual designer'],
  'UX Designers': ['ux', 'ui', 'product designer', 'user experience'],
  Paramedics: ['emt', 'ambulance', 'first responder', 'paramedic'],
  'Radiologic Technologists': ['x ray tech', 'radiology', 'imaging tech'],
  'Dental Hygienists': ['dental hygiene', 'hygienist'],
  Dentists: ['dentist', 'dental'],
  'Mechanical Engineers': ['mechanical engineer', 'mech e'],
  'Civil Engineers': ['civil engineer'],
  'Electrical Engineers': ['electrical engineer'],
  'Aerospace Engineers': ['aerospace engineer', 'aeronautical'],
  Architects: ['architect'],
  Welders: ['welder', 'welding'],
  Plumbers: ['plumber', 'plumbing'],
  'Business Executive': ['ceo', 'executive', 'manager', 'director'],
  Entrepreneur: ['founder', 'startup', 'business owner'],
  Psychologist: ['therapist', 'psychology'],
  'Marketing Managers': ['marketing', 'brand manager'],
  'Human Resources Specialists': ['hr', 'human resources', 'recruiter', 'people ops'],
};

/** General query-expansion for terms that aren't occupation titles. */
const QUERY_SYNONYMS: Record<string, string[]> = {
  coding: ['developer', 'programmer', 'software'],
  code: ['developer', 'programmer', 'software'],
  programming: ['developer', 'programmer', 'software'],
  medicine: ['doctor', 'physician', 'nurse'],
  medical: ['doctor', 'physician', 'nurse', 'health'],
  teaching: ['teacher', 'educator'],
  law: ['lawyer', 'attorney', 'paralegal'],
  finance: ['financial', 'accountant', 'analyst'],
  art: ['artist', 'designer', 'creative'],
  space: ['aerospace', 'astronom'],
  animals: ['veterinarian', 'zoolog'],
  computer: ['software', 'developer', 'it'],
  tech: ['software', 'developer', 'it', 'security'],
};

interface Doc {
  id: string;
  title: string;
  titleLower: string;
  titleWords: string[];
  category: Riasec;
  onet: string;
  descLower: string;
  aliases: string[];
}

const norm = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

const DOCS: Doc[] = OCCUPATIONS.map((o) => ({
  id: o.id,
  title: o.title,
  titleLower: norm(o.title),
  titleWords: norm(o.title).split(' '),
  category: o.category,
  onet: o.onetCode,
  descLower: o.description.toLowerCase(),
  aliases: (ALIASES[o.title] ?? []).map(norm),
}));

export interface SearchResult {
  id: string;
  title: string;
  category: Riasec;
  onet: string;
}

/** Tightest character span in `hay` that contains `needle` as a subsequence.
 *  Returns Infinity if not a subsequence. Used to reject loose fuzzy matches
 *  (e.g. "nurse" sprawled across "industrial designers"). */
function denseSubsequenceSpan(needle: string, hay: string): number {
  let best = Infinity;
  for (let start = 0; start < hay.length; start++) {
    if (hay[start] !== needle[0]) continue;
    let i = 1;
    let j = start + 1;
    for (; j < hay.length && i < needle.length; j++) {
      if (needle[i] === hay[j]) i++;
    }
    if (i === needle.length) best = Math.min(best, j - start);
  }
  return best;
}

/** Best score of a single token against one doc (across all fields). */
function tokenScore(doc: Doc, token: string): number {
  const expansions = [token, ...(QUERY_SYNONYMS[token] ?? [])];
  let best = 0;
  for (const t of expansions) {
    const isExpansion = t !== token;
    if (doc.titleLower === t) best = Math.max(best, 1000);
    if (doc.titleLower.startsWith(t)) best = Math.max(best, 820);
    if (doc.titleWords.some((w) => w.startsWith(t))) best = Math.max(best, 600);
    if (doc.titleLower.includes(t)) best = Math.max(best, 440);
    for (const a of doc.aliases) {
      if (a === t) best = Math.max(best, 540);
      else if (a.includes(t) || t.includes(a)) best = Math.max(best, 360);
    }
    if (doc.descLower.includes(t)) best = Math.max(best, 150);
    if (isExpansion) best = Math.max(0, best - 60); // expansions rank below direct hits
  }
  // fuzzy fallback for typos / partials — only when the match is *dense*
  if (best === 0 && token.length >= 4) {
    const span = denseSubsequenceSpan(token, doc.titleLower);
    if (span <= token.length * 1.6) {
      best = 70 + Math.round((token.length / span) * 30);
    }
  }
  return best;
}

export function searchOccupations(query: string, limit = 8): SearchResult[] {
  const q = norm(query);
  if (!q) return [];
  const tokens = q.split(' ');

  const scored: { doc: Doc; score: number }[] = [];
  for (const doc of DOCS) {
    let total = 0;
    let allHit = true;
    for (const tok of tokens) {
      const s = tokenScore(doc, tok);
      if (s === 0) {
        allHit = false;
        break;
      }
      total += s;
    }
    if (!allHit) continue;
    // bonus when the full phrase appears in the title
    if (tokens.length > 1 && doc.titleLower.includes(q)) total += 300;
    scored.push({ doc, score: total });
  }

  scored.sort(
    (a, b) => b.score - a.score || a.doc.titleLower.length - b.doc.titleLower.length,
  );

  return scored.slice(0, limit).map(({ doc }) => ({
    id: doc.id,
    title: doc.title,
    category: doc.category,
    onet: doc.onet,
  }));
}
