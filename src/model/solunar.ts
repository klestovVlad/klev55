import * as SunCalc from 'suncalc';
import { startOfOmskDay } from '@/lib/time';

export interface SolunarDay {
  sunrise: Date;
  sunset: Date;
  dawn: Date; // civil
  dusk: Date; // civil
  moonrise: Date | null;
  moonset: Date | null;
  transit: Date | null; // moon highest
  underfoot: Date | null; // moon lowest
  phase: number; // 0..1
  illumination: number; // 0..1
}

const cache = new Map<string, SolunarDay>();

/** Sun and moon events for the Omsk calendar day containing `date`. */
export function solunarDay(date: Date, lat: number, lon: number): SolunarDay {
  const day0 = startOfOmskDay(date);
  const key = `${day0.getTime()}|${lat.toFixed(2)}|${lon.toFixed(2)}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const noon = new Date(day0.getTime() + 12 * 3600000);
  const sun = SunCalc.getTimes(noon, lat, lon);
  const moonTimes = SunCalc.getMoonTimes(day0, lat, lon);
  const illum = SunCalc.getMoonIllumination(noon);

  // Transit / underfoot: scan the day in 10-minute steps for altitude extremes.
  let maxAlt = -Infinity;
  let minAlt = Infinity;
  let transit: Date | null = null;
  let underfoot: Date | null = null;
  for (let m = 0; m < 24 * 60; m += 10) {
    const t = new Date(day0.getTime() + m * 60000);
    const alt = SunCalc.getMoonPosition(t, lat, lon).altitude;
    if (alt > maxAlt) {
      maxAlt = alt;
      transit = t;
    }
    if (alt < minAlt) {
      minAlt = alt;
      underfoot = t;
    }
  }

  const res: SolunarDay = {
    sunrise: sun.sunrise as Date,
    sunset: sun.sunset as Date,
    dawn: sun.dawn as Date,
    dusk: sun.dusk as Date,
    moonrise: moonTimes.rise ?? null,
    moonset: moonTimes.set ?? null,
    transit,
    underfoot,
    phase: illum.phase,
    illumination: illum.fraction,
  };
  cache.set(key, res);
  return res;
}

export interface SolunarHit {
  major: boolean; // within ±1 h of transit/underfoot
  minor: boolean; // within ±30 min of moonrise/moonset
  twilight: boolean; // within ±45 min of civil dawn/dusk
}

function near(t: Date, ev: Date | null, minutes: number): boolean {
  return !!ev && Math.abs(t.getTime() - ev.getTime()) <= minutes * 60000;
}

export function solunarAt(date: Date, lat: number, lon: number): SolunarHit {
  const d = solunarDay(date, lat, lon);
  return {
    major: near(date, d.transit, 60) || near(date, d.underfoot, 60),
    minor: near(date, d.moonrise, 30) || near(date, d.moonset, 30),
    twilight: near(date, d.dawn, 45) || near(date, d.dusk, 45),
  };
}

export function moonPhaseName(phase: number): string {
  if (phase < 0.03 || phase > 0.97) return 'новолуние';
  if (phase < 0.22) return 'растущий серп';
  if (phase < 0.28) return 'первая четверть';
  if (phase < 0.47) return 'растущая луна';
  if (phase < 0.53) return 'полнолуние';
  if (phase < 0.72) return 'убывающая луна';
  if (phase < 0.78) return 'последняя четверть';
  return 'старый серп';
}
