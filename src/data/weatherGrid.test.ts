import { describe, it, expect } from 'vitest';
import { gridCoords, nearestSeries } from './weatherGrid';

describe('weather grid', () => {
  it('has ~30 points, all inside 200 km, centre first', () => {
    const g = gridCoords();
    expect(g[0]).toEqual({ lat: 54.99, lon: 73.37 });
    expect(g.length).toBeGreaterThan(20);
    expect(g.length).toBeLessThan(45);
    for (const p of g) {
      const d = Math.hypot((p.lat - 54.99) * 111.2, (p.lon - 73.37) * 111.2 * Math.cos((55 * Math.PI) / 180));
      expect(d).toBeLessThanOrEqual(200.5);
    }
  });
  it('nearestSeries picks the closest point', () => {
    const mk = (lat: number, lon: number, t: number) => ({ lat, lon, hourly: { time: [0], temperature_2m: [t], pressure_msl: [1000], wind_speed_10m: [1], wind_direction_10m: [0], wind_gusts_10m: [1], cloud_cover: [0], precipitation: [0], weather_code: [0] } });
    const grid = { points: [mk(54.99, 73.37, 10), mk(56, 71.5, 20)], fetched_at: '' };
    expect(nearestSeries(grid, 55.9, 71.6)?.temperature_2m[0]).toBe(20);
    expect(nearestSeries(undefined, 55, 73)).toBeNull();
  });
});
