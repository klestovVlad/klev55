import * as turf from '@turf/turf';

export const CENTER: [number, number] = [73.37, 54.99]; // lon, lat — Omsk
export const RADIUS_KM = 200;

/** Bounding box of the 200 km circle: [minLon, minLat, maxLon, maxLat]. */
export function circleBbox(): [number, number, number, number] {
  const c = turf.circle(CENTER, RADIUS_KM, { steps: 64, units: 'kilometers' });
  return turf.bbox(c) as [number, number, number, number];
}

export function circlePolygon() {
  return turf.circle(CENTER, RADIUS_KM, { steps: 128, units: 'kilometers' });
}

export function distanceKm(a: [number, number], b: [number, number]): number {
  return turf.distance(a, b, { units: 'kilometers' });
}

export function insideCircle(p: [number, number]): boolean {
  return distanceKm(CENTER, p) <= RADIUS_KM;
}

/** Overpass bbox string "south,west,north,east". */
export function overpassBbox(b = circleBbox()): string {
  return `${b[1].toFixed(4)},${b[0].toFixed(4)},${b[3].toFixed(4)},${b[2].toFixed(4)}`;
}
