/** Assembles the «точка на воде» estimate for a coordinate from every loaded data source. */
import { useMemo } from 'react';
import type { FeatureCollection } from 'geojson';
import { useObservations, useSpeciesFull, useWater } from '@/data/load';
import { useAllData } from './useScores';
import { nearestSeries } from '@/data/weatherGrid';
import { weatherAt } from './weather';
import { hydroFor } from './hydro';
import { bestWindows, hourly } from './outlook';
import { startOfOmskDay, addHours } from '@/lib/time';
import { kmBetween } from '@/lib/isofield';
import { chanceRange, estimateDriveMin, neighbours, nearestSpots, observationsNear, speciesHere, virtualSpot, waterClassOf, type ChanceRange, type HereSpecies, type Neighbour, type WaterClass } from './here';
import type { Species, Spot, WaterProps } from '@/data/types';
import type { HydroSnapshot, WeatherSnapshot } from './types';
import type { WeatherSeries } from './weather';

export interface HereEstimate {
  coords: [number, number];
  water: WaterProps | null;
  cls: WaterClass;
  spot: Spot; // the virtual spot
  nb: Neighbour[];
  nearest: { spot: Spot; km: number }[];
  species: (HereSpecies & { range: ChanceRange | null; window: { from: Date; to: Date } | null })[];
  weather: WeatherSnapshot | null;
  series: WeatherSeries | null;
  weatherKm: number | null; // distance to the forecast cell
  hydro: HydroSnapshot;
  obsTotal: number;
  driveMin: number;
  ready: boolean;
}

export function useHere(coords: [number, number] | null, waterId: number | null, date: Date): HereEstimate | null {
  const d = useAllData();
  const full = useSpeciesFull();
  const water = useWater(true);
  const obs = useObservations(true);
  const dateKey = Math.floor(date.getTime() / 3600000);
  return useMemo(() => {
    if (!coords) return null;
    const wf = waterId != null ? water.data?.features.find((f) => f.properties?.osm_id === waterId) : undefined;
    const wp = (wf?.properties as WaterProps | undefined) ?? null;
    const cls = waterClassOf(wp?.type);
    const spots = d.spots.data?.items ?? [];
    const speciesAll = (full.data?.items ?? []) as Species[];
    const nb = neighbours(spots, coords, cls);
    const nearest = nearestSpots(spots, coords, 5);
    const counts = observationsNear(obs.data as FeatureCollection | undefined, speciesAll, coords);
    const here = speciesHere(speciesAll, cls, wp, nb, counts);
    const driveMin = estimateDriveMin(coords);
    const vs = virtualSpot(coords, wp, nb, here, driveMin);
    const series = nearestSeries(d.weather.data, coords[1], coords[0]);
    let weatherKm: number | null = null;
    if (d.weather.data?.points.length) weatherKm = Math.round(Math.min(...d.weather.data.points.map((p) => kmBetween(coords, [p.lon, p.lat]))));
    const weather = weatherAt(series, date);
    const hydro = hydroFor(vs, d.gauges.data?.items, d.gauges.data?.ice, d.zones.data, date);
    const rules = d.rules.data ?? null;
    const species = here
      .map((h) => {
        const range = chanceRange(vs, h.species, nb, date, weather, hydro, rules);
        let window: { from: Date; to: Date } | null = null;
        if (range && range.result.legal !== 'banned') {
          const hs = hourly({ spot: vs, species: h.species, series, hydro, rules }, addHours(startOfOmskDay(date), 4), 19);
          const win = bestWindows(hs, 1)[0];
          if (win) window = { from: win.from, to: addHours(win.to, 1) };
        }
        return { ...h, range, window };
      })
      .sort((a, b) => (b.range?.hi ?? -1) - (a.range?.hi ?? -1) || b.weight - a.weight);
    let obsTotal = 0;
    for (const n of counts.values()) obsTotal += n;
    return { coords, water: wp, cls, spot: vs, nb, nearest, species, weather, series, weatherKm, hydro, obsTotal, driveMin, ready: !!full.data && !!d.spots.data };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords?.[0], coords?.[1], waterId, water.data, d.spots.data, full.data, obs.data, d.weather.data, d.gauges.data, d.zones.data, d.rules.data, dateKey]);
}
