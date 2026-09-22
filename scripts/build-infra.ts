/**
 * Angler infrastructure from OSM → public/data/infra.geojson:
 * bridges over named rivers, dams/weirs/locks, slipways & boat launches, fishing shops,
 * fuel, camp sites. Points only (centroids), zoom-gated on the map.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import * as turf from '@turf/turf';
import osmtogeojson from 'osmtogeojson';
import { overpassTiled } from './lib/overpass';
import { circleBbox, insideCircle } from './lib/geo';
import type { FeatureCollection } from 'geojson';

const OUT = 'public/data';
type Kind = 'bridge' | 'dam' | 'weir' | 'lock' | 'slipway' | 'fishing_shop' | 'fuel' | 'camp_site';

function kindOf(p: Record<string, any>): Kind | null {
  if (p.waterway === 'dam' || p.man_made === 'dam') return 'dam';
  if (p.waterway === 'weir') return 'weir';
  if (p.waterway === 'lock_gate' || p.lock === 'yes') return 'lock';
  if (p.leisure === 'slipway' || p.amenity === 'boat_ramp') return 'slipway';
  if (p.shop === 'fishing') return 'fishing_shop';
  if (p.amenity === 'fuel') return 'fuel';
  if (p.tourism === 'camp_site') return 'camp_site';
  if (p.bridge && p.bridge !== 'no' && p.highway) return 'bridge';
  return null;
}

async function main() {
  const bbox = circleBbox();
  const water = JSON.parse(readFileSync(`${OUT}/water.json`, 'utf8')) as FeatureCollection;
  const rivers = water.features.filter((f) => (f.properties!.type === 'river' || f.properties!.type === 'riverbank') && f.properties!.name);
  const nearRiver = (pt: [number, number]) => {
    const P = turf.point(pt);
    for (const r of rivers) {
      const b = (r as any).bbox ?? ((r as any).bbox = turf.bbox(r));
      if (pt[0] < b[0] - 0.02 || pt[0] > b[2] + 0.02 || pt[1] < b[1] - 0.02 || pt[1] > b[3] + 0.02) continue;
      const lines = r.geometry.type.includes('Polygon') ? (turf.polygonToLine(r as any) as any) : r;
      const feats = lines.type === 'FeatureCollection' ? lines.features : [lines];
      for (const l of feats) for (const one of turf.flatten(l as any).features) if ((turf.nearestPointOnLine(one as any, P, { units: 'meters' }).properties.dist ?? 1e9) < 120) return r.properties!.name as string;
    }
    return null;
  };

  console.log('1/2 dams, weirs, locks, slipways, shops, fuel, camps');
  const poi = osmtogeojson(
    await overpassTiled(
      (t) => `(nwr["waterway"~"^(dam|weir|lock_gate)$"](${t});nwr["man_made"="dam"](${t});nwr["leisure"="slipway"](${t});nwr["amenity"="boat_ramp"](${t});nwr["shop"="fishing"](${t});nwr["amenity"="fuel"](${t});nwr["tourism"="camp_site"](${t}););out center tags;`,
      bbox,
      'infra',
    ) as any,
    { flatProperties: true },
  ) as FeatureCollection;
  console.log('2/2 road bridges');
  const bridges = osmtogeojson(
    await overpassTiled((t) => `(way["bridge"]["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified)$"](${t}););out center tags;`, bbox, 'bridges') as any,
    { flatProperties: true },
  ) as FeatureCollection;

  const out: any[] = [];
  const seen = new Set<string>();
  for (const f of [...poi.features, ...bridges.features]) {
    const p = f.properties ?? {};
    const kind = kindOf(p);
    if (!kind) continue;
    let c: [number, number];
    try {
      c = turf.centroid(f as any).geometry.coordinates as [number, number];
    } catch {
      continue;
    }
    if (!insideCircle(c)) continue;
    let river: string | null = null;
    if (kind === 'bridge') {
      river = nearRiver(c);
      if (!river) continue; // only bridges over named rivers
    }
    const key = `${kind}|${c[0].toFixed(4)}|${c[1].toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [Math.round(c[0] * 1e5) / 1e5, Math.round(c[1] * 1e5) / 1e5] },
      properties: { osm_id: Number(String(f.id).replace(/^\D+/, '')) || 0, kind, name: p['name:ru'] ?? p.name ?? null, river, brand: p.brand ?? null },
    });
  }
  const counts: Record<string, number> = {};
  for (const f of out) counts[f.properties.kind] = (counts[f.properties.kind] ?? 0) + 1;
  writeFileSync(
    `${OUT}/infra.geojson`,
    JSON.stringify({ type: 'FeatureCollection', meta: { generated_at: new Date().toISOString(), sources: ['OpenStreetMap via Overpass API'], license: 'ODbL 1.0 — © OpenStreetMap contributors' }, features: out }),
  );
  console.log('infra.geojson', out.length, counts);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
