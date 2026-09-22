/**
 * «С вашим ящиком»: how well the angler's box covers a species' methods. The box holds glossary
 * classes, not sizes, so «покрыто» means «класс есть». A method whose texts name no glossary item
 * is unknown, never impossible.
 */
import type { GearItem, MethodName, Season, Species } from '@/data/types';
import { gearAdvice, type GearPick, type GearPickItem } from './gearAdvice';
import type { GearIndex } from '@/lib/gearIndex';

export type CoverLevel = 'full' | 'partial' | 'none' | 'unknown';

export interface MethodCoverage {
  pick: GearPick;
  level: CoverLevel;
  have: GearPickItem[];
  missing: GearPickItem[]; // one representative per uncovered role group
}

export interface SpeciesCoverage {
  best: MethodCoverage | null; // highest level, then season fit
  all: MethodCoverage[];
}

const ORDER: Record<CoverLevel, number> = { full: 0, partial: 1, unknown: 2, none: 3 };

/** Roles that must each be covered for «full»: the rod, the rig, and something on the hook. */
function group(role: GearPickItem['role']): 'снасть' | 'оснастка' | 'насадка' {
  return role === 'снасть' ? 'снасть' : role === 'оснастка' ? 'оснастка' : 'насадка';
}

export function methodCoverage(pick: GearPick, box: Set<string>): MethodCoverage {
  const known = pick.items.filter((i) => i.id);
  if (!known.length) return { pick, level: 'unknown', have: [], missing: [] };
  const have = known.filter((i) => box.has(i.id!));
  const groups = new Map<string, GearPickItem[]>();
  for (const i of known) {
    const g = group(i.role);
    groups.set(g, [...(groups.get(g) ?? []), i]);
  }
  const missing: GearPickItem[] = [];
  for (const [, items] of groups) if (!items.some((i) => box.has(i.id!))) missing.push(items[0]);
  const level: CoverLevel = missing.length === 0 ? 'full' : have.length ? 'partial' : 'none';
  return { pick, level, have, missing };
}

export function speciesCoverage(species: Pick<Species, 'methods'>, box: Set<string>, opts: { season: Season; ice: boolean; spotMethods?: MethodName[]; glossary: GearItem[]; index?: GearIndex }): SpeciesCoverage {
  const picks = gearAdvice(species, { ...opts, max: 10 });
  const all = picks.map((p) => methodCoverage(p, box)).sort((a, b) => ORDER[a.level] - ORDER[b.level] || Number(b.pick.fitsSeason) - Number(a.pick.fitsSeason));
  return { best: all[0] ?? null, all };
}
