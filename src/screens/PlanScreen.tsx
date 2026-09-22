import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '@/app/store';
import { useAllData } from '@/model/useScores';
import { useAdvice, useSpeciesFull } from '@/data/load';
import { chance } from '@/model/bite';
import { weatherAt } from '@/model/weather';
import { nearestSeries } from '@/data/weatherGrid';
import { hydroFor } from '@/model/hydro';
import { bestWindows } from '@/model/outlook';
import { Chip } from '@/components/Chip';
import { ConditionsStrip } from '@/components/ConditionsStrip';
import { ProvenanceBadge } from '@/components/Provenance';
import { chanceColor, chanceWord, dayLong, driveText, timeHM, plural, bySpeciesPriority, BAIT_SPECIES } from '@/lib/format';
import { addHours, omskParts, startOfOmskDay } from '@/lib/time';
import type { MethodName, Season, SpeciesLite as Species, Spot } from '@/data/types';
import './plan.css';
import { GearText } from '@/components/GearText';
import { GearAdvice } from '@/components/GearAdvice';

const METHODS: MethodName[] = ['спиннинг', 'фидер', 'поплавок', 'донка', 'жерлицы', 'мормышка', 'балансир'];
const MINS = [30, 60, 120, 240];
const MIN_LABEL: Record<number, string> = { 30: 'до 30 мин', 60: 'до часа', 120: 'до 2 ч', 240: 'до 4 ч' };

function whenOptions(now: Date): { key: string; label: string; day: Date }[] {
  const d0 = startOfOmskDay(now);
  const out = [
    { key: 'today', label: 'Сегодня', day: d0 },
    { key: 'tomorrow', label: 'Завтра', day: addHours(d0, 24) },
  ];
  const dow = (d: Date) => new Date(d.getTime() + 6 * 3600000).getUTCDay();
  for (let i = 2; i < 8; i++) {
    const d = addHours(d0, 24 * i);
    if (dow(d) === 6) out.push({ key: 'sat', label: 'Суббота', day: d });
    if (dow(d) === 0) out.push({ key: 'sun', label: 'Воскресенье', day: d });
  }
  return out;
}

function seasonOf(date: Date): Season {
  const m = omskParts(date).month;
  if (m === 12 || m <= 3) return 'зима';
  if (m <= 5) return 'весна';
  if (m <= 8) return 'лето';
  return 'осень';
}

interface PlanRow {
  spot: Spot;
  species: Species;
  score: number;
  legal: 'ok' | 'restricted' | 'banned';
  window: { from: Date; to: Date } | null;
}

export function PlanScreen() {
  const d = useAllData();
  const advice = useAdvice();
  const full = useSpeciesFull();
  const nav = useNavigate();
  const set = useStore((s) => s.set);
  const [params, setParams] = useSearchParams();
  const now = new Date();
  const whens = whenOptions(now);

  const sel = (params.get('fish') ?? '').split(',').filter(Boolean);
  const method = (params.get('method') as MethodName | null) ?? null;
  const when = params.get('when') ?? 'today';
  const boat = params.get('boat') === '1';
  const maxMin = Number(params.get('min') ?? 120);
  const update = (p: Record<string, string | null>) => {
    const n = new URLSearchParams(params);
    for (const [k, v] of Object.entries(p)) v == null || v === '' ? n.delete(k) : n.set(k, v);
    setParams(n, { replace: true });
  };
  const [copied, setCopied] = useState(false);

  const day = whens.find((w) => w.key === when)?.day ?? whens[0].day;
  const season = seasonOf(day);
  const species = d.species.data?.items ?? [];
  const pickable = species.filter((s) => s.status.legal !== 'banned' && s.presence !== 'rare' && !BAIT_SPECIES.has(s.id)).sort(bySpeciesPriority);

  const rows = useMemo<PlanRow[]>(() => {
    if (!d.spots.data || !species.length) return [];
    const byId = new Map(species.map((s) => [s.id, s]));
    const out: PlanRow[] = [];
    for (const spot of d.spots.data.items) {
      const series = nearestSeries(d.weather.data, spot.coords[1], spot.coords[0]);
      if ((spot.drive_min ?? ((spot.distance_km * 1.3) / 70) * 60) > maxMin) continue;
      if (boat && !spot.access.boat) continue;
      let cands = spot.species.filter((s) => byId.has(s.id));
      if (sel.length) cands = cands.filter((s) => sel.includes(s.id));
      if (method) cands = cands.filter((s) => s.methods.includes(method));
      if (!cands.length) continue;
      const hydro = hydroFor(spot, d.gauges.data?.items, d.gauges.data?.ice, d.zones.data, day);
      let best: PlanRow | null = null;
      for (const c of cands.slice(0, 4)) {
        const sp = byId.get(c.id)!;
        const hs = [];
        for (let h = 4; h <= 22; h++) {
          const date = addHours(day, h);
          const r = chance({ spot, species: sp, date, weather: weatherAt(series, date), hydro, rules: d.rules.data ?? null });
          hs.push({ date, score: r.score, legal: r.legal });
        }
        const max = hs.reduce((a, b) => (b.score > a.score ? b : a), hs[0]);
        const win = bestWindows(hs, 1)[0] ?? null;
        const legal = hs.every((h) => h.legal === 'banned') ? 'banned' : hs.some((h) => h.legal === 'restricted') ? 'restricted' : 'ok';
        if (!best || max.score > best.score) best = { spot, species: sp, score: max.score, legal, window: win ? { from: win.from, to: addHours(win.to, 1) } : null };
      }
      if (best) out.push(best);
    }
    return out.sort((a, b) => b.score - a.score || (a.spot.drive_min ?? 999) - (b.spot.drive_min ?? 999));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.spots.data, species, d.weather.data, d.gauges.data, d.zones.data, d.rules.data, sel.join(','), method, day.getTime(), boat, maxMin]);

  const top = rows[0];
  const topFull = top ? full.data?.items.find((s) => s.id === top.species.id) : undefined;
  const topIce = top ? hydroFor(top.spot, d.gauges.data?.items, d.gauges.data?.ice, d.zones.data, day).ice_on : false;
  const checklists = (advice.data?.checklists ?? []).filter((c) => (c.method === 'любой' || c.method === method || (!method && top && top.spot.species.find((s) => s.id === top.species.id)?.methods.includes(c.method as MethodName))) && (c.season === 'любой' || c.season === season)).slice(0, 3);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="screen">
      <div className="screen__inner">
        <h1 className="screen__title">Куда ехать</h1>
        <p className="screen__lead">Выберите рыбу и день — получите места по шансу, лучшие часы и что взять.</p>

        <div className="plan__q">
          <h3>Рыба</h3>
          <div className="chip-row plan__wrap">
            <Chip selected={!sel.length} onClick={() => update({ fish: null })}>Любая</Chip>
            {pickable.map((s) => (
              <Chip key={s.id} selected={sel.includes(s.id)} onClick={() => update({ fish: (sel.includes(s.id) ? sel.filter((x) => x !== s.id) : [...sel, s.id]).join(',') })}>{s.names.ru}</Chip>
            ))}
          </div>
          <h3>Когда</h3>
          <div className="chip-row">
            {whens.map((w) => (
              <Chip key={w.key} selected={when === w.key} onClick={() => update({ when: w.key })}>{w.label}</Chip>
            ))}
          </div>
          <h3>Способ</h3>
          <div className="chip-row">
            <Chip selected={!method} onClick={() => update({ method: null })}>Любой</Chip>
            {METHODS.map((m) => (
              <Chip key={m} selected={method === m} onClick={() => update({ method: method === m ? null : m })}>{m}</Chip>
            ))}
          </div>
          <h3>Дорога и лодка</h3>
          <div className="chip-row">
            {MINS.map((k) => (
              <Chip key={k} selected={maxMin === k} onClick={() => update({ min: String(k) })}>{MIN_LABEL[k]}</Chip>
            ))}
            <Chip selected={boat} onClick={() => update({ boat: boat ? null : '1' })}>С лодки</Chip>
          </div>
        </div>

        <div className="section">
          <p className="plan__verdict">
            {top
              ? `${dayLong(day)}: ${top.species.names.ru.toLowerCase()} — ${chanceWord(top.score)} (${top.score}), ${top.spot.name}${top.window ? `, лучше ${timeHM(top.window.from)}–${timeHM(top.window.to)}` : ''}.`
              : d.ready
                ? 'Под эти условия мест нет. Уберите способ или дайте больше времени на дорогу.'
                : 'Загружаем…'}
          </p>
          <ConditionsStrip date={addHours(day, 9)} />
        </div>

        <ol className="plan__list">
          {rows.slice(0, 8).map((r, i) => (
            <li key={r.spot.id}>
              <button type="button" className="plan__row" onClick={() => { set({ spotId: r.spot.id, waterId: null, speciesId: sel.length === 1 ? sel[0] : null }); nav('/'); }}>
                <span className={`score${r.legal === 'banned' ? ' score--banned' : ''}`} style={{ background: r.legal === 'banned' ? undefined : chanceColor(r.score) }}>{r.legal === 'banned' ? 'нельзя' : r.score}</span>
                <span className="plan__main">
                  <span className="row-btn__title">{i + 1}. {r.spot.name}</span>
                  <span className="row-btn__meta">
                    <span>{r.spot.water_name}</span>
                    <span>{r.species.names.ru.toLowerCase()}</span>
                    {r.spot.drive_min != null && <span>{driveText(r.spot.drive_min)}</span>}
                    {r.window && <span>лучше {timeHM(r.window.from)}–{timeHM(r.window.to)}</span>}
                    {r.legal === 'restricted' && <span style={{ color: 'var(--amber)' }}>с берега, 1 удочка</span>}
                    {r.spot.type === 'платник' && <span>платно</span>}
                  </span>
                </span>
                <span className="muted" aria-hidden="true">›</span>
              </button>
            </li>
          ))}
        </ol>
        {rows.length > 8 && <p className="caption">Ещё {rows.length - 8} {plural(rows.length - 8, 'место', 'места', 'мест')} на карте с теми же фильтрами.</p>}

        {(checklists.length > 0 || topFull) && (
          <div className="section">
            <h2>Что взять</h2>
            {top && topFull && (
              <GearAdvice species={topFull} date={addHours(day, 9)} ice={topIce} spotMethods={top.spot.species.find((s) => s.id === top.species.id)?.methods} title={`На ${topFull.names.ru.toLowerCase()}, ${top.spot.name}`} />
            )}
            {checklists.map((c) => (
              <details key={c.id} className="method">
                <summary><strong>{c.title}</strong></summary>
                <ul>{c.items.map((it) => <li key={it}><GearText text={it} /></li>)}</ul>
              </details>
            ))}
          </div>
        )}

        <p className="caption">
          <ProvenanceBadge kind="generated" note="Ранжирование — эвристика по сезону, часу, солунару, прогнозу и месту. Не гарантия." />{' '}
          <button type="button" className="btn btn--ghost btn--small" onClick={share}>{copied ? 'Ссылка скопирована' : 'Поделиться ссылкой'}</button>
        </p>
      </div>
    </div>
  );
}
