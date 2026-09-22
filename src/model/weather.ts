/**
 * Adapter from an Open-Meteo hourly response (timeformat=unixtime, past_days≥3)
 * to the per-hour WeatherSnapshot the model consumes.
 */
import type { WeatherSnapshot } from './types';

export interface WeatherSeries {
  time: number[]; // unix seconds
  temperature_2m: number[];
  pressure_msl: number[];
  wind_speed_10m: number[]; // m/s (request wind_speed_unit=ms)
  wind_direction_10m: number[];
  wind_gusts_10m: number[];
  cloud_cover: number[];
  precipitation: number[];
  weather_code: number[];
}

function mean(a: number[], from: number, to: number): number {
  let s = 0;
  let n = 0;
  for (let i = Math.max(0, from); i <= to && i < a.length; i++) {
    const v = a[i];
    if (v == null || Number.isNaN(v)) continue;
    s += v;
    n++;
  }
  return n ? s / n : NaN;
}

export function indexAt(series: WeatherSeries, date: Date): number {
  const ts = Math.floor(date.getTime() / 1000);
  const t = series.time;
  if (!t.length || ts < t[0] - 1800 || ts > t[t.length - 1] + 1800) return -1;
  // Hourly, regular: direct computation then guard.
  const i = Math.round((ts - t[0]) / 3600);
  return i >= 0 && i < t.length ? i : -1;
}

export function weatherAt(series: WeatherSeries | null, date: Date): WeatherSnapshot | null {
  if (!series) return null;
  const i = indexAt(series, date);
  if (i < 0) return null;
  const p = series.pressure_msl;
  const back24 = i - 24 >= 0 ? p[i - 24] : p[0];
  let pmax = -Infinity;
  let pmin = Infinity;
  for (let k = Math.max(0, i - 72); k <= i; k++) {
    if (p[k] > pmax) pmax = p[k];
    if (p[k] < pmin) pmin = p[k];
  }
  const tNow = mean(series.temperature_2m, i - 23, i);
  const tPrev = mean(series.temperature_2m, i - 47, i - 24);
  return {
    time: new Date(series.time[i] * 1000).toISOString(),
    temp_c: series.temperature_2m[i],
    pressure_msl: p[i],
    pressure_trend_24h: p[i] - back24,
    pressure_range_72h: Number.isFinite(pmax - pmin) ? pmax - pmin : 0,
    wind_speed: series.wind_speed_10m[i],
    wind_dir: series.wind_direction_10m[i],
    gusts: series.wind_gusts_10m[i] ?? series.wind_speed_10m[i],
    cloud: series.cloud_cover[i],
    precip: series.precipitation[i],
    weather_code: series.weather_code[i],
    temp_change_24h: Number.isNaN(tPrev) ? 0 : tNow - tPrev,
  };
}
