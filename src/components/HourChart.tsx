import { useMemo, useState, type ReactElement } from 'react';
import type { HourScore } from '@/model/outlook';
import { solunarDay } from '@/model/solunar';
import { chanceColor, hourH, timeHM, dayShort } from '@/lib/format';
import { omskParts } from '@/lib/time';
import type { WeatherSeries } from '@/model/weather';
import { weatherAt } from '@/model/weather';
import './hourchart.css';

interface Props {
  scores: HourScore[]; // consecutive hours
  lat: number;
  lon: number;
  series?: WeatherSeries | null;
  selected?: Date;
  onSelect?: (d: Date) => void;
}

/** 24- or 48-hour bite chart drawn like a gauge staff: bars, tick ruler, sun/moon marks. */
export function HourChart({ scores, lat, lon, series, selected, onSelect }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const days = useMemo(() => {
    const out = new Map<number, ReturnType<typeof solunarDay>>();
    for (const s of scores) {
      const k = Math.floor((s.date.getTime() + 6 * 3600000) / 86400000);
      if (!out.has(k)) out.set(k, solunarDay(s.date, lat, lon));
    }
    return out;
  }, [scores, lat, lon]);
  if (!scores.length) return null;
  const n = scores.length;
  const W = 100;
  const bw = W / n;
  const start = scores[0].date.getTime();
  const span = n * 3600000;
  const x = (d: Date) => ((d.getTime() - start) / span) * W;
  const active = hover ?? (selected ? scores.findIndex((s) => Math.abs(s.date.getTime() - selected.getTime()) < 1800000) : -1);
  const cur = active >= 0 ? scores[active] : null;
  const w = cur && series ? weatherAt(series, cur.date) : null;
  const pressure = series ? scores.map((s) => weatherAt(series, s.date)?.pressure_msl ?? null) : [];
  const pVals = pressure.filter((p): p is number => p != null);
  const pMin = pVals.length ? Math.min(...pVals) - 2 : 0;
  const pMax = pVals.length ? Math.max(...pVals) + 2 : 1;

  return (
    <div className="hc">
      <div className="hc__readout" aria-live="polite">
        {cur ? (
          <>
            <strong>{dayShort(cur.date)}, {timeHM(cur.date)}</strong>
            <span style={{ color: chanceColor(cur.score) }}> {cur.legal === 'banned' ? 'нельзя' : cur.score}</span>
            {w && (
              <span className="muted">
                {' '}
                {Math.round(w.temp_c)}°, {Math.round(w.pressure_msl)} гПа, ветер {Math.round(w.wind_speed)} м/с
              </span>
            )}
          </>
        ) : (
          <span className="muted">Проведите по графику — шанс по часам</span>
        )}
      </div>
      <svg className="hc__svg" viewBox={`0 0 ${W} 40`} preserveAspectRatio="none" role="img" aria-label="Почасовой шанс клёва" onMouseLeave={() => setHover(null)}>
        {/* night shading */}
        {[...days.values()].map((d, i) => {
          const parts: ReactElement[] = [];
          const x1 = Math.max(0, x(d.sunrise));
          const x2 = Math.min(W, x(d.sunset));
          if (x1 > 0) parts.push(<rect key={`n${i}a`} x={Math.max(0, x1 - 24 * bw)} y="0" width={x1 - Math.max(0, x1 - 24 * bw)} height="32" className="hc__night" />);
          if (x2 < W) parts.push(<rect key={`n${i}b`} x={x2} y="0" width={Math.min(W, x2 + 24 * bw) - x2} height="32" className="hc__night" />);
          return parts;
        })}
        {/* solunar majors */}
        {[...days.values()].flatMap((d, i) =>
          [d.transit, d.underfoot].filter(Boolean).map((t, j) => <rect key={`m${i}${j}`} x={Math.max(0, x(t!) - bw)} y="0" width={2 * bw} height="32" className="hc__major" />),
        )}
        {/* bars */}
        {scores.map((s, i) => {
          const h = s.legal === 'banned' ? 2 : Math.max(2, (s.score / 100) * 30);
          return (
            <rect
              key={i}
              x={i * bw + bw * 0.12}
              y={32 - h}
              width={bw * 0.76}
              height={h}
              rx={0.4}
              style={{ fill: s.legal === 'banned' ? 'var(--wash-strong)' : chanceColor(s.score), opacity: active === i ? 1 : 0.85 }}
              onMouseEnter={() => setHover(i)}
              onClick={() => onSelect?.(s.date)}
            />
          );
        })}
        {/* pressure line */}
        {pVals.length > 1 && (
          <polyline className="hc__pressure" points={pressure.map((p, i) => (p == null ? '' : `${i * bw + bw / 2},${32 - ((p - pMin) / (pMax - pMin)) * 28}`)).filter(Boolean).join(' ')} />
        )}
        {/* ruler */}
        <line x1="0" y1="32.5" x2={W} y2="32.5" className="hc__ruler" />
        {scores.map((s, i) => {
          const hr = omskParts(s.date).hour;
          const major = hr % 6 === 0;
          return <line key={`t${i}`} x1={i * bw + bw / 2} y1="32.5" x2={i * bw + bw / 2} y2={major ? 36.5 : 34.5} className="hc__ruler" />;
        })}
        {scores.map((s, i) => {
          const hr = omskParts(s.date).hour;
          return hr % 6 === 0 ? (
            <text key={`l${i}`} x={i * bw + bw / 2} y="39.5" className="hc__tick" textAnchor="middle">
              {hourH(s.date)}
            </text>
          ) : null;
        })}
        {/* sunrise / sunset */}
        {[...days.values()].map((d, i) => (
          <g key={`s${i}`}>
            {x(d.sunrise) > 0 && x(d.sunrise) < W && <line x1={x(d.sunrise)} y1="0" x2={x(d.sunrise)} y2="32" className="hc__sun" />}
            {x(d.sunset) > 0 && x(d.sunset) < W && <line x1={x(d.sunset)} y1="0" x2={x(d.sunset)} y2="32" className="hc__sun" />}
          </g>
        ))}
        {/* touch overlay */}
        {scores.map((s, i) => (
          <rect key={`h${i}`} x={i * bw} y="0" width={bw} height="40" fill="transparent" onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)} onClick={() => onSelect?.(s.date)} />
        ))}
      </svg>
      <div className="hc__legend">
        <span><i className="hc__key hc__key--night" /> ночь</span>
        <span><i className="hc__key hc__key--major" /> солунар</span>
        <span><i className="hc__key hc__key--sun" /> восход/закат</span>
        {pVals.length > 1 && <span><i className="hc__key hc__key--p" /> давление</span>}
      </div>
    </div>
  );
}
