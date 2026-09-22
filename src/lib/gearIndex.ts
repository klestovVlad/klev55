/**
 * Alias index over the gear glossary: one regex that finds every known term in a Russian text
 * (longest alias first, Cyrillic-aware word boundaries). Shared by the term highlighter, the
 * "what to bring" advice and the search.
 */
import type { GearItem } from '@/data/types';

export interface GearIndex {
  re: RegExp | null;
  byAlias: Map<string, GearItem>;
}

export function buildGearIndex(items: GearItem[]): GearIndex {
  const byAlias = new Map<string, GearItem>();
  for (const g of items) for (const a of [g.name, ...g.aliases]) byAlias.set(a.toLowerCase(), g);
  const aliases = [...byAlias.keys()].sort((a, b) => b.length - a.length).map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!aliases.length) return { re: null, byAlias };
  const re = new RegExp(`(?<![а-яёa-z])(${aliases.join('|')})(?![а-яёa-z])`, 'giu');
  return { re, byAlias };
}

/** Distinct glossary items mentioned in a text, in order of first appearance. */
export function termsIn(index: GearIndex, text: string): GearItem[] {
  if (!index.re) return [];
  const out: GearItem[] = [];
  const seen = new Set<string>();
  for (const m of text.matchAll(index.re)) {
    const g = index.byAlias.get(m[0].toLowerCase());
    if (g && !seen.has(g.id)) {
      seen.add(g.id);
      out.push(g);
    }
  }
  return out;
}
