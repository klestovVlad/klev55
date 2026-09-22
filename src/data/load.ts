/** Static data loaders (TanStack Query). Files live in public/data and are precached by the service worker. */
import { useQuery } from '@tanstack/react-query';
import type { Advice, GaugesFile, Rules, SpeciesFile, SpotsFile } from './types';
import type { FeatureCollection } from 'geojson';

const base = import.meta.env.BASE_URL;

async function getJson<T>(name: string): Promise<T> {
  const res = await fetch(`${base}data/${name}`);
  if (!res.ok) throw new Error(`${name}: ${res.status}`);
  return res.json();
}

const staticOpts = { staleTime: Infinity, gcTime: Infinity, retry: 1 } as const;

export const useSpecies = () => useQuery({ queryKey: ['species'], queryFn: () => getJson<SpeciesFile>('species.json'), ...staticOpts });
export const useSpots = () => useQuery({ queryKey: ['spots'], queryFn: () => getJson<SpotsFile>('spots.json'), ...staticOpts });
export const useRules = () => useQuery({ queryKey: ['rules'], queryFn: () => getJson<Rules>('rules.json'), ...staticOpts });
export const useAdvice = () => useQuery({ queryKey: ['advice'], queryFn: () => getJson<Advice>('advice.json'), ...staticOpts });
export const useGauges = () => useQuery({ queryKey: ['gauges'], queryFn: () => getJson<GaugesFile & { ice: IceEstimate[]; thresholds_cm: Record<string, number> }>('gauges.json'), ...staticOpts });
export const useZones = () => useQuery({ queryKey: ['zones'], queryFn: () => getJson<FeatureCollection>('zones.geojson'), ...staticOpts });
export const useWater = () => useQuery({ queryKey: ['water'], queryFn: () => getJson<FeatureCollection>('water.geojson'), ...staticOpts });
export const useObservations = (enabled: boolean) =>
  useQuery({ queryKey: ['observations'], queryFn: () => getJson<FeatureCollection>('observations.geojson'), enabled, ...staticOpts });

export interface IceEstimate {
  station: string;
  kind: 'river' | 'lake';
  state: 'none' | 'forming' | 'solid' | 'rotting' | 'off';
  ice_on: string | null;
  thickness_cm: number | null;
  fdd: number;
  days_since_ice_on: number | null;
  est_ice_off: string | null;
  note: string;
  provenance: 'generated';
}
