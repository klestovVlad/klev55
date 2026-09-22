/** «Мои места»: points the angler saved from the map. Local only, no account. */
import { create } from 'zustand';

export interface Pin {
  id: string;
  name: string;
  lon: number;
  lat: number;
  waterId: number | null;
  created: string; // ISO
}

const KEY = 'klev55.pins';

function load(): Pin[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((p) => p && typeof p.id === 'string' && Number.isFinite(p.lon) && Number.isFinite(p.lat)) : [];
  } catch {
    return [];
  }
}

function save(pins: Pin[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(pins));
  } catch {
    /* private mode */
  }
}

interface PinsState {
  pins: Pin[];
  add: (p: Omit<Pin, 'id' | 'created'>) => Pin;
  remove: (id: string) => void;
  rename: (id: string, name: string) => void;
}

export const usePins = create<PinsState>((set, get) => ({
  pins: load(),
  add: (p) => {
    const pin: Pin = { ...p, id: `p${Date.now().toString(36)}`, created: new Date().toISOString() };
    const pins = [...get().pins, pin];
    save(pins);
    set({ pins });
    return pin;
  },
  remove: (id) => {
    const pins = get().pins.filter((p) => p.id !== id);
    save(pins);
    set({ pins });
  },
  rename: (id, name) => {
    const pins = get().pins.map((p) => (p.id === id ? { ...p, name } : p));
    save(pins);
    set({ pins });
  },
}));

/** The saved pin at these coordinates, if any (within ~30 m). */
export function pinAt(pins: Pin[], lon: number, lat: number): Pin | undefined {
  return pins.find((p) => Math.abs(p.lon - lon) < 0.0004 && Math.abs(p.lat - lat) < 0.0003);
}
