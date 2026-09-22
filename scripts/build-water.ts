/**
 * Pull water bodies, waterways, infrastructure and admin boundaries from OSM
 * (Overpass) for the 200 km circle, simplify, and write public/data/water.geojson
 * and public/data/infra.geojson. See DECISIONS D-005.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import * as turf from '@turf/turf';
import osmtogeojson from 'osmtogeojson';
import { overpass, overpassTiled } from './lib/overpass';
import { overpassBbox, circleBbox, insideCircle, CENTER } from './lib/geo';
import type { Feature, FeatureCollection, Geometry } from 'geojson';

const OUT = 'public/data';
const bbox = overpassBbox();
// Detailed bbox ≈ 35 km around Omsk where unnamed ponds/oxbows matter.
const near = circleBboxKm(35);

function circleBboxKm(km: number): string {
  const c = turf.circle(CENTER, km, { steps: 16, units: 'kilometers' });
  const b = turf.bbox(c);
  return `${b[1].toFixed(4)},${b[0].toFixed(4)},${b[3].toFixed(4)},${b[2].toFixed(4)}`;
}

function toGeo(osm: any): FeatureCollection {
  return osmtogeojson(osm, { flatProperties: true }) as FeatureCollection;
}

function osmId(f: Feature): number {
  const id = String(f.id ?? '');
  const n = Number(id.replace(/^\D+/, ''));
  return Number.isFinite(n) ? n : 0;
}

function waterType(p: Record<string, any>): string | null {
  if (p.waterway === 'river') return 'river';
  if (p.waterway === 'stream') return 'stream';
  if (p.waterway === 'canal') return 'canal';
  if (p.natural === 'water') {
    const w = p.water;
    if (w === 'river' || w === 'riverbank') return 'riverbank';
    if (w === 'oxbow') return 'oxbow';
    if (w === 'pond' || w === 'basin') return 'pond';
    if (w === 'reservoir') return 'reservoir';
    if (w === 'canal') return 'canal';
    return 'lake';
  }
  if (p.natural === 'wetland') return 'wetland';
  if (p.landuse === 'reservoir') return 'reservoir';
  return null;
}

function simplify<G extends Geometry>(f: Feature<G>, tol: number): Feature<G> {
  try {
    return turf.simplify(f, { tolerance: tol, highQuality: false, mutate: false }) as Feature<G>;
  } catch {
    return f;
  }
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  console.log('bbox', bbox);

  console.log('1/6 named rivers and canals');
  const rivers = toGeo(
    await overpassTiled((t) => `(way["waterway"~"^(river|canal)$"]["name"](${t}););out geom;`, circleBbox(), 'rivers'),
  );
  console.log('   ways:', rivers.features.length);

  console.log('2/6 named streams');
  const streams = toGeo(await overpassTiled((t) => `(way["waterway"="stream"]["name"](${t}););out geom;`, circleBbox(), 'streams'));
  console.log('   ways:', streams.features.length);

  console.log('3/6 named lakes, ponds, reservoirs (whole circle)');
  const lakes = toGeo(
    await overpassTiled((t) => `(nwr["natural"="water"]["name"](${t});nwr["landuse"="reservoir"]["name"](${t}););out geom;`, circleBbox(), 'lakes'),
  );
  console.log('   features:', lakes.features.length);

  console.log('4/6 all water near Omsk incl. unnamed riverbanks/oxbows/ponds');
  const nearWater = toGeo(
    await overpass(`(nwr["natural"="water"](${near});way["waterway"~"^(river|stream|canal)$"](${near}););out geom;`, 'near-water'),
  );
  console.log('   features:', nearWater.features.length);

  console.log('5/6 Irtysh riverbank polygons (whole circle)');
  const riverbank = toGeo(
    await overpassTiled((t) => `(nwr["natural"="water"]["water"="river"](${t}););out geom;`, circleBbox(), 'riverbank'),
  );
  console.log('   features:', riverbank.features.length);

  console.log('6/6 admin boundaries: Омская область + Kazakh oblasts touching the circle');
  const admin = toGeo(
    await overpass(
      `(relation["boundary"="administrative"]["admin_level"="4"]["name"="Омская область"](${bbox});relation["boundary"="administrative"]["admin_level"="4"]["name:ru"~"^(Северо-Казахстанская|Павлодарская) область$"](${bbox}););out geom;`,
      'admin',
      600,
    ),
  );
  for (const f of admin.features) if (!f.properties?.name && f.properties?.['name:ru']) f.properties!.name = f.properties['name:ru'];
  console.log('   features:', admin.features.length, admin.features.map((f) => `${f.properties?.name}/${f.geometry?.type}`));

  // Kazakh polygons for jurisdiction tests.
  const kz = admin.features.filter((f) => /Казахстан|Павлодар/.test(String(f.properties?.name ?? f.properties?.['name:ru'])) && (f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon'));
  const omsk = admin.features.find((f) => f.properties?.name === 'Омская область');
  const inKz = (pt: [number, number]) => kz.some((f) => turf.booleanPointInPolygon(pt, f as any));

  // Merge, dedupe by osm id, filter to the circle, simplify, keep essential props.
  const seen = new Set<string>();
  const out: Feature[] = [];
  const all = [...rivers.features, ...streams.features, ...lakes.features, ...nearWater.features, ...riverbank.features];
  for (const f of all) {
    const key = String(f.id);
    if (seen.has(key)) continue;
    const p = f.properties ?? {};
    const type = waterType(p);
    if (!type) continue;
    if (!f.geometry) continue;
    let centroid: [number, number];
    try {
      centroid = turf.centroid(f as any).geometry.coordinates as [number, number];
    } catch {
      continue;
    }
    // Keep features whose centroid is in the circle, or that intersect it (long rivers).
    const inside = insideCircle(centroid);
    if (!inside) {
      try {
        const b = turf.bbox(f as any);
        const cb = circleBbox();
        if (b[2] < cb[0] || b[0] > cb[2] || b[3] < cb[1] || b[1] > cb[3]) continue;
      } catch {
        continue;
      }
    }
    seen.add(key);
    const isPoly = f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon';
    const areaKm2 = isPoly ? turf.area(f as any) / 1e6 : undefined;
    const lengthKm = !isPoly ? turf.length(f as any, { units: 'kilometers' }) : undefined;
    // Drop tiny unnamed puddles outside the near box.
    const name = p['name:ru'] ?? p.name ?? '';
    if (!name && isPoly && (areaKm2 ?? 0) < 0.02) continue;
    if (!name && !isPoly && (lengthKm ?? 0) < 2) continue;
    const tol = isPoly ? ((areaKm2 ?? 0) > 5 ? 0.0008 : 0.0003) : (lengthKm ?? 0) > 50 ? 0.0008 : 0.0003;
    const g = simplify(f as Feature<Geometry>, tol);
    out.push({
      type: 'Feature',
      id: f.id,
      geometry: g.geometry,
      properties: {
        osm_id: osmId(f),
        name,
        type,
        area_km2: areaKm2 != null ? Math.round(areaKm2 * 100) / 100 : undefined,
        length_km: lengthKm != null ? Math.round(lengthKm * 10) / 10 : undefined,
        centroid: [Math.round(centroid[0] * 1e5) / 1e5, Math.round(centroid[1] * 1e5) / 1e5],
        jurisdiction: inKz(centroid) ? 'kz' : 'ru',
        salt: p.salt === 'yes' || /Эбейты/i.test(name) ? true : undefined,
      },
    });
  }
  // Round coordinates to 5 decimals (~1 m) to save bytes.
  const rounded = turf.truncate({ type: 'FeatureCollection', features: out } as any, { precision: 5, mutate: true });
  const water = {
    type: 'FeatureCollection',
    meta: {
      generated_at: new Date().toISOString(),
      sources: ['OpenStreetMap via Overpass API'],
      license: 'ODbL 1.0 — © OpenStreetMap contributors',
      notes: 'Named waters in the 200 km circle; all water within ~35 km of Omsk. Geometry simplified.',
    },
    features: rounded.features,
  };
  writeFileSync(`${OUT}/water.geojson`, JSON.stringify(water));
  console.log('water.geojson features:', out.length, 'bytes:', JSON.stringify(water).length);

  // Admin outline for the map (Omsk oblast + KZ mask), heavily simplified.
  const adminOut = {
    type: 'FeatureCollection',
    meta: { generated_at: new Date().toISOString(), sources: ['OpenStreetMap via Overpass API'], license: 'ODbL 1.0 — © OpenStreetMap contributors' },
    features: [
      ...(omsk ? [{ ...simplify(omsk as any, 0.003), properties: { name: 'Омская область', kind: 'oblast' } }] : []),
      ...kz.map((f) => ({ ...simplify(f as any, 0.003), properties: { name: f.properties?.name, kind: 'kz' } })),
    ],
  };
  writeFileSync(`${OUT}/admin.geojson`, JSON.stringify(turf.truncate(adminOut as any, { precision: 4, mutate: true })));
  console.log('admin.geojson bytes:', JSON.stringify(adminOut).length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
