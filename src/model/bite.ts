/**
 * Bite chance heuristic. Transparent, table-driven (see weights.ts), explained
 * by an ordered list of factors. Not a trained model; the UI says so.
 * See docs/MODEL.md.
 */
import type { Spot, RuleWindow } from '@/data/types';
import type { ChanceInput, ChanceResult, Factor, Legal } from './types';
import { W, traitsOf } from './weights';
import { solunarAt } from './solunar';
import { omskParts, inWindow, type LocalParts } from '@/lib/time';

const LAKE_TYPES = new Set(['озеро', 'пруд', 'водохранилище', 'платник']);

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function windowApplies(w: RuleWindow, spot: Spot, speciesId: string): boolean {
  if (w.species && !w.species.includes(speciesId)) return false;
  const a = w.applies_to;
  if (a.all) return true;
  if (a.spot_types?.includes(spot.type)) return true;
  if (a.water_names?.some((n) => spot.water_name.toLowerCase().includes(n.toLowerCase()))) return true;
  return false;
}

/** Interpolate monthly activity by day-of-month so the score does not jump on the 1st. */
function seasonActivity(byMonth: number[], p: LocalParts): number {
  const i = p.month - 1;
  const cur = byMonth[i] ?? 5;
  const next = byMonth[(i + 1) % 12] ?? cur;
  const prev = byMonth[(i + 11) % 12] ?? cur;
  const t = (p.day - 15) / 30; // −0.5..+0.5
  return t >= 0 ? cur + (next - cur) * t : cur + (prev - cur) * -t;
}

function isIce(input: ChanceInput, p: LocalParts): boolean {
  if (input.hydro) return input.hydro.ice_on;
  return p.month === 12 || p.month <= 3; // fallback when hydro is unknown
}

export function chance(input: ChanceInput): ChanceResult {
  const { spot, species, date, weather, hydro, rules } = input;
  const p = omskParts(date);
  const t = traitsOf(species.id);
  const lake = LAKE_TYPES.has(spot.type);
  const ice = isIce(input, p);
  const mode = ice ? 'ice' : 'openwater';
  const factors: Factor[] = [];
  let legal: Legal = 'ok';
  let legalReason: string | null = null;

  /* ---- Legality first: a banned fish has no chance to show. ---- */
  const bannedSpecies = rules?.banned_species.find((b) => b.id === species.id) || species.status.legal === 'banned';
  if (bannedSpecies) {
    return {
      score: 0,
      legal: 'banned',
      legal_reason: `${species.names.ru}: вылов запрещён. Поймали — отпустите сразу.`,
      factors: [{ name: 'Запрещённый вид', effect: -30, reason: 'Правила рыболовства запрещают вылов этого вида' }],
      mode,
    };
  }
  if (hydro?.zone?.inside) {
    return {
      score: 0,
      legal: 'banned',
      legal_reason: `Место внутри запретной зоны «${hydro.zone.name}» — сейчас ловить нельзя.`,
      factors: [{ name: 'Запретная зона', effect: -30, reason: `Зона «${hydro.zone.name}» действует сегодня` }],
      mode,
    };
  }
  if (rules) {
    for (const w of rules.spawning_bans) {
      if (!inWindow(p, w.from, w.to) || !windowApplies(w, spot, species.id)) continue;
      if (w.full_ban) {
        return {
          score: 0,
          legal: 'banned',
          legal_reason: `Нерестовый запрет (${w.scope}) до ${w.to.split('-').reverse().join('.')}.`,
          factors: [{ name: 'Нерестовый запрет', effect: -30, reason: w.what_is_banned || w.scope }],
          mode,
        };
      }
      legal = 'restricted';
      legalReason = `Нерестовый запрет: ${w.what_is_allowed}.`;
      factors.push({ name: 'Ограничение в нерест', effect: W.restricted, reason: w.what_is_allowed });
      break;
    }
  }

  /* ---- Base: season and hour. ---- */
  const seasonAct = seasonActivity(species.activity_by_month, p);
  factors.push({
    name: 'Сезон',
    effect: Math.round((seasonAct - 5) * W.seasonScale),
    reason: `активность в этом месяце ${Math.round(seasonAct)}/10`,
  });
  const hourAct = species.activity_by_hour[mode][p.hour] ?? 5;
  factors.push({
    name: 'Время суток',
    effect: Math.round((hourAct - 5) * W.hourScale),
    reason: `в ${p.hour}:00 обычно ${hourAct}/10${ice ? ' (со льда)' : ''}`,
  });

  /* ---- Solunar / twilight. ---- */
  const sol = solunarAt(date, spot.coords[1], spot.coords[0]);
  if (sol.major) factors.push({ name: 'Солунар', effect: W.solunar.major, reason: 'луна в зените или надире (±1 ч) — большой период' });
  else if (sol.minor) factors.push({ name: 'Солунар', effect: W.solunar.minor, reason: 'восход или заход луны (±30 мин) — малый период' });
  if (sol.twilight) factors.push({ name: 'Сумерки', effect: W.solunar.twilight, reason: 'гражданские сумерки — смена света' });

  /* ---- Spot fit. ---- */
  const fit = spot.species.find((s) => s.id === species.id);
  const fitEffect = fit ? W.spotRank[String(fit.rank)] : W.spotRank.absent;
  factors.push({
    name: 'Место для вида',
    effect: fitEffect,
    reason: fit ? `здесь ${species.names.ru.toLowerCase()} — цель ${fit.rank} из 5` : 'на этом месте вид не отмечен',
  });

  /* ---- Biology: spawning. ---- */
  if (inWindow(p, species.spawning.from, species.spawning.to)) {
    factors.push({ name: 'Нерест', effect: W.spawn, reason: 'рыба занята нерестом, кормится слабо' });
  }

  /* ---- Weather. ---- */
  if (!weather) {
    factors.push({ name: 'Нет прогноза', effect: 0, reason: 'погода не загружена — оценка только по сезону и времени' });
  } else {
    // Pressure
    const d = weather.pressure_trend_24h;
    let pr: Factor;
    if (Math.abs(d) <= 3) pr = { name: 'Давление', effect: W.pressure.stable, reason: `стабильное (${d >= 0 ? '+' : ''}${d.toFixed(0)} гПа за сутки)` };
    else if (d < -8) pr = { name: 'Давление', effect: W.pressure.fastFall, reason: `резко падает (${d.toFixed(0)} гПа за сутки) — идёт фронт` };
    else if (d < 0) pr = { name: 'Давление', effect: W.pressure.slowFall, reason: `медленно падает (${d.toFixed(0)} гПа за сутки)` };
    else if (d >= 8) pr = { name: 'Давление', effect: W.pressure.fastRise, reason: `резко растёт (+${d.toFixed(0)} гПа за сутки) — после фронта клёв слабый` };
    else pr = { name: 'Давление', effect: W.pressure.slowRise, reason: `растёт (+${d.toFixed(0)} гПа за сутки)` };
    if (weather.pressure_range_72h > 15) pr.effect += W.pressure.jumpy72, (pr.reason += ', за трое суток скачет');
    if (weather.pressure_msl > 1032 || weather.pressure_msl < 988) pr.effect += W.pressure.extreme, (pr.reason += ', далеко от нормы');
    factors.push(pr);

    // Wind
    const ws = weather.wind_speed;
    let wf: Factor;
    if (ws < 2) wf = { name: 'Ветер', effect: 0, reason: 'штиль' };
    else if (ws <= 6) wf = { name: 'Ветер', effect: W.wind.light, reason: `лёгкий, ${ws.toFixed(0)} м/с — рябь помогает` };
    else if (ws <= 10) wf = { name: 'Ветер', effect: lake ? W.wind.freshLake : W.wind.fresh, reason: `свежий, ${ws.toFixed(0)} м/с${lake ? ', на озере волна' : ''}` };
    else wf = { name: 'Ветер', effect: lake ? W.wind.strongLake : W.wind.strong, reason: `сильный, ${ws.toFixed(0)} м/с${lake ? ' — на озере опасно' : ''}` };
    if (weather.gusts > 15) wf.effect += W.wind.gusty, (wf.reason += `, порывы до ${weather.gusts.toFixed(0)}`);
    const north = weather.wind_dir >= 315 || weather.wind_dir <= 45;
    if (north && weather.temp_change_24h <= -4 && ws >= 3) wf.effect += W.wind.coldNorth, (wf.reason += ', холодный северный после тепла');
    wf.effect = clamp(wf.effect, -30, 30);
    factors.push(wf);

    // Sky and precipitation
    const code = weather.weather_code;
    if (code >= 95) factors.push({ name: 'Гроза', effect: W.sky.thunder, reason: 'гроза — с удилищем на берегу опасно' });
    else if (weather.precip > 4) factors.push({ name: 'Осадки', effect: W.sky.heavyRain, reason: `ливень, ${weather.precip.toFixed(1)} мм/ч` });
    else if (weather.precip > 0.1) factors.push({ name: 'Осадки', effect: W.sky.lightRain, reason: 'лёгкий дождь не мешает' });
    if (weather.cloud >= 70 && weather.temp_c > 12 && t.predator && code < 95)
      factors.push({ name: 'Облачность', effect: W.sky.overcastWarmPredator, reason: 'тёплая пасмурная погода — хищник выходит' });
    else if (weather.cloud < 20 && p.hour >= 11 && p.hour <= 16 && weather.temp_c > 25)
      factors.push({ name: 'Солнце', effect: W.sky.glareSummerNoon, reason: 'яркое солнце в полдень, рыба уходит в глубину' });

    // Temperature change
    if (p.month >= 6 && p.month <= 8 && weather.temp_change_24h <= -6)
      factors.push({ name: 'Похолодание', effect: W.temp.summerDrop, reason: `резкое похолодание на ${Math.abs(weather.temp_change_24h).toFixed(0)}°` });
    if (ice && (p.month === 12 || p.month <= 2) && weather.temp_c > -3 && weather.temp_change_24h > 0)
      factors.push({ name: 'Оттепель', effect: W.temp.winterThaw, reason: 'оттепель зимой оживляет клёв' });
  }

  /* ---- Ice season. ---- */
  if (ice) {
    const deadWinter = p.month === 1 || p.month === 2;
    if (hydro?.ice_days != null && hydro.ice_days <= 21) factors.push({ name: 'Перволёдье', effect: W.ice.firstIce, reason: 'первый лёд — лучшее время зимы' });
    else if (hydro?.days_to_ice_off != null && hydro.days_to_ice_off <= 21) factors.push({ name: 'Последний лёд', effect: W.ice.lastIce, reason: 'последний лёд, талая вода несёт кислород' });
    else if (deadWinter) {
      if (t.prefers_ice) factors.push({ name: 'Глухозимье', effect: W.ice.midWinterBurbot, reason: 'налим в глухозимье в самой силе' });
      else if (lake && t.shallow_lake_sensitive) factors.push({ name: 'Глухозимье', effect: W.temp.deadWinter, reason: 'мало кислорода в мелком озере, возможен замор' });
      else factors.push({ name: 'Глухозимье', effect: W.ice.midWinter, reason: 'середина зимы, рыба вялая' });
    }
  }

  /* ---- Water level (gauge ≤ 40 km). ---- */
  if (hydro?.gauge_km != null && hydro.gauge_km <= 40 && hydro.level_trend_cm_24h != null) {
    const lv = hydro.level_trend_cm_24h;
    if (lv > 15) factors.push({ name: 'Уровень воды', effect: W.water.risingFast, reason: `вода прибывает (+${lv} см/сут), мутнеет` });
    else if (lv < -5) factors.push({ name: 'Уровень воды', effect: W.water.falling, reason: `вода падает (${lv} см/сут), светлеет` });
    else if ((p.month === 5 || p.month === 6) && !lake) factors.push({ name: 'Уровень воды', effect: W.water.floodMayJune, reason: 'высокая вода, рыба разошлась по пойме' });
  }

  /* ---- Nearby active zone. ---- */
  if (hydro?.zone && !hydro.zone.inside && hydro.zone.distance_m <= 1000) {
    factors.push({ name: 'Рядом запретная зона', effect: W.zoneNear, reason: `«${hydro.zone.name}» в ${Math.round(hydro.zone.distance_m)} м — не заходите` });
  }

  for (const f of factors) f.effect = clamp(Math.round(f.effect), -30, 30);
  factors.sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect));
  const score = clamp(Math.round(W.base + factors.reduce((s, f) => s + f.effect, 0)), 0, 100);
  return { score, legal, legal_reason: legalReason, factors, mode };
}
