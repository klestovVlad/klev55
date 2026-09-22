import { create } from 'zustand';
import type { MethodName } from '@/data/types';

export type Theme = 'light' | 'dark' | 'auto';

interface State {
  /** Selected species filter (id) or null = any. */
  speciesId: string | null;
  method: MethodName | null;
  maxKm: number | null; // null = any
  iceOnly: boolean;
  freeOnly: boolean;
  /** Hours from now on the scrubber (0 = now). Beyond 48 it steps by day. */
  hoursAhead: number;
  /** Selected spot id (opens the sheet). */
  spotId: string | null;
  /** Selected water osm_id (opens the water sheet). */
  waterId: number | null;
  layers: { infra: boolean; observations: boolean; satellite: boolean; zones: boolean };
  theme: Theme;
  set: (p: Partial<State>) => void;
  toggleLayer: (k: keyof State['layers']) => void;
}

const savedTheme = ((): Theme => {
  try {
    return (localStorage.getItem('klev55.theme') as Theme) || 'auto';
  } catch {
    return 'auto';
  }
})();

export const useStore = create<State>((set) => ({
  speciesId: null,
  method: null,
  maxKm: null,
  iceOnly: false,
  freeOnly: false,
  hoursAhead: 0,
  spotId: null,
  waterId: null,
  layers: { infra: false, observations: false, satellite: false, zones: true },
  theme: savedTheme,
  set: (p) => set(p),
  toggleLayer: (k) => set((s) => ({ layers: { ...s.layers, [k]: !s.layers[k] } })),
}));

export function applyTheme(t: Theme) {
  const root = document.documentElement;
  if (t === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', t);
  try {
    localStorage.setItem('klev55.theme', t);
  } catch {
    /* private mode */
  }
}

/** The instant the scrubber points at. */
export function scrubberDate(hoursAhead: number, now = new Date()): Date {
  const d = new Date(now);
  d.setMinutes(0, 0, 0);
  return new Date(d.getTime() + hoursAhead * 3600000);
}
