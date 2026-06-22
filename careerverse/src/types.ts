/** Holland's six interest types. The colour + clustering language of the galaxy. */
export type Riasec =
  | 'Realistic'
  | 'Investigative'
  | 'Artistic'
  | 'Social'
  | 'Enterprising'
  | 'Conventional';

export const RIASEC_ORDER: Riasec[] = [
  'Realistic',
  'Investigative',
  'Artistic',
  'Social',
  'Enterprising',
  'Conventional',
];

/** Full six-dimension O*NET interest vector, each 1–7. */
export type InterestVector = Record<Riasec, number>;

/** Raw occupation as it arrives from the dataset, before galaxy layout. */
export interface RawOccupation {
  id: string;
  title: string;
  category: Riasec;
  description: string;
  onetCode: string;
  jobZone: number; // 1–5, O*NET preparation level
  tasks: string[];
  workActivities?: string[];
  interests: InterestVector;
}

/** Why one occupation sits near another — derived, genuinely informative. */
export interface NeighbourLink {
  id: string;
  similarity: number;     // 0–1 cosine-ish similarity of interest vectors
  reason: string;         // human sentence, e.g. "Shares a strong Social + Investigative pull"
  sharedTypes: Riasec[];  // the interests they have in common
  samePrep: boolean;      // similar Job Zone
}

/** An occupation placed in the galaxy with neighbours resolved. */
export interface StarDatum extends RawOccupation {
  x: number;              // world-space position
  y: number;
  importance: number;     // 0–1, drives core size (overall interest intensity)
  neighbours: NeighbourLink[];
}

export interface RegionDatum {
  type: Riasec;
  cx: number;             // region centre in world space
  cy: number;
  label: string;
}

export interface Galaxy {
  stars: StarDatum[];
  byId: Map<string, StarDatum>;
  regions: RegionDatum[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

export interface JobZoneFilter {
  /** null = Any. Otherwise relative to the *selected* occupation's zone. */
  mode: 'any' | 'similar' | 'lower' | 'higher';
}
