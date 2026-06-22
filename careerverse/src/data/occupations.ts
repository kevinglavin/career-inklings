import type { InterestVector, RawOccupation, Riasec } from '../types';
import coreRaw from './occupationsCore.json';
import { CORE_JOB_ZONES } from './jobZonesCore';
import { EXTRA_OCCUPATIONS } from './occupationsExtra';
import { buildGalaxy } from './buildGalaxy';

/**
 * Merges the 60 authoritative O*NET occupations (rich descriptions + tasks)
 * with the curated extension set, then lays out the galaxy. A full O*NET dump
 * can drop in by replacing these two sources — nothing downstream changes.
 */

interface CoreJson {
  id: string;
  title: string;
  category: string;
  description: string;
  onetCode: string;
  tasks: string[];
  workActivities: string[];
  interests: Record<string, number>;
}

const core: RawOccupation[] = (coreRaw as CoreJson[]).map((o) => ({
  id: o.id,
  title: o.title,
  category: o.category as Riasec,
  description: o.description,
  onetCode: o.onetCode,
  jobZone: CORE_JOB_ZONES[o.title] ?? 3,
  tasks: o.tasks,
  workActivities: o.workActivities,
  interests: o.interests as InterestVector,
}));

const extra: RawOccupation[] = EXTRA_OCCUPATIONS.map((o) => ({
  id: o.id,
  title: o.title,
  category: o.category as Riasec,
  description: o.description,
  onetCode: o.onetCode,
  jobZone: o.jobZone,
  tasks: o.tasks,
  interests: o.interests as InterestVector,
}));

export const OCCUPATIONS: RawOccupation[] = [...core, ...extra];

export const GALAXY_DATA = buildGalaxy(OCCUPATIONS);
