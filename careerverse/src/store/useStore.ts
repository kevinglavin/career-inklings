import { create } from 'zustand';
import { GALAXY_DATA } from '../data/occupations';
import type { Riasec } from '../types';

export type JobZoneMode = 'any' | 'similar' | 'lower' | 'higher';

const ONBOARD_KEY = 'careerverse.onboarded.v1';

interface State {
  /** Navigation: history[index] is the current star; index -1 = overview. */
  history: string[];
  index: number;
  currentId: string | null;
  hoverId: string | null;
  visited: string[]; // journey trail (every star ever opened, in order)

  jobZone: JobZoneMode;
  focusMode: boolean; // dim unrelated stars when a star is selected
  starsOnly: boolean; // immersive, UI-stripped mode
  reducedMotion: boolean;

  onboarded: boolean;
  searchOpen: boolean;
  toast: string | null;

  // actions
  select: (id: string, opts?: { fromHistory?: boolean }) => void;
  deselect: () => void;
  back: () => void;
  goTo: (index: number) => void; // breadcrumb jump
  setHover: (id: string | null) => void;
  surprise: () => void;

  setJobZone: (m: JobZoneMode) => void;
  toggleFocus: () => void;
  toggleStarsOnly: () => void;
  setReducedMotion: (v: boolean) => void;

  finishOnboarding: () => void;
  setSearchOpen: (v: boolean) => void;
  showToast: (m: string) => void;
}

export const useStore = create<State>((set, get) => ({
  history: [],
  index: -1,
  currentId: null,
  hoverId: null,
  visited: [],

  jobZone: 'any',
  focusMode: true,
  starsOnly: false,
  reducedMotion: false,

  onboarded: typeof localStorage !== 'undefined' && localStorage.getItem(ONBOARD_KEY) === '1',
  searchOpen: false,
  toast: null,

  select: (id, opts) => {
    if (!GALAXY_DATA.byId.has(id)) return;
    const st = get();
    if (opts?.fromHistory) {
      const i = st.history.indexOf(id);
      if (i >= 0) {
        set({ index: i, currentId: id });
        return;
      }
    }
    if (st.currentId === id) return;
    const truncated = st.history.slice(0, st.index + 1);
    truncated.push(id);
    const visited = st.visited.includes(id) ? st.visited : [...st.visited, id];
    set({ history: truncated, index: truncated.length - 1, currentId: id, visited });
  },

  deselect: () => set({ index: -1, currentId: null }),

  back: () => {
    const st = get();
    if (st.index < 0) return;
    const next = st.index - 1;
    set({ index: next, currentId: next >= 0 ? st.history[next] : null });
  },

  goTo: (index) => {
    const st = get();
    if (index < -1 || index >= st.history.length) return;
    set({ index, currentId: index >= 0 ? st.history[index] : null });
  },

  setHover: (id) => set({ hoverId: id }),

  surprise: () => {
    const stars = GALAXY_DATA.stars;
    const pick = stars[Math.floor(Math.random() * stars.length)];
    get().select(pick.id);
  },

  setJobZone: (m) => set({ jobZone: m }),
  toggleFocus: () => set((s) => ({ focusMode: !s.focusMode })),
  toggleStarsOnly: () => set((s) => ({ starsOnly: !s.starsOnly })),
  setReducedMotion: (v) => set({ reducedMotion: v }),

  finishOnboarding: () => {
    try {
      localStorage.setItem(ONBOARD_KEY, '1');
    } catch {
      /* ignore */
    }
    set({ onboarded: true });
  },
  setSearchOpen: (v) => set({ searchOpen: v }),
  showToast: (m) => {
    set({ toast: m });
    setTimeout(() => {
      if (get().toast === m) set({ toast: null });
    }, 2200);
  },
}));

/** Stars to keep "lit" given the Job-Zone filter, relative to the current star. */
export function computeVisibleIds(currentId: string | null, mode: JobZoneMode): Set<string> | null {
  if (mode === 'any' || !currentId) return null;
  const cur = GALAXY_DATA.byId.get(currentId);
  if (!cur) return null;
  const z = cur.jobZone;
  const ids = new Set<string>();
  for (const s of GALAXY_DATA.stars) {
    const keep =
      mode === 'similar'
        ? Math.abs(s.jobZone - z) <= 1
        : mode === 'lower'
          ? s.jobZone < z
          : s.jobZone > z;
    if (keep || s.id === currentId) ids.add(s.id);
  }
  return ids;
}

/** Breadcrumb titles for the current path. */
export function breadcrumbTitles(history: string[], index: number): { id: string; title: string; category: Riasec }[] {
  return history.slice(0, index + 1).map((id) => {
    const s = GALAXY_DATA.byId.get(id)!;
    return { id, title: s.title, category: s.category };
  });
}
