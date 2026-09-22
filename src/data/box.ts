/** «Мой ящик»: glossary ids the angler owns. Local only (no account), survives reloads. */
import { create } from 'zustand';

const KEY = 'klev55.box';

function load(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function save(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* private mode */
  }
}

interface BoxState {
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
}

export const useBox = create<BoxState>((set, get) => ({
  ids: load(),
  toggle: (id) =>
    set((s) => {
      const ids = s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id];
      save(ids);
      return { ids };
    }),
  has: (id) => get().ids.includes(id),
}));
