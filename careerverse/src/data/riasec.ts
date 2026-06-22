import type { Riasec } from '../types';

/**
 * RIASEC visual + explanatory language. Colours follow the brief:
 *  R orange/amber · I blue · A purple/magenta · S green · E red/coral · C indigo.
 * Each colour doubles as the galaxy's map legend, so it's defined once here.
 */
export interface RiasecMeta {
  key: Riasec;
  letter: string;
  name: string;
  nickname: string;     // "The Doer", etc.
  blurb: string;        // one-line, surfaced in legend tooltips
  /** Hex as number (Pixi) and string (CSS) — kept in sync. */
  color: number;
  css: string;
  glow: string;         // lighter tint for halos / chips
}

export const RIASEC: Record<Riasec, RiasecMeta> = {
  Realistic: {
    key: 'Realistic',
    letter: 'R',
    name: 'Realistic',
    nickname: 'The Doer',
    blurb: 'Hands-on work with tools, machines, plants and the physical world.',
    color: 0xff9d3c,
    css: '#ff9d3c',
    glow: '#ffcaa3',
  },
  Investigative: {
    key: 'Investigative',
    letter: 'I',
    name: 'Investigative',
    nickname: 'The Thinker',
    blurb: 'Ideas, research and figuring out problems with science and analysis.',
    color: 0x4aa8ff,
    css: '#4aa8ff',
    glow: '#a9d4ff',
  },
  Artistic: {
    key: 'Artistic',
    letter: 'A',
    name: 'Artistic',
    nickname: 'The Creator',
    blurb: 'Self-expression through design, writing, performance and craft.',
    color: 0xc77dff,
    css: '#c77dff',
    glow: '#e3c2ff',
  },
  Social: {
    key: 'Social',
    letter: 'S',
    name: 'Social',
    nickname: 'The Helper',
    blurb: 'Teaching, caring for and developing other people.',
    color: 0x3ddc97,
    css: '#3ddc97',
    glow: '#aef0d4',
  },
  Enterprising: {
    key: 'Enterprising',
    letter: 'E',
    name: 'Enterprising',
    nickname: 'The Persuader',
    blurb: 'Leading, selling, persuading and starting ventures.',
    color: 0xff6b6b,
    css: '#ff6b6b',
    glow: '#ffb3b3',
  },
  Conventional: {
    key: 'Conventional',
    letter: 'C',
    name: 'Conventional',
    nickname: 'The Organizer',
    blurb: 'Order, data, records and following clear procedures.',
    color: 0x7c83ff,
    css: '#7c83ff',
    glow: '#bcc0ff',
  },
};

/** O*NET Job Zone meaning, surfaced inline (not buried in a menu). */
export const JOB_ZONES: Record<number, { title: string; prep: string }> = {
  1: { title: 'Little or no preparation', prep: 'Little to no previous experience; short on-the-job training.' },
  2: { title: 'Some preparation', prep: 'A high-school diploma and some training or experience.' },
  3: { title: 'Medium preparation', prep: 'Vocational training, an associate degree or relevant experience.' },
  4: { title: 'Considerable preparation', prep: 'Usually a four-year bachelor’s degree.' },
  5: { title: 'Extensive preparation', prep: 'A graduate or professional degree and extensive training.' },
};

export const riasecCss = (k: Riasec) => RIASEC[k].css;
export const riasecColor = (k: Riasec) => RIASEC[k].color;
