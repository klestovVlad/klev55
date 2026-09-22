/**
 * Hydrology for the model: (1) ice state estimated from freezing-degree-days
 * (Open-Meteo archive + forecast) — provenance `generated`; (2) stale gauge
 * readings scraped from allrivers.info shown with their real date — `measured`
 * but flagged stale. Output: public/data/gauges.json.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { cachedFetch } from './lib/cache';
import type { Gauge } from '../src/data/types';

const OUT = 'public/data';

interface Station {
  id: string;
  name: string;
  coords: [number, number];
  kind: 'river' | 'lake';
}
// Ice is estimated at three climate points: the city, the northern lakes, the southern Irtysh.
const STATIONS: Station[] = [
  { id: 'omsk', name: 'Омск (Иртыш)', coords: [73.37, 54.99], kind: 'river' },
  { id: 'krutinka', name: 'Крутинка (озёра Ик, Салтаим, Тенис)', coords: [71.5, 56.0], kind: 'lake' },
  { id: 'cherlak', name: 'Черлак (Иртыш)', coords: [74.8, 54.16], kind: 'river' },
];

// Stefan-type coefficients (cm per sqrt(°C·day)); snow-covered flat lakes and a slow big river.
const ALPHA = { lake: 2.1, river: 1.7 };
const MELT_CM_PER_DEGDAY = 0.6;

export interface IceEstimate {
  station: string;
  kind: 'river' | 'lake';
  state: 'none' | 'forming' | 'solid' | 'rotting' | 'off';
  ice_on: string | null; // date when sustained freeze started
  thickness_cm: number | null;
  fdd: number; // accumulated freezing degree-days
  days_since_ice_on: number | null;
  est_ice_off: string | null;
  note: string;
  provenance: 'generated';
}

function seasonStart(today: Date): string {
  // Ice season is tracked from 1 September of the season year.
  const y = today.getUTCMonth() >= 8 ? today.getUTCFullYear() : today.getUTCFullYear() - 1;
  return `${y}-09-01`;
}

async function dailyMeans(st: Station, today: Date): Promise<{ date: string; t: number }[]> {
  const start = seasonStart(today);
  const endArchive = new Date(today.getTime() - 3 * 86400000).toISOString().slice(0, 10); // archive lags ~2 days
  const arch = JSON.parse(
    await cachedFetch(
      `https://archive-api.open-meteo.com/v1/archive?latitude=${st.coords[1]}&longitude=${st.coords[0]}&start_date=${start}&end_date=${endArchive}&daily=temperature_2m_mean&timezone=Asia/Omsk`,
      { label: `archive ${st.id}`, ttlHours: 12 },
    ),
  );
  const fc = JSON.parse(
    await cachedFetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${st.coords[1]}&longitude=${st.coords[0]}&daily=temperature_2m_mean&past_days=5&forecast_days=16&timezone=Asia/Omsk`,
      { label: `forecast ${st.id}`, ttlHours: 6 },
    ),
  );
  const map = new Map<string, number>();
  (arch.daily?.time ?? []).forEach((d: string, i: number) => {
    const v = arch.daily.temperature_2m_mean[i];
    if (v != null) map.set(d, v);
  });
  (fc.daily?.time ?? []).forEach((d: string, i: number) => {
    const v = fc.daily.temperature_2m_mean[i];
    if (v != null && !map.has(d)) map.set(d, v);
  });
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, t]) => ({ date, t }));
}

export function estimateIce(series: { date: string; t: number }[], kind: 'river' | 'lake', todayISO: string, station: string): IceEstimate {
  const threshold = kind === 'lake' ? -3 : -5; // 5-day mean below this starts freeze-up
  let iceOn: string | null = null;
  let fdd = 0;
  let thickness = 0;
  let iceOff: string | null = null;
  let stateAtToday: IceEstimate['state'] = 'none';
  let thicknessAtToday: number | null = null;
  let fddAtToday = 0;
  let iceOffEst: string | null = null;
  const idxToday = series.findIndex((d) => d.date >= todayISO);
  for (let i = 0; i < series.length; i++) {
    const { date, t } = series[i];
    if (!iceOn) {
      if (date.slice(5) >= '10-10' || date.slice(5) < '03-01') {
        const win = series.slice(Math.max(0, i - 4), i + 1);
        if (win.length === 5 && win.reduce((s, d) => s + d.t, 0) / 5 <= threshold) iceOn = date;
      }
    } else if (!iceOff) {
      if (t < 0) fdd += -t;
      else thickness -= t * MELT_CM_PER_DEGDAY;
      const grown = ALPHA[kind] * Math.sqrt(fdd);
      thickness = Math.min(grown, Math.max(thickness, 0) + (t < 0 ? grown - (thickness > 0 ? thickness : 0) : 0));
      if (t < 0) thickness = grown; // growth phase follows the Stefan curve
      if (thickness <= 3 && date.slice(5) >= '03-01') iceOff = date;
    }
    if (i === idxToday || (idxToday === -1 && i === series.length - 1)) {
      fddAtToday = fdd;
      thicknessAtToday = iceOn && !iceOff ? Math.round(thickness) : null;
      const days = iceOn ? Math.round((Date.parse(date) - Date.parse(iceOn)) / 86400000) : null;
      if (!iceOn) stateAtToday = 'none';
      else if (iceOff) stateAtToday = 'off';
      else if (days != null && days < 10) stateAtToday = 'forming';
      else if (date.slice(5) >= '03-15' && date.slice(5) < '06-01') stateAtToday = 'rotting';
      else stateAtToday = 'solid';
    }
  }
  if (iceOn && iceOff && iceOff > todayISO) iceOffEst = iceOff;
  const daysSince = iceOn && stateAtToday !== 'off' && stateAtToday !== 'none' ? Math.round((Date.parse(todayISO) - Date.parse(iceOn)) / 86400000) : null;
  const note =
    stateAtToday === 'none'
      ? 'Льда нет: устойчивых морозов в этом сезоне ещё не было.'
      : stateAtToday === 'off'
        ? `Лёд сошёл (оценка по оттепелям, около ${iceOff}).`
        : `Ориентировочно ~${thicknessAtToday} см по сумме морозов с ${iceOn}. Это расчёт, не измерение: у берега, на течении и у родников лёд тоньше.`;
  return { station, kind, state: stateAtToday, ice_on: iceOn, thickness_cm: thicknessAtToday, fdd: Math.round(fddAtToday), days_since_ice_on: daysSince, est_ice_off: iceOffEst, note, provenance: 'generated' };
}

async function allrivers(slug: string, name: string, river: string, coords: [number, number]): Promise<Gauge> {
  const url = `https://allrivers.info/gauge/${slug}`;
  const base: Gauge = { id: slug, name, river, coords, source: 'allrivers.info (Центр регистра и кадастра)', source_url: url, level_cm: null, level_trend_cm_24h: null, water_temp_c: null, ice: null, measured_at: null, history: [], provenance: 'measured' };
  try {
    const html = await cachedFetch(url, { label: `allrivers ${slug}`, ttlHours: 24 });
    const level = html.match(/(\d{2,4})\s*см\s*\(([-+]?\d+)\)/);
    const date = html.match(/fa-calendar-alt[^<]*<\/i>\s*(\d{2}\.\d{2}\.\d{4})/);
    const temp = html.match(/([-+]?\d+(?:[.,]\d+)?)\s*°C/);
    if (level) {
      base.level_cm = Number(level[1]);
      base.level_trend_cm_24h = Number(level[2]);
    }
    if (temp) base.water_temp_c = Number(temp[1].replace(',', '.'));
    if (date) {
      const [d, m, y] = date[1].split('.');
      base.measured_at = `${y}-${m}-${d}T00:00:00+06:00`;
    }
  } catch (e) {
    console.warn(`  allrivers ${slug}: ${(e as Error).message}`);
  }
  return base;
}

async function main() {
  const today = new Date();
  const todayISO = new Date(today.getTime() + 6 * 3600000).toISOString().slice(0, 10);
  const ice: IceEstimate[] = [];
  for (const st of STATIONS) {
    const series = await dailyMeans(st, today);
    ice.push(estimateIce(series, st.kind, todayISO, st.id));
    console.log(`${st.id}: ${ice[ice.length - 1].state} ${ice[ice.length - 1].thickness_cm ?? ''}`);
  }
  const gauges = await Promise.all([
    allrivers('irtysh-omsk', 'Иртыш — Омск', 'Иртыш', [73.37, 54.98]),
    allrivers('irtyish-rp-cherlak', 'Иртыш — Черлак', 'Иртыш', [74.8, 54.16]),
    allrivers('irtyish-tara', 'Иртыш — Тара', 'Иртыш', [74.37, 56.9]),
  ]);
  for (const g of gauges) console.log(`${g.id}: ${g.level_cm} см, ${g.measured_at}`);
  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    `${OUT}/gauges.json`,
    JSON.stringify(
      {
        meta: {
          generated_at: today.toISOString(),
          sources: ['Open-Meteo archive + forecast (CC BY 4.0) — расчёт льда', 'allrivers.info — последние опубликованные измерения гидропостов'],
          license: 'CC BY 4.0 (Open-Meteo); измерения — по условиям allrivers.info',
          notes: 'Живых данных об уровне Иртыша в открытом доступе нет (АИС ГМВО закрыта, allrivers не обновляется с 2024). Лёд — расчёт по морозам, не измерение.',
        },
        ice,
        items: gauges,
        thresholds_cm: { person: 7, ice_fishing_gims: 10, group_crossing: 15, car: 30 },
      },
      null,
      1,
    ),
  );
  console.log('gauges.json written');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
