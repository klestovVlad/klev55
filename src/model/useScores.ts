/** Scores every spot for the current filters and scrubber time. Used by the map, the list and the planner. */
import { useMemo } from 'react';
import { useStore, scrubberDate } from '@/app/store';
import { useGauges, useRules, useSpecies, useSpots, useZones } from '@/data/load';
import { useWeather, OMSK } from '@/data/weather';
import { chance } from './bite';
import { weatherAt } from './weather';
import { hydroFor } from './hydro';
import type { ChanceResult } from './types';
import type { Species, Spot } from '@/data/types';

export interface SpotScore {
  spot: Spot;
  species: Species; // the species the score is for
  result: ChanceResult;
  alternatives: { species: Species; result: ChanceResult }[]; // other species at the spot, sorted
}

export function useAllData() {
  const species = useSpecies();
  const spots = useSpots();
  const rules = useRules();
  const gauges = useGauges();
  const zones = useZones();
  const weather = useWeather(OMSK.lat, OMSK.lon);
  return { species, spots, rules, gauges, zones, weather, ready: !!species.data && !!spots.data };
}

export function useSpotScores(opts: { date?: Date } = {}): { scores: SpotScore[]; date: Date; ready: boolean; offline: boolean } {
  const { speciesId, method, maxKm, iceOnly, freeOnly, hoursAhead } = useStore();
  const d = useAllData();
  const date = opts.date ?? scrubberDate(hoursAhead);
  const dateKey = Math.floor(date.getTime() / 3600000);
  const scores = useMemo(() => {
    if (!d.species.data || !d.spots.data) return [];
    const byId = new Map(d.species.data.items.map((s) => [s.id, s]));
    const w = weatherAt(d.weather.data?.hourly ?? null, date);
    const out: SpotScore[] = [];
    for (const spot of d.spots.data.items) {
      if (maxKm != null && spot.distance_km > maxKm) continue;
      if (iceOnly && !spot.ice_spot) continue;
      if (freeOnly && spot.type === 'платник') continue;
      const hydro = hydroFor(spot, d.gauges.data?.items, d.gauges.data?.ice, d.zones.data, date);
      let candidates = spot.species.filter((s) => byId.has(s.id));
      if (speciesId) candidates = candidates.filter((s) => s.id === speciesId);
      if (method) candidates = candidates.filter((s) => s.methods.includes(method));
      if (!candidates.length) {
        if (speciesId && !method) {
          // species not listed here: still score it (fit factor says "не отмечен") so the map stays informative but muted
          const sp = byId.get(speciesId)!;
          const r = chance({ spot, species: sp, date, weather: w, hydro, rules: d.rules.data ?? null });
          out.push({ spot, species: sp, result: r, alternatives: [] });
        }
        continue;
      }
      const ranked = candidates
        .sort((a, b) => b.rank - a.rank)
        .slice(0, 5)
        .map((s) => {
          const sp = byId.get(s.id)!;
          return { species: sp, result: chance({ spot, species: sp, date, weather: w, hydro, rules: d.rules.data ?? null }) };
        })
        .sort((a, b) => b.result.score - a.result.score);
      out.push({ spot, species: ranked[0].species, result: ranked[0].result, alternatives: ranked });
    }
    return out.sort((a, b) => b.result.score - a.result.score || (a.spot.drive_min ?? 999) - (b.spot.drive_min ?? 999));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.species.data, d.spots.data, d.rules.data, d.gauges.data, d.zones.data, d.weather.data, speciesId, method, maxKm, iceOnly, freeOnly, dateKey]);
  return { scores, date, ready: d.ready, offline: d.weather.isError || (!d.weather.data && !d.weather.isPending) };
}
