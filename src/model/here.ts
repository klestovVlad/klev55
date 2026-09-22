/**
 * «Точка на воде»: an honest estimate for any coordinate, assembled from indirect data.
 * Weather and rules are exact for the point; the species list comes from the class of water,
 * nearby described places and scientific observations; the chance is a RANGE interpolated from
 * neighbours of the same water class, or absent when there are none. Nothing here pretends to be
 * a described spot: the synthesized Spot exists only so chance()/hydroFor()/RulesToday work unchanged.
 */
import type { FeatureCollection, Point } from 'geojson';
import type { Rules, Species, SpeciesLite, Spot, SpotSpecies, SpotType, WaterProps } from '@/data/types';
import type { HydroSnapshot, WeatherSnapshot, ChanceResult } from './types';
import { chance } from './bite';
import { kmBetween, CENTER } from '@/lib/isofield';

export type WaterClass = 'river' | 'lake' | 'unknown';

export const LAKE_SPOT_TYPES = new Set<SpotType>(['озеро', 'пруд', 'водохранилище', 'платник']);
export const NEIGHBOUR_KM = 30;
export const OBS_KM = 20;

/** Oxbows go with rivers: the rules (spring ban windows) and the wind model treat «старица» as river water. */
export function waterClassOf(t: WaterProps['type'] | undefined | null): WaterClass {
  if (!t) return 'unknown';
  return t === 'river' || t === 'stream' || t === 'canal' || t === 'riverbank' || t === 'oxbow' ? 'river' : 'lake';
}

export function spotTypeOf(t: WaterProps['type'] | undefined | null): SpotType {
  switch (t) {
    case 'river':
    case 'riverbank':
    case 'stream':
    case 'canal':
      return 'река';
    case 'oxbow':
      return 'старица';
    case 'pond':
      return 'пруд';
    case 'reservoir':
      return 'водохранилище';
    default:
      return 'озеро';
  }
}

export function classOfSpot(s: Spot): WaterClass {
  return LAKE_SPOT_TYPES.has(s.type) ? 'lake' : 'river';
}

/** Straight-line-based drive estimate from the Omsk centre, same rule the planner uses for spots without OSRM. */
export function estimateDriveMin(coords: [number, number]): number {
  return Math.round(((kmBetween(coords, CENTER) * 1.3) / 70) * 60);
}

export interface Neighbour {
  spot: Spot;
  km: number;
  w: number; // 1/d² weight
}

/** Described places of the same water class within NEIGHBOUR_KM, nearest first (max n). Unknown class: any. */
export function neighbours(spots: Spot[], coords: [number, number], cls: WaterClass, n = 5, maxKm = NEIGHBOUR_KM): Neighbour[] {
  const out: Neighbour[] = [];
  for (const s of spots) {
    if (cls !== 'unknown' && classOfSpot(s) !== cls) continue;
    const km = kmBetween(coords, s.coords);
    if (km <= maxKm) out.push({ spot: s, km, w: 1 / Math.pow(Math.max(0.5, km), 2) });
  }
  return out.sort((a, b) => a.km - b.km).slice(0, n);
}

/** Nearest described places of any class (for "места рядом"). */
export function nearestSpots(spots: Spot[], coords: [number, number], n = 5): { spot: Spot; km: number }[] {
  return spots
    .map((s) => ({ spot: s, km: kmBetween(coords, s.coords) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, n);
}

/** Observations (GBIF / iNaturalist) within OBS_KM, counted by species id via the latin name. */
export function observationsNear(obs: FeatureCollection | undefined, speciesAll: Pick<SpeciesLite, 'id' | 'names'>[], coords: [number, number], maxKm = OBS_KM): Map<string, number> {
  const out = new Map<string, number>();
  if (!obs) return out;
  const byLat = speciesAll.map((s) => ({ id: s.id, lat: s.names.lat.toLowerCase().split(' ').slice(0, 2).join(' ') }));
  for (const f of obs.features) {
    if (f.geometry?.type !== 'Point') continue;
    const c = (f.geometry as Point).coordinates as [number, number];
    if (kmBetween(coords, c) > maxKm) continue;
    const name = String(f.properties?.species ?? '').toLowerCase();
    const hit = byLat.find((s) => name.startsWith(s.lat));
    if (hit) out.set(hit.id, (out.get(hit.id) ?? 0) + 1);
  }
  return out;
}

const HABITAT_WORDS: Record<Exclude<WaterClass, 'unknown'>, string[]> = {
  river: ['река', 'протока', 'затон', 'речка', 'ручей', 'иртыш', 'омь', 'тара', 'старица'],
  lake: ['озеро', 'пруд', 'старица', 'болото', 'копань', 'озёра'],
};

export type Via = 'места рядом' | 'наблюдения' | 'тип воды';

export interface HereSpecies {
  species: Species;
  via: Via[];
  weight: number;
  obs: number;
  rank: number; // synthesized rank 1–5 for the virtual spot
}

const BAIT = new Set(['leucaspius-delineatus', 'phoxinus-phoxinus', 'gobio-gobio', 'alburnus-alburnus']);

/** Candidate species at the point, best first (max 8). */
export function speciesHere(speciesAll: Species[], cls: WaterClass, water: WaterProps | null, nb: Neighbour[], obsCounts: Map<string, number>): HereSpecies[] {
  const map = new Map<string, HereSpecies>();
  const get = (sp: Species) => {
    let h = map.get(sp.id);
    if (!h) {
      h = { species: sp, via: [], weight: 0, obs: 0, rank: 3 };
      map.set(sp.id, h);
    }
    return h;
  };
  const byId = new Map(speciesAll.map((s) => [s.id, s]));

  // 1. Neighbours: rank-weighted by inverse distance².
  const wsum = nb.reduce((s, n) => s + n.w, 0);
  if (wsum > 0) {
    const acc = new Map<string, { r: number; w: number }>();
    for (const n of nb)
      for (const ss of n.spot.species) {
        const a = acc.get(ss.id) ?? { r: 0, w: 0 };
        a.r += n.w * ss.rank;
        a.w += n.w;
        acc.set(ss.id, a);
      }
    for (const [id, a] of acc) {
      const sp = byId.get(id);
      if (!sp) continue;
      const h = get(sp);
      const share = a.w / wsum; // how much of the neighbourhood lists it
      const rank = a.r / a.w;
      h.weight += (rank / 5) * share;
      h.rank = Math.max(1, Math.min(5, Math.round(rank)));
      h.via.push('места рядом');
    }
  }
  // 2. Observations within OBS_KM.
  for (const [id, n] of obsCounts) {
    const sp = byId.get(id);
    if (!sp) continue;
    const h = get(sp);
    h.obs = n;
    h.weight += 0.6 * Math.min(n, 5) / 5;
    h.via.push('наблюдения');
  }
  // 3. Habitat: the class of water says who lives in it (common/local, legal, not bait-sized, not paid-pond only).
  if (cls !== 'unknown') {
    const words = HABITAT_WORDS[cls];
    const oxbow = water?.type === 'oxbow';
    for (const sp of speciesAll) {
      if (sp.status.legal === 'banned' || sp.presence === 'rare' || BAIT.has(sp.id)) continue;
      if (sp.presence === 'stocked' && water?.type !== 'pond') continue;
      const types = sp.habitat.water_types.map((t) => t.toLowerCase());
      const fits = types.some((t) => words.some((w) => t.includes(w))) || (oxbow && types.some((t) => t.includes('старица')));
      if (!fits) continue;
      const h = get(sp);
      h.weight += sp.presence === 'common' ? 0.3 : 0.15;
      h.via.push('тип воды');
    }
  }
  return [...map.values()]
    .filter((h) => h.via.length)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 8);
}

/** A Spot-shaped record for the point so the rest of the model runs on it unchanged. */
export function virtualSpot(coords: [number, number], water: WaterProps | null, nb: Neighbour[], here: HereSpecies[], driveMin: number | null): Spot {
  const wsum = nb.reduce((s, n) => s + n.w, 0) || 1;
  const monthW = new Map<number, number>();
  const methodsBy = new Map<string, Map<string, number>>();
  const seasonsBy = new Map<string, Set<Spot['species'][number]['seasons'][number]>>();
  for (const n of nb) {
    for (const m of n.spot.best_months) monthW.set(m, (monthW.get(m) ?? 0) + n.w);
    for (const ss of n.spot.species) {
      const mm = methodsBy.get(ss.id) ?? new Map<string, number>();
      for (const me of ss.methods) mm.set(me, (mm.get(me) ?? 0) + n.w);
      methodsBy.set(ss.id, mm);
      const se = seasonsBy.get(ss.id) ?? new Set();
      for (const s of ss.seasons) se.add(s);
      seasonsBy.set(ss.id, se);
    }
  }
  const best_months = [...monthW.entries()].filter(([, w]) => w / wsum >= 0.5).map(([m]) => m).sort((a, b) => a - b);
  const species: SpotSpecies[] = here
    .filter((h) => h.via.includes('места рядом'))
    .map((h) => ({
      id: h.species.id,
      rank: h.rank as SpotSpecies['rank'],
      seasons: [...(seasonsBy.get(h.species.id) ?? [])],
      methods: [...(methodsBy.get(h.species.id)?.entries() ?? [])].sort((a, b) => b[1] - a[1]).map(([m]) => m as SpotSpecies['methods'][number]),
      note: '',
    }));
  const type = water?.type === 'oxbow' ? 'старица' : spotTypeOf(water?.type);
  return {
    id: `pin:${coords[0].toFixed(4)},${coords[1].toFixed(4)}`,
    name: water?.name || 'Точка на карте',
    coords,
    water_osm_id: water?.osm_id ?? null,
    water_name: water?.name ?? '',
    type,
    district: '',
    distance_km: Math.round(kmBetween(coords, CENTER)),
    drive_min: driveMin,
    drive_source: 'estimate',
    access: { car: '', foot: true, boat: false, winter: '' },
    features: [],
    species,
    best_months,
    best_hours_note: '',
    depth_note: '',
    notes: '',
    lifehacks: [],
    ice_spot: true,
    confidence: 0,
    corroborated_by: [],
    provenance: 'generated',
  };
}

export interface ChanceRange {
  lo: number;
  hi: number;
  result: ChanceResult; // at the neighbours' mean rank: legality, factors, mode
}

/**
 * Chance as a range: the model run with the lowest and the highest rank the neighbours give the
 * species. null when no neighbour lists it (nothing to interpolate from).
 */
export function chanceRange(vs: Spot, species: SpeciesLite, nb: Neighbour[], date: Date, weather: WeatherSnapshot | null, hydro: HydroSnapshot | null, rules: Rules | null): ChanceRange | null {
  const ranks = nb.flatMap((n) => n.spot.species.filter((s) => s.id === species.id).map((s) => s.rank));
  if (!ranks.length) return null;
  const withRank = (r: number): Spot => ({ ...vs, species: vs.species.map((s) => (s.id === species.id ? { ...s, rank: r as SpotSpecies['rank'] } : s)) });
  const lo = chance({ spot: withRank(Math.min(...ranks)), species, date, weather, hydro, rules });
  const hi = chance({ spot: withRank(Math.max(...ranks)), species, date, weather, hydro, rules });
  const mid = chance({ spot: vs, species, date, weather, hydro, rules });
  let a = Math.min(lo.score, hi.score);
  let b = Math.max(lo.score, hi.score);
  if (mid.legal !== 'banned' && b - a < 8) {
    // One neighbour or unanimous ranks: still an interpolation, so never a point value.
    a = Math.max(0, mid.score - 5);
    b = Math.min(100, mid.score + 5);
  }
  return { lo: a, hi: b, result: mid };
}
