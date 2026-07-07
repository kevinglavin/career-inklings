import { describe, expect, it } from 'vitest';
import { computeProfile, generateSummary } from '../careerProfile';
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
  category: RiasecType,
  interests: Occupation['interests'],
): Occupation => ({
  id,
  title: id,
  category,
  description: '',
  imageUrl: '',
  onetCode: '',
  tasks: [],
  workActivities: [],
  interests,
});

describe('computeProfile', () => {
  it('weights liked careers more strongly than curious careers', () => {
    const liked = occupation('liked-realistic', RiasecType.Realistic, {
      ...zeroVector(),
      [RiasecType.Realistic]: 10,
    });
    const curious = occupation('curious-investigative', RiasecType.Investigative, {
      ...zeroVector(),
      [RiasecType.Investigative]: 10,
    });

    const profile = computeProfile([liked], [curious]);

    expect(profile.totals[RiasecType.Realistic]).toBe(10);
    expect(profile.totals[RiasecType.Investigative]).toBe(4.5);
    expect(profile.code).toBe('RI');
    expect(profile.likedCount).toBe(1);
  });

  it('includes all types tied at the third-code boundary', () => {
    const card = occupation('boundary-tie', RiasecType.Realistic, {
      ...zeroVector(),
      [RiasecType.Realistic]: 9,
      [RiasecType.Investigative]: 7,
      [RiasecType.Artistic]: 5,
      [RiasecType.Social]: 5,
    });

    const profile = computeProfile([card]);

    expect(profile.code).toBe('RIAS');
    expect(profile.hasBoundaryTie).toBe(true);
    expect(profile.tiedTypes).toEqual([RiasecType.Artistic, RiasecType.Social]);
  });

  it('returns an empty code and useful summary when no careers are selected', () => {
    const profile = computeProfile([]);
    const summary = generateSummary(profile);

    expect(profile.code).toBe('');
    expect(profile.codeTypes).toEqual([]);
    expect(summary.body).toContain('did not mark any careers');
  });

  it('handles all-Dislike input (no likes, no maybes)', () => {
    const profile = computeProfile([], []);
    expect(profile.likedCount).toBe(0);
    expect(profile.code).toBe(''); // No code if nothing is liked
    Object.values(RiasecType).forEach(type => {
      expect(profile.totals[type]).toBe(0);
    });
  });

  it('handles all-Like input (all cards are liked)', () => {
    const likedCards = [
      occupation('1', RiasecType.Realistic, { ...zeroVector(), [RiasecType.Realistic]: 5, [RiasecType.Investigative]: 2 }),
      occupation('2', RiasecType.Investigative, { ...zeroVector(), [RiasecType.Investigative]: 4, [RiasecType.Artistic]: 3 }),
      occupation('3', RiasecType.Social, { ...zeroVector(), [RiasecType.Social]: 6 }),
    ];
    const profile = computeProfile(likedCards, []);
    expect(profile.likedCount).toBe(3);
    expect(profile.totals[RiasecType.Realistic]).toBe(5);
    expect(profile.totals[RiasecType.Investigative]).toBe(6);
    expect(profile.totals[RiasecType.Artistic]).toBe(3);
    expect(profile.totals[RiasecType.Social]).toBe(6);
    expect(profile.code).toBe('ISR');
    expect(profile.hasTopTie).toBe(true);
  });

  it('detects tie cases between the second and third letters', () => {
    const likedCards = [
      occupation('1', RiasecType.Realistic, {
        ...zeroVector(),
        [RiasecType.Realistic]: 10,
        [RiasecType.Investigative]: 5,
        [RiasecType.Artistic]: 5,
        [RiasecType.Social]: 2
      }),
    ];
    const profile = computeProfile(likedCards, []);
    expect(profile.code.startsWith('R')).toBe(true);
    expect(profile.code.length).toBe(3);
    expect(profile.hasBoundaryTie).toBe(true);
    expect(profile.tiedTypes.includes(RiasecType.Investigative)).toBe(true);
    expect(profile.tiedTypes.includes(RiasecType.Artistic)).toBe(true);
  });

  it('handles Quick Mode (partial deck)', () => {
    const likedCards = [
      occupation('1', RiasecType.Social, { ...zeroVector(), [RiasecType.Social]: 6, [RiasecType.Enterprising]: 4 }),
    ];
    const profile = computeProfile(likedCards, []);
    expect(profile.likedCount).toBe(1);
    expect(profile.totals[RiasecType.Social]).toBe(6);
    expect(profile.totals[RiasecType.Enterprising]).toBe(4);
    expect(profile.code).toBe('SE');
  });

  it('handles Unsure responses (maybes)', () => {
    const maybeCards = [
      occupation('1', RiasecType.Realistic, { ...zeroVector(), [RiasecType.Realistic]: 10 }),
    ];
    const profile = computeProfile([], maybeCards);
    expect(profile.totals[RiasecType.Realistic]).toBe(4.5);
    expect(profile.code).toBe('R');
  });
});
