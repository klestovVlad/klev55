/**
 * Helper for spot authors: report the nearest water feature(s) to a point.
 * Usage: npx tsx scripts/nearest-water.ts <lon> <lat> [name-filter]
 * Prints distance in metres, osm_id, name, type, jurisdiction, and a snapped point on the water.
 */
import { readFileSync } from 'node:fs';
import * as turf from '@turf/turf';

const [lonS, latS, filter] = process.argv.slice(2);
if (!lonS || !latS) {
  console.error('usage: nearest-water <lon> <lat> [name-filter]');
  process.exit(2);
}
const pt = turf.point([Number(lonS), Number(latS)]);
const water = JSON.parse(readFileSync('public/data/water.geojson', 'utf8'));

export function nearest(p: [number, number], nameFilter?: string, limit = 5) {
  const P = turf.point(p);
  const res: { d: number; f: any; snap: [number, number] }[] = [];
  for (const f of water.features) {
    if (nameFilter && !String(f.properties.name ?? '').toLowerCase().includes(nameFilter.toLowerCase())) continue;
    const g = f.geometry;
    let d = Infinity;
    let snap: [number, number] = p;
    try {
      if (g.type === 'Polygon' || g.type === 'MultiPolygon') {
        if (turf.booleanPointInPolygon(P, f)) {
          d = 0;
        } else {
          const lines = turf.polygonToLine(f as any);
          const feats = lines.type === 'FeatureCollection' ? lines.features : [lines];
          for (const l of feats) {
            const ls = l.geometry.type === 'MultiLineString' ? turf.flatten(l).features : [l];
            for (const one of ls) {
              const s = turf.nearestPointOnLine(one as any, P, { units: 'meters' });
              if ((s.properties.dist ?? Infinity) < d) {
                d = s.properties.dist!;
                snap = s.geometry.coordinates as [number, number];
              }
            }
          }
        }
      } else if (g.type === 'LineString' || g.type === 'MultiLineString') {
        const ls = g.type === 'MultiLineString' ? turf.flatten(f as any).features : [f];
        for (const one of ls) {
          const s = turf.nearestPointOnLine(one as any, P, { units: 'meters' });
          if ((s.properties.dist ?? Infinity) < d) {
            d = s.properties.dist!;
            snap = s.geometry.coordinates as [number, number];
          }
        }
      }
    } catch {
      continue;
    }
    if (d < 20000) res.push({ d, f, snap });
  }
  res.sort((a, b) => a.d - b.d);
  return res.slice(0, limit);
}

if (process.argv[1]?.endsWith('nearest-water.ts')) {
  for (const r of nearest(pt.geometry.coordinates as [number, number], filter)) {
    const p = r.f.properties;
    console.log(`${Math.round(r.d)} м  osm_id=${p.osm_id}  ${p.type}  "${p.name || '(без имени)'}"  ${p.jurisdiction}  snap=[${r.snap[0].toFixed(5)}, ${r.snap[1].toFixed(5)}]`);
  }
}
