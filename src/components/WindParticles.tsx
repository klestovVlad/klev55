/**
 * Wind as drifting particles on a canvas over the map (optional layer, off by default: it costs battery).
 * Field = inverse-distance interpolation of the forecast grid at the scrubber hour; particles live in
 * lon/lat so panning and zooming keep them in place. Honours prefers-reduced-motion and hidden tabs.
 */
import { useEffect, useRef } from 'react';
import type { Map as MLMap } from 'maplibre-gl';
import type { WeatherGrid } from '@/data/weatherGrid';
import { weatherAt } from '@/model/weather';
import { kmBetween, CENTER } from '@/lib/isofield';

interface Props {
  map: MLMap | null;
  grid: WeatherGrid | undefined;
  date: Date;
  visible: boolean;
  dark: boolean;
}

interface P {
  lon: number;
  lat: number;
  age: number;
  life: number;
}

const COUNT_DESKTOP = 1400;
const COUNT_MOBILE = 700;
const R_KM = 200;

export function WindParticles({ map, grid, date, visible, dark }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const hourKey = Math.floor(date.getTime() / 3600000);

  useEffect(() => {
    const canvas = ref.current;
    if (!map || !canvas || !visible || !grid?.points.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Wind vectors (east, north components) at the hour, one per grid point.
    const nodes = grid.points
      .map((p) => {
        const w = weatherAt(p.hourly, date);
        if (!w) return null;
        const rad = ((w.wind_dir + 180) % 360) * (Math.PI / 180); // direction the air moves to
        return { lon: p.lon, lat: p.lat, u: Math.sin(rad) * w.wind_speed, v: Math.cos(rad) * w.wind_speed };
      })
      .filter((n): n is NonNullable<typeof n> => !!n);
    if (nodes.length < 3) return;
    const windAt = (lon: number, lat: number) => {
      let u = 0;
      let v = 0;
      let den = 0;
      for (const n of nodes) {
        const d = Math.max(1, kmBetween([lon, lat], [n.lon, n.lat]));
        const w = 1 / (d * d);
        u += w * n.u;
        v += w * n.v;
        den += w;
      }
      return [u / den, v / den];
    };

    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const container = map.getContainer();
    const resize = () => {
      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    resize();

    const mobile = window.innerWidth < 900;
    const count = mobile ? COUNT_MOBILE : COUNT_DESKTOP;
    const cosLat = Math.cos((CENTER[1] * Math.PI) / 180);
    const spawn = (p: P) => {
      // uniform in the circle
      const r = R_KM * Math.sqrt(Math.random());
      const a = Math.random() * Math.PI * 2;
      p.lat = CENTER[1] + (r * Math.cos(a)) / 111.2;
      p.lon = CENTER[0] + (r * Math.sin(a)) / (111.2 * cosLat);
      p.age = 0;
      p.life = 60 + Math.random() * 120;
    };
    const ps: P[] = Array.from({ length: count }, () => {
      const p = { lon: 0, lat: 0, age: 0, life: 0 };
      spawn(p);
      p.age = Math.random() * p.life;
      return p;
    });

    // Visual speed: km per frame at 1 m/s; scaled by zoom so motion reads the same on screen.
    const stroke = dark ? 'rgba(230,236,239,0.55)' : 'rgba(20,35,43,0.5)';
    let raf = 0;
    let last = performance.now();
    const clear = () => ctx.clearRect(0, 0, canvas.width, canvas.height);
    map.on('move', clear);
    map.on('resize', resize);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden) return;
      const dt = Math.min(50, now - last) / 16.7;
      last = now;
      // fade trails
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = 'rgba(0,0,0,0.9)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      const zoom = map.getZoom();
      const kmPerFrame = 0.9 * Math.pow(2, 7.2 - zoom) * dt; // ≈ constant on-screen speed across zooms
      const bounds = map.getBounds();
      for (const p of ps) {
        const [u, v] = windAt(p.lon, p.lat);
        const speed = Math.hypot(u, v);
        const a = map.project([p.lon, p.lat]);
        const step = kmPerFrame * (0.35 + speed * 0.25);
        p.lat += (v / Math.max(0.01, speed)) * (step / 111.2);
        p.lon += (u / Math.max(0.01, speed)) * (step / (111.2 * cosLat));
        p.age += dt;
        const b = map.project([p.lon, p.lat]);
        const out = kmBetween([p.lon, p.lat], CENTER) > R_KM || p.age > p.life;
        if (!out && bounds.contains([p.lon, p.lat]) && Math.abs(b.x - a.x) < 40 && Math.abs(b.y - a.y) < 40) {
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
        }
        if (out) spawn(p);
      }
      ctx.stroke();
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      map.off('move', clear);
      map.off('resize', resize);
      clear();
    };
  }, [map, grid, hourKey, visible, dark]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null;
  return <canvas ref={ref} className="wind-canvas" aria-hidden="true" />;
}
