/** Build a HydroSnapshot for a spot from gauges.json (ice estimate + stale gauges) and zones.geojson. */
import * as turf from '@turf/turf';
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import type { Spot, Gauge, ZoneProps } from '@/data/types';
import type { IceEstimate } from '@/data/load';
import type { HydroSnapshot } from './types';
import { inWindow, omskParts } from '@/lib/time';

const LAKE_TYPES = new Set(['озеро', 'пруд', 'водохранилище', 'платник']);

export function activeZones(zones: FeatureCollection | undefined, date: Date): Feature<Polygon | MultiPolygon, ZoneProps>[] {
  if (!zones) return [];
  const p = omskParts(date);
  return zones.features.filter((f) => inWindow(p, f.properties!.active_from, f.properties!.active_to)) as any;
}

export function zoneNear(spot: Spot, zones: FeatureCollection | undefined, date: Date): HydroSnapshot['zone'] {
  const active = activeZones(zones, date);
  if (!active.length) return null;
  const pt = turf.point(spot.coords);
  let best: HydroSnapshot['zone'] = null;
  for (const z of active) {
    const inside = turf.booleanPointInPolygon(pt, z);
    let dist = 0;
    if (!inside) {
      const line = turf.polygonToLine(z as any);
      const feats = line.type === 'FeatureCollection' ? line.features : [line];
      dist = Infinity;
      for (const l of feats) for (const one of turf.flatten(l as any).features) dist = Math.min(dist, turf.nearestPointOnLine(one as any, pt, { units: 'meters' }).properties.dist ?? Infinity);
    }
    if (!best || dist < best.distance_m) best = { name: z.properties.name, inside, distance_m: Math.round(dist) };
  }
  return best && best.distance_m <= 3000 ? best : null;
}

export function hydroFor(spot: Spot, gauges: Gauge[] | undefined, ice: IceEstimate[] | undefined, zones: FeatureCollection | undefined, date: Date): HydroSnapshot {
  const lake = LAKE_TYPES.has(spot.type);
  // Ice: nearest station of the matching kind.
  let iceEst: IceEstimate | undefined;
  if (ice?.length) {
    const kind = lake ? 'lake' : 'river';
    const candidates = ice.filter((i) => i.kind === kind);
    iceEst = candidates[0] ?? ice[0];
    if (kind === 'river' && candidates.length > 1) {
      // omsk vs cherlak: pick by latitude
      iceEst = spot.coords[1] < 54.5 ? candidates.find((c) => c.station === 'cherlak') ?? candidates[0] : candidates.find((c) => c.station === 'omsk') ?? candidates[0];
    }
  }
  // Gauge: nearest, only Irtysh gauges exist; useful only for river spots on the Irtysh.
  let gauge: Gauge | undefined;
  let gaugeKm: number | null = null;
  if (gauges?.length && !lake) {
    for (const g of gauges) {
      const d = turf.distance(spot.coords, g.coords, { units: 'kilometers' });
      if (gaugeKm == null || d < gaugeKm) {
        gaugeKm = d;
        gauge = g;
      }
    }
  }
  const fresh = gauge?.measured_at ? Date.now() - Date.parse(gauge.measured_at) < 48 * 3600000 : false;
  const iceOn = !!iceEst && (iceEst.state === 'forming' || iceEst.state === 'solid' || iceEst.state === 'rotting');
  return {
    gauge_name: gauge?.name ?? null,
    gauge_km: gauge ? Math.round(gaugeKm!) : null,
    level_trend_cm_24h: fresh ? (gauge?.level_trend_cm_24h ?? null) : null,
    water_temp_c: fresh ? (gauge?.water_temp_c ?? null) : null,
    ice_on: iceOn,
    ice_thickness_cm: iceOn ? (iceEst?.thickness_cm ?? null) : null,
    ice_days: iceOn ? (iceEst?.days_since_ice_on ?? null) : null,
    days_to_ice_off: iceOn && iceEst?.est_ice_off ? Math.round((Date.parse(iceEst.est_ice_off) - date.getTime()) / 86400000) : null,
    zone: zoneNear(spot, zones, date),
  };
}
