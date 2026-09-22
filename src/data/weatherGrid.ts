/**
 * Regional forecast grid from Open-Meteo: ~33 points ≈ 60 km apart inside the 200 km circle,
 * fetched in ONE request (multi-location API). Feeds the weather map layer and gives every spot
 * the forecast of its nearest grid point instead of the Omsk one.
 */
import { useQuery } from '@tanstack/react-query';
import type { WeatherSeries } from '@/model/weather';

export interface GridPoint {
  lat: number;
  lon: number;
  hourly: WeatherSeries;
}
export interface WeatherGrid {
  points: GridPoint[];
  fetched_at: string;
}

const CENTER = { lat: 54.99, lon: 73.37 };
const RADIUS_KM = 200;
const LAT_STEP = 0.6; // ≈ 67 km
const LON_STEP = 1.0; // ≈ 64 km at 55° N

function km(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const dLat = (bLat - aLat) * 111.2;
  const dLon = (bLon - aLon) * 111.2 * Math.cos(((aLat + bLat) / 2) * (Math.PI / 180));
  return Math.hypot(dLat, dLon);
}

/** Grid coordinates inside the circle, centre first. */
export function gridCoords(): { lat: number; lon: number }[] {
  const out: { lat: number; lon: number }[] = [{ lat: CENTER.lat, lon: CENTER.lon }];
  for (let lat = CENTER.lat - 3 * LAT_STEP; lat <= CENTER.lat + 3 * LAT_STEP + 1e-9; lat += LAT_STEP) {
    for (let lon = CENTER.lon - 3 * LON_STEP; lon <= CENTER.lon + 3 * LON_STEP + 1e-9; lon += LON_STEP) {
      if (Math.abs(lat - CENTER.lat) < 1e-9 && Math.abs(lon - CENTER.lon) < 1e-9) continue;
      if (km(lat, lon, CENTER.lat, CENTER.lon) <= RADIUS_KM) out.push({ lat: +lat.toFixed(2), lon: +lon.toFixed(2) });
    }
  }
  return out;
}

const HOURLY = ['temperature_2m', 'pressure_msl', 'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m', 'cloud_cover', 'precipitation', 'weather_code'].join(',');

export async function fetchWeatherGrid(): Promise<WeatherGrid> {
  const pts = gridCoords();
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${pts.map((p) => p.lat).join(',')}&longitude=${pts.map((p) => p.lon).join(',')}&hourly=${HOURLY}&past_days=3&forecast_days=8&wind_speed_unit=ms&timeformat=unixtime&timezone=UTC&models=best_match`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`open-meteo grid ${res.status}`);
  const j = await res.json();
  const arr = Array.isArray(j) ? j : [j];
  return { points: arr.map((r: any, i: number) => ({ lat: pts[i].lat, lon: pts[i].lon, hourly: r.hourly })), fetched_at: new Date().toISOString() };
}

export function useWeatherGrid() {
  return useQuery({ queryKey: ['weather-grid'], queryFn: fetchWeatherGrid, staleTime: 60 * 60 * 1000, gcTime: 24 * 60 * 60 * 1000, retry: 1, networkMode: 'offlineFirst' });
}

/** Nearest grid point's series for a location (null when the grid is not loaded). */
export function nearestSeries(grid: WeatherGrid | undefined, lat: number, lon: number): WeatherSeries | null {
  if (!grid?.points.length) return null;
  let best = grid.points[0];
  let bd = Infinity;
  for (const p of grid.points) {
    const d = km(lat, lon, p.lat, p.lon);
    if (d < bd) {
      bd = d;
      best = p;
    }
  }
  return best.hourly;
}
