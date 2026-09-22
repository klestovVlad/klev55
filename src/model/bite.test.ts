import { describe, it, expect } from 'vitest';
import { chance } from './bite';
import { pike, sterlet, burbot, riverSpot, lakeSpot, rules, weather, hydro } from './fixtures';
import { omskDate } from '@/lib/time';

const sept = omskDate(2026, 9, 26, 7, 0); // Saturday morning, late September
const may = omskDate(2026, 5, 10, 7, 0);
const jan = omskDate(2026, 1, 20, 10, 0);

function factor(res: ReturnType<typeof chance>, name: string) {
  return res.factors.find((f) => f.name === name);
}

describe('chance()', () => {
  it('returns a score in 0–100 with sorted factors', () => {
    const r = chance({ spot: riverSpot, species: pike, date: sept, weather: weather(), hydro: hydro(), rules });
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
    for (let i = 1; i < r.factors.length; i++) {
      expect(Math.abs(r.factors[i - 1].effect)).toBeGreaterThanOrEqual(Math.abs(r.factors[i].effect));
    }
    expect(r.legal).toBe('ok');
  });

  it('every factor effect is within −30..+30', () => {
    const r = chance({ spot: riverSpot, species: pike, date: sept, weather: weather({ wind_speed: 14, gusts: 20 }), hydro: hydro(), rules });
    for (const f of r.factors) {
      expect(f.effect).toBeGreaterThanOrEqual(-30);
      expect(f.effect).toBeLessThanOrEqual(30);
    }
  });

  it('banned species → score 0, legal banned', () => {
    const r = chance({ spot: riverSpot, species: sterlet, date: sept, weather: weather(), hydro: hydro(), rules });
    expect(r.score).toBe(0);
    expect(r.legal).toBe('banned');
    expect(r.legal_reason).toMatch(/запрещ/i);
  });

  it('full spawning ban on lakes → score 0 with reason "нерестовый запрет"', () => {
    const r = chance({ spot: lakeSpot, species: pike, date: may, weather: weather(), hydro: hydro(), rules });
    expect(r.score).toBe(0);
    expect(r.legal).toBe('banned');
    expect(r.factors[0].name).toMatch(/нерестовый запрет/i);
  });

  it('restricted spawning window on rivers → legal restricted, score > 0', () => {
    const r = chance({ spot: riverSpot, species: pike, date: may, weather: weather(), hydro: hydro(), rules });
    expect(r.legal).toBe('restricted');
    expect(r.score).toBeGreaterThan(0);
    expect(factor(r, 'Ограничение в нерест')?.effect).toBeLessThan(0);
  });

  it('missing weather → degrades gracefully with a "Нет прогноза" factor', () => {
    const r = chance({ spot: riverSpot, species: pike, date: sept, weather: null, hydro: null, rules });
    expect(r.score).toBeGreaterThan(0);
    expect(factor(r, 'Нет прогноза')).toBeTruthy();
    expect(factor(r, 'Нет прогноза')?.effect).toBe(0);
  });

  it('missing rules → still scores, legal ok', () => {
    const r = chance({ spot: riverSpot, species: pike, date: sept, weather: weather(), hydro: hydro(), rules: null });
    expect(r.legal).toBe('ok');
    expect(r.score).toBeGreaterThan(0);
  });

  it('species absent from the spot list gets a strong negative fit factor', () => {
    const spot = { ...riverSpot, species: [] };
    const r = chance({ spot, species: pike, date: sept, weather: weather(), hydro: hydro(), rules });
    expect(factor(r, 'Место для вида')?.effect).toBe(-25);
  });

  it('sharp pressure rise scores lower than stable pressure', () => {
    const stable = chance({ spot: riverSpot, species: pike, date: sept, weather: weather({ pressure_trend_24h: 0 }), hydro: hydro(), rules });
    const rise = chance({ spot: riverSpot, species: pike, date: sept, weather: weather({ pressure_trend_24h: 12 }), hydro: hydro(), rules });
    expect(rise.score).toBeLessThan(stable.score);
  });

  it('strong wind hurts more on a lake than on a river', () => {
    const w = weather({ wind_speed: 12 });
    const river = chance({ spot: riverSpot, species: pike, date: sept, weather: w, hydro: hydro(), rules });
    const lake = chance({ spot: lakeSpot, species: pike, date: sept, weather: w, hydro: hydro(), rules });
    expect(factor(lake, 'Ветер')!.effect).toBeLessThan(factor(river, 'Ветер')!.effect);
  });

  it('thunderstorm is a big negative', () => {
    const r = chance({ spot: riverSpot, species: pike, date: sept, weather: weather({ weather_code: 95 }), hydro: hydro(), rules });
    expect(factor(r, 'Гроза')?.effect).toBe(-15);
  });

  it('ice mode is chosen when hydro says ice is on, and burbot loves mid-winter', () => {
    const h = hydro({ ice_on: true, ice_thickness_cm: 40, ice_days: 60 });
    const p = chance({ spot: riverSpot, species: pike, date: jan, weather: weather({ temp_c: -20 }), hydro: h, rules });
    const b = chance({ spot: riverSpot, species: burbot, date: jan, weather: weather({ temp_c: -20 }), hydro: h, rules });
    expect(p.mode).toBe('ice');
    expect(factor(p, 'Глухозимье')?.effect).toBeLessThan(0);
    expect(factor(b, 'Глухозимье')?.effect).toBeGreaterThan(0);
  });

  it('first ice bonus applies within the first three weeks', () => {
    const h = hydro({ ice_on: true, ice_thickness_cm: 12, ice_days: 10 });
    const r = chance({ spot: riverSpot, species: pike, date: omskDate(2026, 11, 25, 10), weather: weather({ temp_c: -8 }), hydro: h, rules });
    expect(factor(r, 'Перволёдье')?.effect).toBe(10);
  });

  it('rising water is negative, falling water positive', () => {
    const up = chance({ spot: riverSpot, species: pike, date: sept, weather: weather(), hydro: hydro({ gauge_km: 10, level_trend_cm_24h: 20 }), rules });
    const down = chance({ spot: riverSpot, species: pike, date: sept, weather: weather(), hydro: hydro({ gauge_km: 10, level_trend_cm_24h: -8 }), rules });
    expect(factor(up, 'Уровень воды')!.effect).toBeLessThan(0);
    expect(factor(down, 'Уровень воды')!.effect).toBeGreaterThan(0);
  });

  it('gauge farther than 40 km is ignored', () => {
    const r = chance({ spot: riverSpot, species: pike, date: sept, weather: weather(), hydro: hydro({ gauge_km: 90, level_trend_cm_24h: 20 }), rules });
    expect(factor(r, 'Уровень воды')).toBeUndefined();
  });

  it('inside an active prohibited zone → banned', () => {
    const r = chance({ spot: riverSpot, species: pike, date: jan, weather: weather(), hydro: hydro({ ice_on: true, zone: { name: 'Яма', inside: true, distance_m: 0 } }), rules });
    expect(r.legal).toBe('banned');
    expect(r.score).toBe(0);
  });
});
