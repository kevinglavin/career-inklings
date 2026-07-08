// Regression tests for directive INK-A (work order INK-002 / INK-003).
// The results screen must explain each top RIASEC dimension by the occupations
// that most contribute to it — never by like/curious counts — and must show no
// zero-likes framing when nothing is liked (dislike-all run).
import { describe, expect, it } from 'vitest';
import { computeProfile, topContributors } from '../careerProfile';
import { Occupation, RiasecType } from '../types';

const zeroVector = () => ({
  [RiasecType.Realistic]: 0,
  [RiasecType.Investigative]: 0,
  [RiasecType.Artistic]: 0,
  [RiasecType.Social]: 0,
  [RiasecType.Enterprising]: 0,
  [RiasecType.Conventional]: 0,
});

const occupation = (
  id: string,
  title: string,
  category: RiasecType,
  interests: Occupation['interests'],
): Occupation => ({
  id, title, category, description: '', imageUrl: '', onetCode: '', tasks: [], workActivities: [], interests,
});

describe('INK-A: contributing occupations, not counts', () => {
  it('names the top contributing occupations for a dimension, ranked by interest value', () => {
    const doctor = occupation('i10', 'Doctor', RiasecType.Investigative, {
      ...zeroVector(), [RiasecType.Investigative]: 6.8, [RiasecType.Social]: 6.1,
    });
    const psychologist = occupation('i9', 'Psychologist', RiasecType.Investigative, {
      ...zeroVector(), [RiasecType.Investigative]: 5.6, [RiasecType.Social]: 6.6,
    });
    const chemist = occupation('i2', 'Chemist', RiasecType.Investigative, {
      ...zeroVector(), [RiasecType.Investigative]: 6.7, [RiasecType.Social]: 1.1,
    });

    const contributors = topContributors(RiasecType.Investigative, [doctor, psychologist, chemist]);
    expect(contributors.map(o => o.title)).toEqual(['Doctor', 'Chemist']);
  });

  it('explains "Social in my code when I liked nothing social" via liked non-Social occupations', () => {
    // The canonical hard question: like only Investigative-category occupations that
    // nonetheless carry a strong Social profile. Social should be explainable by
    // NAMING those liked occupations — not by any like count (which is zero).
    const doctor = occupation('i10', 'Doctor', RiasecType.Investigative, {
      ...zeroVector(), [RiasecType.Investigative]: 6.8, [RiasecType.Social]: 6.1,
    });
    const psychologist = occupation('i9', 'Psychologist', RiasecType.Investigative, {
      ...zeroVector(), [RiasecType.Investigative]: 5.6, [RiasecType.Social]: 6.6,
    });
    const liked = [doctor, psychologist];

    const profile = computeProfile(liked, []);
    // Social ranks in the code with zero Social-category likes...
    expect(profile.code).toContain('S');
    // ...and we can name real contributing occupations for it.
    const socialContributors = topContributors(RiasecType.Social, liked, []);
    expect(socialContributors.length).toBeGreaterThan(0);
    expect(socialContributors.map(o => o.title)).toContain('Psychologist');
  });

  it('surfaces no contributors and an empty code on a dislike-all run (no zero framing)', () => {
    const profile = computeProfile([], []);
    expect(profile.code).toBe('');
    expect(profile.codeTypes).toEqual([]); // top3 gate is empty -> friendly empty state renders
    // No occupation can be named as a contributor for any dimension.
    Object.values(RiasecType).forEach(type => {
      expect(topContributors(type, [], [])).toEqual([]);
    });
  });

  it('falls back to curious occupations when a dimension has no liked contributors', () => {
    const curiousArtist = occupation('a1', 'Actor', RiasecType.Artistic, {
      ...zeroVector(), [RiasecType.Artistic]: 7,
    });
    const contributors = topContributors(RiasecType.Artistic, [], [curiousArtist]);
    expect(contributors.map(o => o.title)).toEqual(['Actor']);
  });
});
