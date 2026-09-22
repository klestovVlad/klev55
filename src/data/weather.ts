/** Live weather from Open-Meteo (CC BY 4.0). One regional series for Omsk; per-spot series on demand. */
import { useQuery } from '@tanstack/react-query';
import type { WeatherSeries } from '@/model/weather';

export interface DailyAstro {
  time: number[];
  sunrise: number[];
  sunset: number[];
}

export interface WeatherBundle {
  hourly: WeatherSeries;
  daily: DailyAstro;
  fetched_at: string;
  lat: number;
  lon: number;
}

const HOURLY = ['temperature_2m', 'pressure_msl', 'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m', 'cloud_cover', 'precipitation', 'weather_code'].join(',');

export async function fetchWeather(lat: number, lon: number): Promise<WeatherBundle> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}&hourly=${HOURLY}&daily=sunrise,sunset&past_days=3&forecast_days=8&wind_speed_unit=ms&timeformat=unixtime&timezone=UTC&models=best_match`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`open-meteo ${res.status}`);
  const j = await res.json();
  return { hourly: j.hourly, daily: j.daily, fetched_at: new Date().toISOString(), lat, lon };
}

/** Rounded to ~0.25° so nearby spots share one forecast (and one cache entry). */
export function useWeather(lat: number, lon: number, enabled = true) {
  const la = Math.round(lat * 4) / 4;
  const lo = Math.round(lon * 4) / 4;
  return useQuery({
    queryKey: ['weather', la, lo],
    queryFn: () => fetchWeather(la, lo),
    enabled,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
    networkMode: 'offlineFirst',
  });
}

export const OMSK = { lat: 54.99, lon: 73.37 };
