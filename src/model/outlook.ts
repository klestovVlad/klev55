/** Best hours and multi-day outlook built on chance(). */
import { chance } from './bite';
import { weatherAt, type WeatherSeries } from './weather';
import type { ChanceInput, HydroSnapshot } from './types';
import type { Rules, Species, Spot } from '@/data/types';
import { addHours, startOfOmskDay, omskParts } from '@/lib/time';

export interface HourScore {
  date: Date;
  score: number;
  legal: 'ok' | 'restricted' | 'banned';
}

export interface Window {
  from: Date;
  to: Date; // exclusive end hour
  score: number; // mean
}

export interface DayOutlook {
  date: Date; // start of Omsk day
  score: number; // max over daylight-ish hours 4–22
  best: Window | null;
  legal: 'ok' | 'restricted' | 'banned';
}

export interface OutlookContext {
  spot: Spot;
  species: Species;
  series: WeatherSeries | null;
  hydro: HydroSnapshot | null;
  rules: Rules | null;
}

export function hourly(ctx: OutlookContext, from: Date, hours: number): HourScore[] {
  const out: HourScore[] = [];
  for (let h = 0; h < hours; h++) {
    const date = addHours(from, h);
    const input: ChanceInput = { ...ctx, date, weather: weatherAt(ctx.series, date) };
    const r = chance(input);
    out.push({ date, score: r.score, legal: r.legal });
  }
  return out;
}

/** Contiguous windows of ≥ 2 h where score ≥ 80 % of the day's max (and ≥ 35 absolute). */
export function bestWindows(scores: HourScore[], maxWindows = 2): Window[] {
  if (!scores.length) return [];
  const max = Math.max(...scores.map((s) => s.score));
  if (max < 35) return [];
  const thr = Math.max(35, max * 0.8);
  const wins: Window[] = [];
  let i = 0;
  while (i < scores.length) {
    if (scores[i].score >= thr) {
      let j = i;
      let sum = 0;
      while (j < scores.length && scores[j].score >= thr) sum += scores[j++].score;
      if (j - i >= 2) wins.push({ from: scores[i].date, to: scores[j - 1].date, score: Math.round(sum / (j - i)) });
      i = j;
    } else i++;
  }
  return wins.sort((a, b) => b.score - a.score).slice(0, maxWindows).sort((a, b) => a.from.getTime() - b.from.getTime());
}

export function dailyOutlook(ctx: OutlookContext, from: Date, days = 7): DayOutlook[] {
  const day0 = startOfOmskDay(from);
  const out: DayOutlook[] = [];
  for (let d = 0; d < days; d++) {
    const start = addHours(day0, d * 24);
    const hs = hourly(ctx, start, 24).filter((h) => {
      const hr = omskParts(h.date).hour;
      return hr >= 4 && hr <= 22;
    });
    const score = Math.max(...hs.map((h) => h.score));
    const legal = hs.every((h) => h.legal === 'banned') ? 'banned' : hs.some((h) => h.legal === 'restricted') ? 'restricted' : 'ok';
    out.push({ date: start, score, best: bestWindows(hs, 1)[0] ?? null, legal });
  }
  return out;
}
