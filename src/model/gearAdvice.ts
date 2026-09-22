/**
 * «Что брать»: which of the species' methods fit the moment (season, ice, what the place is
 * fished with) and which glossary items they need. Pure; the UI adds the ✓ from the angler's box.
 */
import type { GearItem, MethodName, Season, Species, SpeciesMethod } from '@/data/types';
import { buildGearIndex, termsIn, type GearIndex } from '@/lib/gearIndex';
import { omskParts } from '@/lib/time';

export const ICE_METHODS = new Set<MethodName>(['жерлицы', 'мормышка', 'балансир', 'блесна']);

export function seasonOf(date: Date, ice = false): Season {
  if (ice) return 'зима';
  const m = omskParts(date).month;
  if (m === 12 || m <= 3) return 'зима';
  if (m <= 5) return 'весна';
  if (m <= 8) return 'лето';
  return 'осень';
}

export interface GearPickItem {
  id: string | null; // glossary id when the text matched a card
  label: string; // the text as written by the author ("джиг 10–14 г")
  role: 'наживка' | 'приманка' | 'оснастка' | 'снасть';
}

export interface GearPick {
  method: SpeciesMethod;
  items: GearPickItem[]; // deduplicated, glossary items first
  fitsSeason: boolean;
}

export interface GearAdviceOptions {
  season: Season;
  ice: boolean;
  spotMethods?: MethodName[]; // how this particular place is fished (first = most common)
  glossary: GearItem[];
  index?: GearIndex; // prebuilt alias index (planner scores many species; building the regex each time is the cost)
  max?: number;
}

export function pickItems(index: GearIndex, m: SpeciesMethod): GearPickItem[] {
  const out: GearPickItem[] = [];
  const seen = new Set<string>();
  const push = (label: string, role: GearPickItem['role'], id: string | null) => {
    const key = id ?? label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ id, label, role });
  };
  for (const b of m.baits) {
    const t = termsIn(index, b)[0];
    push(b, 'наживка', t?.id ?? null);
  }
  for (const l of m.lures) {
    const t = termsIn(index, l)[0];
    push(l, 'приманка', t?.id ?? null);
  }
  for (const t of termsIn(index, m.rig)) push(t.name, t.kind === 'снасть' ? 'снасть' : 'оснастка', t.id);
  for (const t of termsIn(index, m.gear)) push(t.name, t.kind, t.id);
  return out.slice(0, 9);
}

/** Methods worth taking for this species now, best first; 1–3 entries. */
export function gearAdvice(species: Pick<Species, 'methods'>, opts: GearAdviceOptions): GearPick[] {
  const methods = species.methods ?? [];
  if (!methods.length) return [];
  const index = opts.index ?? buildGearIndex(opts.glossary);
  const byMode = methods.filter((m) => (opts.ice ? ICE_METHODS.has(m.name) : !ICE_METHODS.has(m.name)));
  const pool = byMode.length ? byMode : methods;
  const spotOrder = opts.spotMethods ?? [];
  const ranked = pool
    .map((m, i) => {
      const fitsSeason = m.seasons.includes(opts.season);
      const atSpot = spotOrder.indexOf(m.name);
      // Season fit first, then the place's own habits, then the author's order.
      const key = (fitsSeason ? 0 : 100) + (atSpot === -1 ? 50 : atSpot) + i * 0.1;
      return { m, fitsSeason, key };
    })
    .sort((a, b) => a.key - b.key);
  return ranked.slice(0, opts.max ?? 2).map(({ m, fitsSeason }) => ({ method: m, items: pickItems(index, m), fitsSeason }));
}
