// careerProfile.ts
// Weighted RIASEC scoring + deterministic grammatical summary.
// Replaces the old single-tag counting model and the "AI Coach Insight" block.

import { RiasecType, Occupation, InterestVector } from './types';

export const RIASEC_TYPES: RiasecType[] = [
  RiasecType.Realistic, RiasecType.Investigative, RiasecType.Artistic,
  RiasecType.Social, RiasecType.Enterprising, RiasecType.Conventional
];

const LETTER: Record<RiasecType, string> = {
  [RiasecType.Realistic]: 'R',
  [RiasecType.Investigative]: 'I',
  [RiasecType.Artistic]: 'A',
  [RiasecType.Social]: 'S',
  [RiasecType.Enterprising]: 'E',
  [RiasecType.Conventional]: 'C',
};

export interface RankedType {
  type: RiasecType;
  letter: string;
  score: number;
  rank: number;
  normalized: number; // percentage 0-100
}

export interface Profile {
  totals: Record<RiasecType, number>;
  ranked: RankedType[];
  code: string;
  codeTypes: RankedType[];
  topTypes: RiasecType[];
  hasTopTie: boolean;
  hasBoundaryTie: boolean;
  tiedTypes: RiasecType[];
  likedCount: number;
}

// Compute a weighted RIASEC profile from the cards the user liked or marked as
// "maybe." Likes count at full weight; maybes count as a lighter curiosity
// signal. Each card's full interest vector is summed, producing a real gradient
// instead of the old six small tallies capped at 10.
export function computeProfile(likedCards: Occupation[], maybeCards: Occupation[] = []): Profile {
  const totals = {} as Record<RiasecType, number>;
  for (const t of RIASEC_TYPES) totals[t] = 0;

  const weightedCards = [
    ...likedCards.map(card => ({ card, weight: 1 })),
    ...maybeCards.map(card => ({ card, weight: 0.45 })),
  ];

  for (const { card, weight } of weightedCards) {
    if (card.interests) {
      for (const t of RIASEC_TYPES) {
        const v = Number(card.interests[t]);
        if (!Number.isNaN(v)) totals[t] += v * weight;
      }
    }
  }

  const sum = RIASEC_TYPES.reduce((a, t) => a + totals[t], 0);

  const sorted = RIASEC_TYPES
    .map(t => ({ type: t, letter: LETTER[t], score: totals[t] }))
    .sort((a, b) => b.score - a.score);

  // Standard competition ranking: equal scores share a rank.
  let lastScore = -1;
  let lastRank = 0;
  const ranked: RankedType[] = sorted.map((e, i) => {
    const rank = (e.score === lastScore) ? lastRank : i + 1;
    lastScore = e.score;
    lastRank = rank;
    return {
      ...e,
      rank,
      normalized: sum > 0 ? Math.round((e.score / sum) * 1000) / 10 : 0,
    };
  });

  // Types tied for the single highest score.
  const topScore = ranked[0] ? ranked[0].score : 0;
  const topTypes = ranked
    .filter(e => e.score === topScore && e.score > 0)
    .map(e => e.type);

  // Headline code = the three highest types.
  // If the 3rd slot is tied, include the whole tied group and flag it.
  const positive = ranked.filter(e => e.score > 0);
  let codeTypes: RankedType[];
  let hasBoundaryTie = false;
  let tiedTypes: RiasecType[] = [];

  if (positive.length <= 3) {
    codeTypes = positive;
  } else {
    const cutoff = positive[2].score;
    const above = positive.filter(e => e.score > cutoff);
    const atCutoff = positive.filter(e => e.score === cutoff);
    codeTypes = [...above, ...atCutoff];
    if (atCutoff.length > 1) {
      hasBoundaryTie = true;
      tiedTypes = atCutoff.map(e => e.type);
    }
  }

  return {
    totals,
    ranked,
    code: codeTypes.map(e => e.letter).join(''),
    codeTypes,
    topTypes,
    hasTopTie: topTypes.length > 1,
    hasBoundaryTie,
    tiedTypes,
    likedCount: likedCards.length,
  };
}

// --- Summary generation ---

const RIASEC_INFO: Record<RiasecType, { label: string; gerund: string }> = {
  [RiasecType.Realistic]:     { label: 'The Doer',      gerund: 'building, fixing, and working with your hands' },
  [RiasecType.Investigative]: { label: 'The Thinker',   gerund: 'investigating ideas and solving problems' },
  [RiasecType.Artistic]:      { label: 'The Creator',   gerund: 'creating things and expressing ideas' },
  [RiasecType.Social]:        { label: 'The Helper',    gerund: 'helping, teaching, and working with people' },
  [RiasecType.Enterprising]:  { label: 'The Persuader', gerund: 'leading people and starting projects' },
  [RiasecType.Conventional]:  { label: 'The Organizer', gerund: 'organizing details and keeping things accurate' },
};

function noThe(s: string): string {
  return s.replace(/^The /, '');
}

function listPhrase(arr: string[]): string {
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
  return `${arr.slice(0, -1).join(', ')}, and ${arr[arr.length - 1]}`;
}

export function generateSummary(profile: Profile): { heading: string; body: string } {
  const HEADING = 'What This Suggests';

  const top = (profile.codeTypes && profile.codeTypes.length)
    ? profile.codeTypes
    : profile.ranked.filter(e => e.score > 0);

  if (!top.length) {
    return {
      heading: HEADING,
      body: 'You did not mark any careers as interesting. Swipe through again and tap the ones that catch your eye, including the unfamiliar ones.',
    };
  }

  const named = top.slice(0, 3).map(e => e.type);
  const clauses = named.map(t => RIASEC_INFO[t].gerund);
  const clausePhrase = clauses.length === 1
    ? clauses[0]
    : `${clauses.slice(0, -1).join('; ')}; and ${clauses[clauses.length - 1]}`;

  let opener: string;
  if (profile.hasTopTie) {
    opener = `Your top interests are ${listPhrase(profile.topTypes.slice(0, 3))}, which scored evenly.`;
  } else {
    const t1 = named[0];
    const rest = named.slice(1);
    opener = rest.length
      ? `Your strongest interest is ${t1}, the ${noThe(RIASEC_INFO[t1].label)} type, with ${listPhrase(rest)} close behind.`
      : `Your strongest interest is ${t1}, the ${noThe(RIASEC_INFO[t1].label)} type.`;
  }

  let body = `${opener} Together these point toward work that involves ${clausePhrase}.`;

  if (profile.hasBoundaryTie && profile.tiedTypes.length && !profile.hasTopTie) {
    body += ` Your ${listPhrase(profile.tiedTypes)} scores came out even, so treat them as equally worth exploring.`;
  }

  return { heading: HEADING, body };
}
