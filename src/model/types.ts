import type { SpeciesLite as Species, Spot, Rules } from '@/data/types';

/** Weather at a single hour, already derived from the hourly series (see weatherAt). */
export interface WeatherSnapshot {
  time: string; // ISO of the hour
  temp_c: number;
  pressure_msl: number; // hPa
  pressure_trend_24h: number; // hPa now − 24 h ago
  pressure_range_72h: number; // max − min over the last 72 h
  wind_speed: number; // m/s
  wind_dir: number; // degrees, from
  gusts: number; // m/s
  cloud: number; // %
  precip: number; // mm/h
  weather_code: number; // WMO
  temp_change_24h: number; // °C, daily mean now − daily mean yesterday
}

export interface HydroSnapshot {
  gauge_name: string | null;
  gauge_km: number | null; // distance spot → gauge
  level_trend_cm_24h: number | null;
  water_temp_c: number | null;
  ice_on: boolean; // is the spot under ice
  ice_thickness_cm: number | null; // estimate
  ice_days: number | null; // days since ice-on (for перволёдье)
  days_to_ice_off: number | null; // estimated (for последний лёд)
  zone: { name: string; inside: boolean; distance_m: number } | null; // active prohibited zone nearby
}

export interface Factor {
  name: string;
  effect: number; // −30..+30
  reason: string;
}

export type Legal = 'ok' | 'restricted' | 'banned';

export interface ChanceResult {
  score: number; // 0–100
  legal: Legal;
  legal_reason: string | null;
  factors: Factor[]; // sorted by |effect| desc
  mode: 'openwater' | 'ice';
}

export interface ChanceInput {
  spot: Spot;
  species: Species;
  date: Date;
  weather: WeatherSnapshot | null;
  hydro: HydroSnapshot | null;
  rules: Rules | null;
}
