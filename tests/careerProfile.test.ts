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
});
