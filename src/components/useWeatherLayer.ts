/**
 * Weather overlay for the map: wind arrows (direction + speed), rain and cloud bands,
 * all evaluated at the scrubber hour from the Open-Meteo grid. Bands are interpolated
 * on the client (IDW → isobands) so they follow the time scrubber like the spot dots.
 */
import { useEffect, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MLMap } from 'maplibre-gl';
import interpolate from '@turf/interpolate';
import isobands from '@turf/isobands';
import { featureCollection, point } from '@turf/helpers';
import type { FeatureCollection } from 'geojson';
import type { WeatherGrid } from '@/data/weatherGrid';
import { weatherAt } from '@/model/weather';
import { timeHM, dayShort, windDirText, weatherWord } from '@/lib/format';

const RAIN_BREAKS = [0.1, 0.5, 2, 5, 50]; // mm/h
const CLOUD_BREAKS = [50, 80, 101]; // %

export function buildWeatherGeo(grid: WeatherGrid | undefined, date: Date) {
  const empty = featureCollection([]) as FeatureCollection;
  if (!grid?.points.length) return { points: empty, rain: empty, cloud: empty };
  const pts = grid.points
    .map((p) => {
      const w = weatherAt(p.hourly, date);
      if (!w) return null;
      return point([p.lon, p.lat], {
        ws: Math.round(w.wind_speed * 10) / 10,
        wd: Math.round(w.wind_dir),
        gust: Math.round(w.gusts),
        precip: Math.round(w.precip * 10) / 10,
        cloud: Math.round(w.cloud),
        temp: Math.round(w.temp_c),
        pmsl: Math.round(w.pressure_msl),
        ptrend: Math.round(w.pressure_trend_24h),
        code: w.weather_code,
        t: w.time,
      });
    })
    .filter((f): f is NonNullable<typeof f> => !!f);
  const points = featureCollection(pts) as FeatureCollection;
  let rain = empty;
  let cloud = empty;
  try {
    const gridRain = interpolate(points as any, 18, { gridType: 'point', property: 'precip', units: 'kilometers', weight: 2 });
    rain = isobands(gridRain as any, RAIN_BREAKS, { zProperty: 'precip' }) as FeatureCollection;
    const gridCloud = interpolate(points as any, 18, { gridType: 'point', property: 'cloud', units: 'kilometers', weight: 2 });
    cloud = isobands(gridCloud as any, CLOUD_BREAKS, { zProperty: 'cloud' }) as FeatureCollection;
  } catch {
    /* interpolation needs ≥ 3 points; keep bands empty */
  }
  return { points, rain, cloud };
}

function arrowImage(dark: boolean): ImageData {
  const s = 48;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d')!;
  ctx.translate(s / 2, s / 2);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // halo
  ctx.strokeStyle = dark ? '#0f1a20' : '#ffffff';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(0, 16);
  ctx.lineTo(0, -14);
  ctx.moveTo(-8, -6);
  ctx.lineTo(0, -15);
  ctx.lineTo(8, -6);
  ctx.stroke();
  ctx.strokeStyle = dark ? '#e6ecef' : '#14232b';
  ctx.lineWidth = 3;
  ctx.stroke();
  return ctx.getImageData(0, 0, s, s);
}

export function useWeatherLayer(map: MLMap | null, loaded: boolean, dark: boolean, grid: WeatherGrid | undefined, date: Date, visible: boolean) {
  const hourKey = Math.floor(date.getTime() / 3600000);
  const geo = useMemo(() => (visible ? buildWeatherGeo(grid, date) : null), [grid, hourKey, visible]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!map || !loaded) return;
    if (!map.hasImage('wx-arrow')) map.addImage('wx-arrow', arrowImage(dark), { pixelRatio: 2 });
    const before = map.getLayer('clusters') ? 'clusters' : undefined;
    const ensure = (id: string, data: FeatureCollection, layers: any[]) => {
      if (map.getSource(id)) (map.getSource(id) as maplibregl.GeoJSONSource).setData(data);
      else {
        map.addSource(id, { type: 'geojson', data });
        for (const l of layers) if (!map.getLayer(l.id)) map.addLayer(l, before);
      }
    };
    const empty = featureCollection([]) as FeatureCollection;
    ensure('wx-cloud', geo?.cloud ?? empty, [
      { id: 'wx-cloud', type: 'fill', source: 'wx-cloud', paint: { 'fill-color': dark ? '#9fb0b9' : '#55656e', 'fill-opacity': ['case', ['==', ['get', 'cloud'], '80-101'], 0.22, 0.1] } },
    ]);
    ensure('wx-rain', geo?.rain ?? empty, [
      { id: 'wx-rain', type: 'fill', source: 'wx-rain', paint: { 'fill-color': dark ? '#7fb0cc' : '#2f5d75', 'fill-opacity': ['match', ['get', 'precip'], '0.1-0.5', 0.18, '0.5-2', 0.32, '2-5', 0.48, '5-50', 0.65, 0] } },
      { id: 'wx-rain-line', type: 'line', source: 'wx-rain', paint: { 'line-color': dark ? '#7fb0cc' : '#2f5d75', 'line-width': 0.6, 'line-opacity': 0.5 } },
    ]);
    ensure('wx-points', geo?.points ?? empty, [
      {
        id: 'wx-wind',
        type: 'symbol',
        source: 'wx-points',
        layout: {
          'icon-image': 'wx-arrow',
          'icon-rotate': ['%', ['+', ['get', 'wd'], 180], 360],
          'icon-rotation-alignment': 'map',
          'icon-size': ['interpolate', ['linear'], ['get', 'ws'], 0, 0.45, 4, 0.8, 8, 1.1, 14, 1.5],
          'icon-allow-overlap': true,
          'text-field': ['concat', ['to-string', ['get', 'ws']], ' м/с'],
          'text-font': ['Noto Sans Regular'],
          'text-size': 11,
          'text-offset': [0, 1.6],
          'text-anchor': 'top',
          'text-optional': true,
        },
        paint: { 'text-color': dark ? '#e6ecef' : '#14232b', 'text-halo-color': dark ? '#0f1a20' : '#ffffff', 'text-halo-width': 1.4, 'icon-opacity': ['interpolate', ['linear'], ['get', 'ws'], 0, 0.35, 2, 1] },
      },
    ]);
    for (const id of ['wx-cloud', 'wx-rain', 'wx-rain-line', 'wx-wind']) if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
  }, [map, loaded, geo, dark, visible]);

  // Tap on an arrow: readout built with DOM APIs (no HTML injection).
  useEffect(() => {
    if (!map || !loaded) return;
    const onClick = (e: maplibregl.MapMouseEvent) => {
      const f = map.queryRenderedFeatures(e.point, { layers: ['wx-wind'] })[0];
      if (!f) return;
      const p = f.properties as any;
      const box = document.createElement('div');
      const title = document.createElement('strong');
      const when = new Date(p.t);
      title.textContent = `${dayShort(when)}, ${timeHM(when)} — ${weatherWord(Number(p.code))}`;
      const line = (t: string) => {
        const d = document.createElement('div');
        d.textContent = t;
        return d;
      };
      box.append(
        title,
        line(`${p.temp}°, ветер ${windDirText(Number(p.wd))} ${p.ws} м/с, порывы ${p.gust}`),
        line(`осадки ${p.precip} мм/ч, облачность ${p.cloud} %`),
        line(`давление ${p.pmsl} гПа (${p.ptrend >= 0 ? '+' : ''}${p.ptrend} за сутки)`),
      );
      const cap = document.createElement('span');
      cap.className = 'caption';
      cap.textContent = 'Open-Meteo, прогноз для ближайшей точки сетки';
      box.append(cap);
      new maplibregl.Popup({ closeButton: true, maxWidth: '280px' }).setLngLat(e.lngLat).setDOMContent(box).addTo(map);
    };
    map.on('click', 'wx-wind', onClick);
    map.on('mouseenter', 'wx-wind', () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', 'wx-wind', () => (map.getCanvas().style.cursor = ''));
    return () => {
      map.off('click', 'wx-wind', onClick);
    };
  }, [map, loaded]);
}
