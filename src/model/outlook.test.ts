import { describe, it, expect } from 'vitest';
import { bestWindows, dailyOutlook, hourly } from './outlook';
import { weatherAt, type WeatherSeries } from './weather';
import { pike, riverSpot, rules, hydro } from './fixtures';
import { omskDate } from '@/lib/time';

function series(start: Date, hours: number): WeatherSeries {
  const t0 = Math.floor(start.getTime() / 1000);
  const n = hours;
  const arr = (f: (i: number) => number) => Array.from({ length: n }, (_, i) => f(i));
  return {
    time: arr((i) => t0 + i * 3600),
    temperature_2m: arr((i) => 10 + 5 * Math.sin((i / 24) * 2 * Math.PI)),
    pressure_msl: arr((i) => 1010 + (i > 100 ? 10 : 0)),
    wind_speed_10m: arr(() => 3),
    wind_direction_10m: arr(() => 200),
    wind_gusts_10m: arr(() => 5),
    cloud_cover: arr(() => 50),
    precipitation: arr(() => 0),
    weather_code: arr(() => 2),
  };
}

describe('weatherAt', () => {
  it('returns null outside the series and a snapshot inside', () => {
    const start = omskDate(2026, 9, 20, 0);
    const s = series(start, 24 * 10);
    expect(weatherAt(s, omskDate(2026, 9, 1, 0))).toBeNull();
    const w = weatherAt(s, omskDate(2026, 9, 24, 12))!;
    expect(w).not.toBeNull();
    expect(w.pressure_trend_24h).toBe(10); // i=108 is after the step at 101, i−24=84 before it
    expect(w.wind_speed).toBe(3);
  });
});

describe('outlook', () => {
  const ctx = { spot: riverSpot, species: pike, series: series(omskDate(2026, 9, 20, 0), 24 * 10), hydro: hydro(), rules };
  it('hourly() yields one score per hour', () => {
    const hs = hourly(ctx, omskDate(2026, 9, 23, 0), 48);
    expect(hs).toHaveLength(48);
    expect(hs.every((h) => h.score >= 0 && h.score <= 100)).toBe(true);
  });
  it('bestWindows finds contiguous windows of ≥ 2 h', () => {
    const hs = hourly(ctx, omskDate(2026, 9, 23, 0), 24);
    const w = bestWindows(hs);
    expect(w.length).toBeGreaterThan(0);
    for (const win of w) expect(win.to.getTime() - win.from.getTime()).toBeGreaterThanOrEqual(3600000);
  });
  it('dailyOutlook returns 7 days with a best window each', () => {
    const d = dailyOutlook(ctx, omskDate(2026, 9, 23, 9), 7);
    expect(d).toHaveLength(7);
    expect(d[0].score).toBeGreaterThan(0);
  });
  it('bestWindows returns nothing when everything is poor', () => {
    const hs = Array.from({ length: 24 }, (_, i) => ({ date: omskDate(2026, 9, 23, i), score: 10, legal: 'ok' as const }));
    expect(bestWindows(hs)).toEqual([]);
  });
});
