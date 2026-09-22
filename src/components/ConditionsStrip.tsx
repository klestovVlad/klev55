import { OMSK } from '@/data/weather';
import { useWeatherGrid, nearestSeries } from '@/data/weatherGrid';
import { weatherAt } from '@/model/weather';
import { solunarDay, moonPhaseName } from '@/model/solunar';
import { timeHM, windDirText, weatherWord } from '@/lib/format';
import { ProvenanceBadge } from './Provenance';
import './conditions.css';

/** One line of conditions for the selected time, plus a 72-h pressure sparkline. No tiles, no dashboard. */
export function ConditionsStrip({ date, lat = OMSK.lat, lon = OMSK.lon }: { date: Date; lat?: number; lon?: number }) {
  const wq = useWeatherGrid();
  const series = nearestSeries(wq.data, lat, lon) ?? undefined;
  const w = weatherAt(series ?? null, date);
  const sun = solunarDay(date, lat, lon);
  let spark: string | null = null;
  if (series && w) {
    const i = series.time.findIndex((t) => t * 1000 >= date.getTime() - 1800000);
    const from = Math.max(0, i - 72);
    const vals = series.pressure_msl.slice(from, i + 1);
    if (vals.length > 2) {
      const mn = Math.min(...vals);
      const mx = Math.max(...vals);
      spark = vals.map((v, k) => `${(k / (vals.length - 1)) * 100},${20 - ((v - mn) / Math.max(1, mx - mn)) * 18}`).join(' ');
    }
  }
  const trendArrow = w ? (w.pressure_trend_24h > 3 ? '↑' : w.pressure_trend_24h < -3 ? '↓' : '→') : '';
  return (
    <div className="cond">
      {w ? (
        <p className="cond__line">
          <span>{Math.round(w.temp_c)}°</span>
          <span>{weatherWord(w.weather_code)}</span>
          <span>{Math.round(w.pressure_msl)} гПа {trendArrow}</span>
          <span>ветер {windDirText(w.wind_dir)} {Math.round(w.wind_speed)} м/с</span>
          <span>восход {timeHM(sun.sunrise)}, закат {timeHM(sun.sunset)}</span>
          <span>{moonPhaseName(sun.phase)}</span>
        </p>
      ) : (
        <p className="cond__line muted">
          <span>{wq.isPending ? 'Загружаем прогноз…' : 'Прогноза нет'}</span>
          <span>восход {timeHM(sun.sunrise)}, закат {timeHM(sun.sunset)}</span>
          <span>{moonPhaseName(sun.phase)}</span>
        </p>
      )}
      {spark && (
        <div className="cond__spark" title="Давление за трое суток">
          <svg viewBox="0 0 100 22" preserveAspectRatio="none" aria-label="Давление за 72 часа">
            <polyline points={spark} />
          </svg>
          <span className="caption">давление, 72 ч</span>
        </div>
      )}
      <span className="cond__prov">
        <ProvenanceBadge kind="measured" note={wq.data ? `Open-Meteo, прогноз получен ${timeHM(new Date(wq.data.fetched_at))}` : undefined} />
      </span>
    </div>
  );
}
