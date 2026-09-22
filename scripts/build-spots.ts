/**
 * Assemble public/data/spots.json from content/spots/*.json:
 * resolve nearest water feature (assert ≤ 300 m), straight-line distance from Omsk,
 * drive time via OSRM table service (fallback: distance × 1.3 / 70 km/h).
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { cachedFetch } from './lib/cache';
import { CENTER, RADIUS_KM, distanceKm, insideCircle } from './lib/geo';
import { validateSpot } from './validate-spots';
import type { Spot } from '../src/data/types';
import * as turf from '@turf/turf';

const OUT = 'public/data';
const MAX_WATER_M = 300;

function loadWater() {
  return JSON.parse(readFileSync(`${OUT}/water.geojson`, 'utf8'));
}

function nearestWater(water: any, p: [number, number]): { d: number; f: any } | null {
  const P = turf.point(p);
  let best: { d: number; f: any } | null = null;
  for (const f of water.features) {
    const g = f.geometry;
    if (!g) continue;
    // quick bbox reject (~0.1° ≈ 6–11 km)
    const b = f.bbox ?? (f.bbox = turf.bbox(f));
    if (p[0] < b[0] - 0.1 || p[0] > b[2] + 0.1 || p[1] < b[1] - 0.1 || p[1] > b[3] + 0.1) continue;
    let d = Infinity;
    try {
      if (g.type === 'Polygon' || g.type === 'MultiPolygon') {
        if (turf.booleanPointInPolygon(P, f)) d = 0;
        else {
          const lines = turf.polygonToLine(f as any);
          const feats = lines.type === 'FeatureCollection' ? lines.features : [lines];
          for (const l of feats) for (const one of turf.flatten(l as any).features) d = Math.min(d, turf.nearestPointOnLine(one as any, P, { units: 'meters' }).properties.dist ?? Infinity);
        }
      } else {
        for (const one of turf.flatten(f as any).features) d = Math.min(d, turf.nearestPointOnLine(one as any, P, { units: 'meters' }).properties.dist ?? Infinity);
      }
    } catch {
      continue;
    }
    if (!best || d < best.d) best = { d, f };
  }
  return best;
}

async function osrmTable(coords: [number, number][]): Promise<(number | null)[]> {
  // OSRM demo: table with source = Omsk center, destinations = spots, in chunks of 50.
  const out: (number | null)[] = [];
  for (let i = 0; i < coords.length; i += 50) {
    const chunk = coords.slice(i, i + 50);
    const all = [CENTER, ...chunk].map((c) => `${c[0].toFixed(5)},${c[1].toFixed(5)}`).join(';');
    const url = `https://router.project-osrm.org/table/v1/driving/${all}?sources=0&annotations=duration`;
    try {
      const j = JSON.parse(await cachedFetch(url, { label: 'osrm table', ttlHours: 24 * 30 }));
      const row: (number | null)[] = (j.durations?.[0]?.slice(1) ?? []) as (number | null)[];
      for (let k = 0; k < chunk.length; k++) {
        const v = row[k];
        out.push(v != null ? Math.round(v / 60) : null);
      }
    } catch (e) {
      console.warn(`  osrm failed: ${(e as Error).message}`);
      for (let k = 0; k < chunk.length; k++) out.push(null);
    }
  }
  return out;
}

async function main() {
  const water = loadWater();
  const speciesIds = new Set(readdirSync('content/species').filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', '')));
  const files = readdirSync('content/spots').filter((f) => f.endsWith('.json'));
  const spots: Spot[] = [];
  const problems: string[] = [];
  for (const f of files) {
    const s: Spot = JSON.parse(readFileSync(`content/spots/${f}`, 'utf8'));
    const errs = validateSpot(s, f, speciesIds);
    if (errs.length) problems.push(...errs);
    if (!insideCircle(s.coords)) problems.push(`${f}: outside the ${RADIUS_KM} km circle (${distanceKm(CENTER, s.coords).toFixed(0)} km)`);
    const nw = nearestWater(water, s.coords);
    if (!nw || nw.d > MAX_WATER_M) problems.push(`${f}: nearest water ${nw ? Math.round(nw.d) + ' m (' + (nw.f.properties.name || nw.f.properties.type) + ')' : 'none'} > ${MAX_WATER_M} m`);
    else {
      s.water_osm_id = nw.f.properties.osm_id;
      if (nw.f.properties.jurisdiction === 'kz') problems.push(`${f}: water is in Kazakhstan`);
    }
    s.distance_km = Math.round(distanceKm(CENTER, s.coords));
    spots.push(s);
  }
  if (problems.length) {
    console.error(problems.join('\n'));
    console.error(`${problems.length} problems`);
    process.exit(1);
  }
  const durations = await osrmTable(spots.map((s) => s.coords));
  spots.forEach((s, i) => {
    if (durations[i] != null) {
      s.drive_min = durations[i];
      s.drive_source = 'osrm';
    } else {
      s.drive_min = Math.round(((s.distance_km * 1.3) / 70) * 60);
      s.drive_source = 'estimate';
    }
  });
  spots.sort((a, b) => a.distance_km - b.distance_km);
  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    `${OUT}/spots.json`,
    JSON.stringify({
      meta: {
        generated_at: new Date().toISOString(),
        sources: ['Экспертная модель + агрегированные отчёты (generated; см. corroborated_by)', 'OpenStreetMap (привязка к воде, ODbL)', 'OSRM demo server (время в пути)'],
        license: 'CC BY-SA 4.0 (тексты); геометрия воды ODbL',
        notes: 'Все точки — экспертная оценка, не измерение. confidence 0–3 показывает степень подтверждения.',
      },
      center: CENTER,
      radius_km: RADIUS_KM,
      items: spots,
    }),
  );
  const osrm = spots.filter((s) => s.drive_source === 'osrm').length;
  console.log(`spots.json: ${spots.length} spots, ${osrm} with OSRM drive time, ${spots.filter((s) => s.type === 'платник').length} paid, ${spots.filter((s) => s.ice_spot).length} ice`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
