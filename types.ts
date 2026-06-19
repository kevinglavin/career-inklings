export enum RiasecType {
  Realistic = 'Realistic',
  Investigative = 'Investigative',
  Artistic = 'Artistic',
  Social = 'Social',
  Enterprising = 'Enterprising',
  Conventional = 'Conventional'
}

// Full six-dimension O*NET interest vector.
// Values are the Occupational Interest scale scores from the O*NET database (1-7 range).
export type InterestVector = Record<RiasecType, number>;

export interface Occupation {
  id: string;
  title: string;
  category: RiasecType;
  description: string;
  imageUrl: string;
  onetCode: string;
  tasks: string[];
  workActivities: string[];
  interests: InterestVector; // Full RIASEC vector from O*NET
}

export type Scores = Record<RiasecType, number>;

export enum AppStage {
  Login = 'LOGIN',
  Instructions = 'INSTRUCTIONS',
  Swipe = 'SWIPE',
  Results = 'RESULTS',
  Settings = 'SETTINGS'
}
