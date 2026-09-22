import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MLMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { FeatureCollection } from 'geojson';
import { useStore } from '@/app/store';
import { useWater, useZones, useObservations, useAdmin, useInfra } from '@/data/load';
import { infraIcon, INFRA_LABEL } from './infraIcons';
import { useSpotScores } from '@/model/useScores';
import { activeZones } from '@/model/hydro';
import { useWeatherGrid } from '@/data/weatherGrid';
import { useWeatherLayer } from './useWeatherLayer';
import { CHANCE_HEX } from '@/lib/format';
import './map.css';

const STYLE = { light: 'https://tiles.openfreemap.org/styles/positron', dark: 'https://tiles.openfreemap.org/styles/fiord' };
const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

function isDark() {
  const t = document.documentElement.getAttribute('data-theme');
  if (t) return t === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

const CIRCLE: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: Array.from({ length: 129 }, (_, i) => {
          const a = (i / 128) * 2 * Math.PI;
          const dLat = (200 / 111.2) * Math.cos(a);
          const dLon = (200 / (111.2 * Math.cos((54.99 * Math.PI) / 180))) * Math.sin(a);
          return [73.37 + dLon, 54.99 + dLat];
        }),
      },
    },
  ],
};

export function MapView() {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const [loaded, setLoaded] = useState(false);
  const dark = isDark();
  const water = useWater(loaded);
  const zones = useZones();
  const admin = useAdmin();
  const infra = useInfra(loaded);
  const layers = useStore((s) => s.layers);
  const obs = useObservations(layers.observations);
  const { scores, date } = useSpotScores();
  const grid = useWeatherGrid();
  useWeatherLayer(mapRef.current, loaded, dark, grid.data, date, layers.weather);
  const set = useStore((s) => s.set);
  const spotId = useStore((s) => s.spotId);

  // Create map once.
  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: ref.current,
      style: dark ? STYLE.dark : STYLE.light,
      center: [73.37, 54.99],
      zoom: 7.2,
      minZoom: 5,
      maxZoom: 16,
      attributionControl: false,
      cooperativeGestures: false,
    });
    map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: 'OpenFreeMap © OpenMapTiles, © OpenStreetMap contributors (ODbL)' }), 'bottom-left');
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }), 'top-right');
    const russianLabels = () => {
      for (const l of map.getStyle().layers ?? []) {
        // Only the basemap's own labels; our layers (spots, clusters, water) keep their text-field.
        if (l.type !== 'symbol' || (l as any).source !== 'openmaptiles') continue;
        const tf = map.getLayoutProperty(l.id, 'text-field');
        // Only name labels; road shields use `ref` and must keep it (otherwise empty white boxes).
        if (!tf || !JSON.stringify(tf).includes('name')) continue;
        map.setLayoutProperty(l.id, 'text-field', ['coalesce', ['get', 'name:ru'], ['get', 'name']]);
      }
    };
    map.on('load', () => {
      russianLabels();
      // Start with the attribution collapsed (MapLibre opens its <details> on load); the ⓘ button expands it.
      const collapse = () => {
        const d = ref.current?.querySelector('details.maplibregl-ctrl-attrib') as HTMLDetailsElement | null;
        if (d) d.open = false;
      };
      collapse();
      map.once('idle', collapse);
      setLoaded(true);
    });
    map.on('styledata', () => {
      try {
        russianLabels();
      } catch {
        /* style not ready */
      }
    });
    map.on('error', (e) => console.warn('map error', e.error?.message ?? e));
    if (import.meta.env.DEV) (window as any).__map = map;
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Theme switch → restyle (re-adds sources on next 'styledata').
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !loaded) return;
    const want = dark ? STYLE.dark : STYLE.light;
    if ((m.getStyle() as any)?.name && (m as any)._klevStyle !== want) {
      (m as any)._klevStyle = want;
      setLoaded(false);
      m.setStyle(want);
      m.once('styledata', () => setLoaded(true));
    }
  }, [dark, loaded]);

  // Static layers: circle, water, zones, satellite.
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !loaded) return;
    // Overlays (water, zones, KZ mask) must stay under the spot dots and cluster bubbles whatever their load order.
    const below = () => (m.getLayer('clusters') ? 'clusters' : undefined);
    const add = (id: string, data: any, layersDef: any[]) => {
      if (m.getSource(id)) (m.getSource(id) as maplibregl.GeoJSONSource).setData(data);
      else {
        m.addSource(id, { type: 'geojson', data });
        for (const l of layersDef) if (!m.getLayer(l.id)) m.addLayer(l, below());
      }
    };
    if (!m.getSource('esri')) {
      m.addSource('esri', { type: 'raster', tiles: [ESRI], tileSize: 256, attribution: 'Imagery: Esri, Maxar, Earthstar Geographics, and the GIS User Community' });
      const first = m.getStyle().layers?.find((l) => l.type === 'symbol')?.id;
      m.addLayer({ id: 'esri', type: 'raster', source: 'esri', layout: { visibility: 'none' } }, first);
    }
    if (admin.data) {
      const kz = { type: 'FeatureCollection', features: admin.data.features.filter((f) => f.properties?.kind === 'kz') } as FeatureCollection;
      add('kz', kz, [
        { id: 'kz-fill', type: 'fill', source: 'kz', paint: { 'fill-color': dark ? '#000000' : '#8a949a', 'fill-opacity': 0.22 } },
        { id: 'kz-line', type: 'line', source: 'kz', paint: { 'line-color': dark ? '#9fb0b9' : '#55656e', 'line-width': 1.2, 'line-dasharray': [3, 3] } },
        { id: 'kz-label', type: 'symbol', source: 'kz', minzoom: 6, layout: { 'text-field': 'Казахстан — другая юрисдикция, правила РК не включены', 'text-size': 12, 'text-font': ['Noto Sans Regular'], 'symbol-placement': 'point', 'text-max-width': 14 }, paint: { 'text-color': dark ? '#9fb0b9' : '#55656e', 'text-halo-color': dark ? '#0f1a20' : '#ffffff', 'text-halo-width': 1.2 } },
      ]);
    }
    add('circle', CIRCLE, [{ id: 'circle', type: 'line', source: 'circle', paint: { 'line-color': dark ? '#7fb0cc' : '#2f5d75', 'line-width': 1, 'line-dasharray': [4, 4], 'line-opacity': 0.6 } }]);
    if (water.data) {
      add('water', water.data, [
        { id: 'water-fill', type: 'fill', source: 'water', filter: ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']], paint: { 'fill-color': ['case', ['==', ['get', 'jurisdiction'], 'kz'], dark ? '#3a4a55' : '#c9d1d6', dark ? '#3f7a99' : '#7fa8c0'], 'fill-opacity': 0.55 } },
        { id: 'water-hit', type: 'line', source: 'water', filter: ['any', ['==', ['geometry-type'], 'LineString'], ['==', ['geometry-type'], 'MultiLineString']], paint: { 'line-color': '#000', 'line-opacity': 0, 'line-width': 18 } },
        { id: 'water-line', type: 'line', source: 'water', filter: ['any', ['==', ['geometry-type'], 'LineString'], ['==', ['geometry-type'], 'MultiLineString']], paint: { 'line-color': ['case', ['==', ['get', 'jurisdiction'], 'kz'], dark ? '#4a5a65' : '#b3bec5', dark ? '#5f93b0' : '#2f5d75'], 'line-width': ['interpolate', ['linear'], ['zoom'], 6, ['case', ['==', ['get', 'type'], 'river'], 1.8, 0.6], 11, ['case', ['==', ['get', 'type'], 'river'], 3.5, 1.4]], 'line-opacity': 0.9 } },
        { id: 'water-label-line', type: 'symbol', source: 'water', minzoom: 8, filter: ['all', ['has', 'name'], ['!=', ['get', 'name'], ''], ['any', ['==', ['geometry-type'], 'LineString'], ['==', ['geometry-type'], 'MultiLineString']]], layout: { 'text-field': ['get', 'name'], 'text-size': 12, 'text-font': ['Noto Sans Italic'], 'symbol-placement': 'line', 'text-max-angle': 30 }, paint: { 'text-color': dark ? '#9fc3d6' : '#2f5d75', 'text-halo-color': dark ? '#0f1a20' : '#ffffff', 'text-halo-width': 1.2 } },
        { id: 'water-label-poly', type: 'symbol', source: 'water', minzoom: 9, filter: ['all', ['has', 'name'], ['!=', ['get', 'name'], ''], ['any', ['==', ['geometry-type'], 'Polygon'], ['==', ['geometry-type'], 'MultiPolygon']]], layout: { 'text-field': ['get', 'name'], 'text-size': 12, 'text-font': ['Noto Sans Italic'], 'symbol-placement': 'point' }, paint: { 'text-color': dark ? '#9fc3d6' : '#2f5d75', 'text-halo-color': dark ? '#0f1a20' : '#ffffff', 'text-halo-width': 1.2 } },
      ]);
    }
    if (zones.data) {
      const active = { type: 'FeatureCollection', features: activeZones(zones.data, date) } as FeatureCollection;
      const all = zones.data;
      // Out-of-season view: every pit in muted grey with its dates, so a place can be judged before winter.
      add('zones-all', all, [
        { id: 'zones-all-fill', type: 'fill', source: 'zones-all', paint: { 'fill-color': dark ? '#9fb0b9' : '#55656e', 'fill-opacity': 0.18 } },
        { id: 'zones-all-line', type: 'line', source: 'zones-all', paint: { 'line-color': dark ? '#9fb0b9' : '#55656e', 'line-width': 1.2, 'line-dasharray': [2, 2] } },
        { id: 'zones-all-label', type: 'symbol', source: 'zones-all', minzoom: 9, layout: { 'text-field': ['concat', ['get', 'name'], '\n15.11–20.04'], 'text-size': 11, 'text-font': ['Noto Sans Regular'], 'text-anchor': 'top', 'text-offset': [0, 0.6] }, paint: { 'text-color': dark ? '#9fb0b9' : '#55656e', 'text-halo-color': dark ? '#0f1a20' : '#ffffff', 'text-halo-width': 1.2 } },
      ]);
      add('zones', active, [
        { id: 'zones-fill', type: 'fill', source: 'zones', paint: { 'fill-pattern': 'hatch' as any, 'fill-opacity': 0.9 } },
        { id: 'zones-line', type: 'line', source: 'zones', paint: { 'line-color': dark ? '#e4685b' : '#b0382c', 'line-width': 1.5 } },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, water.data, zones.data, admin.data, Math.floor(date.getTime() / 86400000), dark]);

  // Hatch pattern for active zones.
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !loaded || m.hasImage('hatch')) return;
    const size = 12;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d')!;
    ctx.strokeStyle = dark ? '#e4685b' : '#b0382c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, size);
    ctx.lineTo(size, 0);
    ctx.moveTo(-size / 2, size / 2);
    ctx.lineTo(size / 2, -size / 2);
    ctx.moveTo(size / 2, size * 1.5);
    ctx.lineTo(size * 1.5, size / 2);
    ctx.stroke();
    m.addImage('hatch', ctx.getImageData(0, 0, size, size), { pixelRatio: 1 });
  }, [loaded, dark]);

  // Layer toggles.
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !loaded) return;
    const vis = (id: string, on: boolean) => m.getLayer(id) && m.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none');
    vis('esri', layers.satellite);
    vis('zones-fill', layers.zones);
    vis('zones-line', layers.zones);
    vis('zones-all-fill', layers.zonesAll);
    vis('zones-all-line', layers.zonesAll);
    vis('zones-all-label', layers.zonesAll);
  }, [loaded, layers]);

  // Observations (optional layer).
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !loaded) return;
    if (obs.data && !m.getSource('obs')) {
      m.addSource('obs', { type: 'geojson', data: obs.data });
      m.addLayer({ id: 'obs', type: 'circle', source: 'obs', paint: { 'circle-radius': 4, 'circle-color': dark ? '#a9bd5e' : '#6e7f3a', 'circle-stroke-color': dark ? '#0f1a20' : '#fff', 'circle-stroke-width': 1 } });
      m.on('click', 'obs', (e) => {
        const p = e.features?.[0]?.properties as any;
        if (!p) return;
        // Observation properties come from third-party APIs: build the popup with DOM APIs, never innerHTML.
        const box = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = String(p.species_ru ?? p.species ?? '');
        const lat = document.createElement('div');
        lat.textContent = String(p.species ?? '');
        const meta = document.createElement('span');
        meta.className = 'caption';
        meta.textContent = [p.src, p.date, p.license].filter(Boolean).join(', ');
        box.append(title, lat, meta);
        if (typeof p.url === 'string' && /^https:\/\/(www\.)?(gbif\.org|inaturalist\.org)\//.test(p.url)) {
          const a = document.createElement('a');
          a.href = p.url;
          a.target = '_blank';
          a.rel = 'noopener';
          a.textContent = 'запись';
          box.append(document.createElement('br'), a);
        }
        new maplibregl.Popup({ closeButton: true, maxWidth: '260px' }).setLngLat(e.lngLat).setDOMContent(box).addTo(m);
      });
    }
    if (m.getLayer('obs')) m.setLayoutProperty('obs', 'visibility', layers.observations ? 'visible' : 'none');
  }, [loaded, obs.data, layers.observations, dark]);

  // Infrastructure: bridges, dams, slipways, shops, fuel, camps — only when zoomed in (≥ 9.5), so the overview stays clean.
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !loaded || !infra.data) return;
    for (const k of Object.keys(INFRA_LABEL)) if (!m.hasImage(`infra-${k}`)) m.addImage(`infra-${k}`, infraIcon(k, dark), { pixelRatio: 2 });
    if (!m.getSource('infra')) {
      m.addSource('infra', { type: 'geojson', data: infra.data });
      const before = m.getLayer('clusters') ? 'clusters' : undefined;
      const layout = { 'icon-image': ['concat', 'infra-', ['get', 'kind']], 'icon-size': 1, 'icon-allow-overlap': false, 'icon-padding': 4 } as any;
      // Water structures, launches, shops and camps from zoom 9.5; fuel (300 stations) only from 11 so the overview stays clean.
      m.addLayer({ id: 'infra', type: 'symbol', source: 'infra', minzoom: 9.5, filter: ['!=', ['get', 'kind'], 'fuel'], layout }, before);
      m.addLayer({ id: 'infra-fuel', type: 'symbol', source: 'infra', minzoom: 11, filter: ['==', ['get', 'kind'], 'fuel'], layout }, before);
      const onInfra = (e: maplibregl.MapMouseEvent & { features?: any[] }) => {
        if (m.queryRenderedFeatures(e.point, { layers: ['spots', 'clusters'] }).length) return;
        const p = e.features?.[0]?.properties as any;
        if (!p) return;
        const box = document.createElement('div');
        const t = document.createElement('strong');
        t.textContent = INFRA_LABEL[p.kind] ?? p.kind;
        box.append(t);
        const sub = [p.name, p.brand, p.river ? `через ${p.river}` : null].filter(Boolean).join(', ');
        if (sub) {
          const d = document.createElement('div');
          d.textContent = sub;
          box.append(d);
        }
        if (p.kind === 'dam' || p.kind === 'weir' || p.kind === 'lock' || p.kind === 'bridge') {
          const d = document.createElement('div');
          d.className = 'caption';
          d.textContent = 'У гидросооружений и мостов есть охранная зона: ловить вплотную нельзя.';
          box.append(d);
        }
        const c = document.createElement('span');
        c.className = 'caption';
        c.textContent = 'OpenStreetMap';
        box.append(c);
        new maplibregl.Popup({ closeButton: true, maxWidth: '260px' }).setLngLat(e.lngLat).setDOMContent(box).addTo(m);
      };
      for (const id of ['infra', 'infra-fuel']) {
        m.on('click', id, onInfra);
        m.on('mouseenter', id, () => (m.getCanvas().style.cursor = 'pointer'));
        m.on('mouseleave', id, () => (m.getCanvas().style.cursor = ''));
      }
    } else (m.getSource('infra') as maplibregl.GeoJSONSource).setData(infra.data);
    for (const id of ['infra', 'infra-fuel']) m.setLayoutProperty(id, 'visibility', layers.infra ? 'visible' : 'none');
  }, [loaded, infra.data, dark, layers.infra]);

  // Spots: recolored by chance on every score change.
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !loaded) return;
    const hex = dark ? CHANCE_HEX.dark : CHANCE_HEX.light;
    const fc: FeatureCollection = {
      type: 'FeatureCollection',
      features: scores.map((s) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: s.spot.coords },
        properties: { id: s.spot.id, name: s.spot.name, score: s.result.score, legal: s.result.legal, conf: s.spot.confidence, paid: s.spot.type === 'платник' ? 1 : 0, lake: ['озеро', 'пруд', 'водохранилище', 'платник'].includes(s.spot.type) ? 1 : 0, selected: s.spot.id === spotId ? 1 : 0 },
      })),
    };
    const colorExpr: any = ['case', ['==', ['get', 'legal'], 'banned'], dark ? '#4a5a65' : '#c9d1d6', ['step', ['get', 'score'], hex[0], 40, hex[1], 60, hex[2], 80, hex[3]]];
    if (m.getSource('spots')) {
      (m.getSource('spots') as maplibregl.GeoJSONSource).setData(fc);
      m.setPaintProperty('spots', 'circle-color', colorExpr);
      m.setPaintProperty('spots-halo', 'circle-color', colorExpr);
    } else {
      m.addSource('spots', { type: 'geojson', data: fc, cluster: true, clusterRadius: 40, clusterMaxZoom: 8, clusterProperties: { max: ['max', ['get', 'score']] } });
      m.addLayer({ id: 'clusters', type: 'circle', source: 'spots', filter: ['has', 'point_count'], paint: { 'circle-color': ['step', ['get', 'max'], hex[0], 40, hex[1], 60, hex[2], 80, hex[3]], 'circle-radius': 15, 'circle-stroke-width': 2, 'circle-stroke-color': dark ? '#0f1a20' : '#ffffff' } });
      m.addLayer({ id: 'cluster-count', type: 'symbol', source: 'spots', filter: ['has', 'point_count'], layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 13, 'text-font': ['Noto Sans Regular'], 'text-allow-overlap': true }, paint: { 'text-color': '#ffffff' } });
      m.addLayer({ id: 'spots-halo', type: 'circle', source: 'spots', filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'selected'], 1]], paint: { 'circle-radius': 18, 'circle-color': colorExpr, 'circle-opacity': 0.25 } });
      m.addLayer({
        id: 'spots',
        type: 'circle',
        source: 'spots',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': colorExpr,
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, ['+', 5, ['get', 'conf']], 10, ['+', 8, ['*', 1.5, ['get', 'conf']]]],
          'circle-stroke-width': ['case', ['==', ['get', 'paid'], 1], 3, 1.5],
          'circle-stroke-color': ['case', ['==', ['get', 'paid'], 1], dark ? '#e6ecef' : '#14232b', dark ? '#0f1a20' : '#ffffff'],
          'circle-color-transition': { duration: 150 },
        },
      });
      m.addLayer({ id: 'spots-label', type: 'symbol', source: 'spots', minzoom: 8.5, filter: ['!', ['has', 'point_count']], layout: { 'text-field': ['get', 'name'], 'text-size': 12, 'text-font': ['Noto Sans Regular'], 'text-offset': [0, 1.3], 'text-anchor': 'top', 'text-optional': true }, paint: { 'text-color': dark ? '#e6ecef' : '#14232b', 'text-halo-color': dark ? '#0f1a20' : '#ffffff', 'text-halo-width': 1.4 } });
      m.on('click', 'spots', (e) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (id) set({ spotId: id, waterId: null });
      });
      m.on('click', 'clusters', (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const src = m.getSource('spots') as maplibregl.GeoJSONSource;
        const id = (f.properties as any).cluster_id as number;
        // Zoom so the bubble visibly splits: fit the cluster's members with padding, never less than the expansion zoom + 0.5.
        Promise.all([src.getClusterExpansionZoom(id), src.getClusterLeaves(id, 50, 0)]).then(([z, leaves]: [number, any[]]) => {
          const coords = leaves.map((l) => l.geometry.coordinates as [number, number]);
          if (coords.length < 2) {
            m.easeTo({ center: (f.geometry as any).coordinates, zoom: Math.max(z + 0.5, m.getZoom() + 1.5), duration: 500 });
            return;
          }
          const lons = coords.map((c) => c[0]);
          const lats = coords.map((c) => c[1]);
          const desktop = window.innerWidth >= 900;
          m.fitBounds([[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]], {
            padding: desktop ? { top: 120, bottom: 80, left: 500, right: 80 } : { top: 140, bottom: window.innerHeight * 0.4, left: 40, right: 40 },
            maxZoom: 13,
            duration: 500,
          });
          m.once('moveend', () => {
            if (m.getZoom() < z + 0.5) m.easeTo({ zoom: z + 0.5, duration: 250 });
          });
        });
      });
      m.on('click', 'water-fill', (e) => {
        if (m.queryRenderedFeatures(e.point, { layers: ['spots', 'clusters'] }).length) return;
        const p = e.features?.[0]?.properties as any;
        if (p?.osm_id) set({ waterId: p.osm_id, spotId: null });
      });
      m.on('click', 'water-hit', (e) => {
        if (m.queryRenderedFeatures(e.point, { layers: ['spots', 'clusters', 'water-fill'] }).length) return;
        const p = e.features?.[0]?.properties as any;
        if (p?.osm_id) set({ waterId: p.osm_id, spotId: null });
      });
      const onZone = (e: maplibregl.MapMouseEvent & { features?: any[] }) => {
        if (m.queryRenderedFeatures(e.point, { layers: ['spots', 'clusters'] }).length) return;
        const p = e.features?.[0]?.properties as any;
        if (!p) return;
        const box = document.createElement('div');
        const t = document.createElement('strong');
        t.textContent = p.name;
        const d = document.createElement('div');
        d.textContent = `Зимовальная яма, ловля запрещена с ${String(p.active_from).split('-').reverse().join('.')} по ${String(p.active_to).split('-').reverse().join('.')}. ${p.landmark ?? ''}`;
        const c = document.createElement('span');
        c.className = 'caption';
        c.textContent = 'Приказ Минсельхоза № 646, Приложение № 1. Граница приблизительная.';
        box.append(t, d, c);
        new maplibregl.Popup({ closeButton: true, maxWidth: '280px' }).setLngLat(e.lngLat).setDOMContent(box).addTo(m);
      };
      for (const id of ['zones-fill', 'zones-all-fill']) {
        m.on('click', id, onZone);
        m.on('mouseenter', id, () => (m.getCanvas().style.cursor = 'pointer'));
        m.on('mouseleave', id, () => (m.getCanvas().style.cursor = ''));
      }
      for (const l of ['spots', 'clusters', 'water-fill', 'water-hit']) {
        m.on('mouseenter', l, () => (m.getCanvas().style.cursor = 'pointer'));
        m.on('mouseleave', l, () => (m.getCanvas().style.cursor = ''));
      }
    }
  }, [loaded, scores, dark, spotId, set]);

  // Fly to selected spot.
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !loaded || !spotId) return;
    const s = scores.find((x) => x.spot.id === spotId);
    if (!s) return;
    const isMobile = window.innerWidth < 900;
    m.easeTo({ center: s.spot.coords, zoom: Math.max(m.getZoom(), 10), offset: isMobile ? [0, -window.innerHeight * 0.18] : [0, 0], duration: 500 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotId, loaded]);

  return <div ref={ref} className="map" role="region" aria-label="Карта мест рыбалки" />;
}

export function flyTo(map: MLMap | null, coords: [number, number], zoom = 10) {
  map?.easeTo({ center: coords, zoom });
}
