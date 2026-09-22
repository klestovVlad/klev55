import { create } from 'zustand';
import type { MethodName } from '@/data/types';

export type Theme = 'light' | 'dark' | 'auto';

interface State {
  /** Selected species filter (id) or null = any. */
  speciesId: string | null;
  method: MethodName | null;
  maxMin: number | null; // max drive time in minutes, null = any
  iceOnly: boolean;
  freeOnly: boolean;
  /** Hours from now on the scrubber (0 = now). Beyond 48 it steps by day. */
  hoursAhead: number;
  /** Selected spot id (opens the sheet). */
  spotId: string | null;
  /** Layers/filters panel on the map is open (mobile collapses the sheet meanwhile). */
  panelOpen: boolean;
  /** Selected water osm_id (opens the water sheet). */
  waterId: number | null;
  /** A dropped pin [lon, lat]: the «точка на воде» estimate is built for it (with waterId when it lies on known water). */
  pin: [number, number] | null;
  /** Where the pin came from: dropped on the map (stay put) or chosen from a list/search (centre the map on it). */
  pinFrom: 'map' | 'list';
  layers: { infra: boolean; observations: boolean; satellite: boolean; zones: boolean; zonesAll: boolean; weather: boolean; heat: boolean; particles: boolean };
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
  maxMin: null,
  iceOnly: false,
  freeOnly: false,
  hoursAhead: 0,
  spotId: null,
  panelOpen: false,
  waterId: null,
  pin: null,
  pinFrom: 'map',
  layers: { infra: true, observations: false, satellite: false, zones: true, zonesAll: false, weather: true, heat: true, particles: false },
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
