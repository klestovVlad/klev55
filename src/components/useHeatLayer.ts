/**
 * «Поле шанса»: a soft field interpolated from the spot scores for the current filters and hour.
 * Only drawn within ~35 km of a known spot — no claims about water nobody described.
 */
import { useEffect, useMemo } from 'react';
import type { Map as MLMap, GeoJSONSource } from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';
import { featureCollection } from '@turf/helpers';
import { idwBands } from '@/lib/isofield';
import type { SpotScore } from '@/model/useScores';
import { CHANCE_HEX } from '@/lib/format';

const BREAKS = [45, 60, 80, 101];

export function buildHeat(scores: SpotScore[]): FeatureCollection {
  const samples = scores.filter((s) => s.result.legal !== 'banned').map((s) => ({ lon: s.spot.coords[0], lat: s.spot.coords[1], value: s.result.score }));
  return idwBands(samples, BREAKS, { cellKm: 12, power: 2, cutoffKm: 35, property: 'chance' });
}

export function useHeatLayer(map: MLMap | null, loaded: boolean, dark: boolean, scores: SpotScore[], visible: boolean) {
  const geo = useMemo(() => (visible ? buildHeat(scores) : null), [scores, visible]);
  useEffect(() => {
    if (!map || !loaded) return;
    const hex = dark ? CHANCE_HEX.dark : CHANCE_HEX.light;
    const empty = featureCollection([]) as FeatureCollection;
    if (map.getSource('heat')) (map.getSource('heat') as GeoJSONSource).setData(geo ?? empty);
    else {
      map.addSource('heat', { type: 'geojson', data: geo ?? empty });
      // Under everything of ours: the first of our own layers that exists is the insertion point.
      const before = ['kz-fill', 'zones-all-fill', 'wx-cloud', 'water-fill', 'clusters'].find((id) => map.getLayer(id));
      map.addLayer(
        {
          id: 'heat',
          type: 'fill',
          source: 'heat',
          paint: {
            'fill-color': ['match', ['get', 'chance'], '45-60', hex[1], '60-80', hex[2], '80-101', hex[3], hex[0]],
            'fill-opacity': ['match', ['get', 'chance'], '45-60', 0.14, '60-80', 0.2, '80-101', 0.26, 0],
            'fill-antialias': true,
          },
        },
        before,
      );
    }
    map.setLayoutProperty('heat', 'visibility', visible ? 'visible' : 'none');
  }, [map, loaded, geo, dark, visible]);
}
