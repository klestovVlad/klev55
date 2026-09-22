/**
 * Scalar field over the 200 km circle from sparse samples: inverse-distance weighting on a
 * regular grid → isobands → clipped to the circle. Shared by the weather overlay and the chance field.
 */
import isobands from '@turf/isobands';
import pointGrid from '@turf/point-grid';
import circle from '@turf/circle';
import intersect from '@turf/intersect';
import bbox from '@turf/bbox';
import { featureCollection, point } from '@turf/helpers';
import type { FeatureCollection } from 'geojson';

export const CENTER: [number, number] = [73.37, 54.99];
export const CIRCLE = circle(CENTER, 200, { steps: 96, units: 'kilometers' });
const CIRCLE_BBOX = bbox(CIRCLE) as [number, number, number, number];
const grids = new Map<number, FeatureCollection<any>>();

export function kmBetween(a: number[], b: number[]): number {
  const dLat = (b[1] - a[1]) * 111.2;
  const dLon = (b[0] - a[0]) * 111.2 * Math.cos(((a[1] + b[1]) / 2) * (Math.PI / 180));
  return Math.hypot(dLat, dLon);
}

export interface Sample {
  lon: number;
  lat: number;
  value: number;
}

export interface FieldOptions {
  cellKm?: number; // grid step
  power?: number; // IDW exponent
  cutoffKm?: number; // no value farther than this from the nearest sample (→ below the first break)
  property?: string;
}

/** IDW value at a point; NaN when the nearest sample is beyond cutoff. */
export function idwAt(samples: Sample[], lon: number, lat: number, power = 2, cutoffKm = Infinity): number {
  let num = 0;
  let den = 0;
  let nearest = Infinity;
  for (const s of samples) {
    const d = Math.max(0.5, kmBetween([lon, lat], [s.lon, s.lat]));
    if (d < nearest) nearest = d;
    const w = 1 / Math.pow(d, power);
    num += w * s.value;
    den += w;
  }
  if (!den || nearest > cutoffKm) return NaN;
  return num / den;
}

export function idwBands(samples: Sample[], breaks: number[], opts: FieldOptions = {}): FeatureCollection {
  const empty = featureCollection([]) as FeatureCollection;
  if (samples.length < 3) return empty;
  const cell = opts.cellKm ?? 16;
  const prop = opts.property ?? 'v';
  let grid = grids.get(cell);
  if (!grid) {
    grid = pointGrid(CIRCLE_BBOX, cell, { units: 'kilometers' }); // regular: marching squares needs the full matrix
    grids.set(cell, grid);
  }
  const valued = featureCollection(
    grid.features.map((g) => {
      const [lon, lat] = g.geometry.coordinates;
      const v = idwAt(samples, lon, lat, opts.power ?? 2, opts.cutoffKm ?? Infinity);
      return point([lon, lat], { [prop]: Number.isNaN(v) ? breaks[0] - 1 : v });
    }),
  );
  try {
    const raw = isobands(valued as any, breaks, { zProperty: prop }) as FeatureCollection;
    const clipped = raw.features
      .map((f) => {
        try {
          const c = intersect(featureCollection([f as any, CIRCLE as any]));
          return c ? { ...c, properties: f.properties } : null;
        } catch {
          return null;
        }
      })
      .filter((f): f is NonNullable<typeof f> => !!f);
    return featureCollection(clipped as any) as FeatureCollection;
  } catch {
    return empty;
  }
}
