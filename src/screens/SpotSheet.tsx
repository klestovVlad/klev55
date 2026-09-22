import { useMemo, useState } from 'react';
import type { Species } from '@/data/types';
import * as Tabs from '@radix-ui/react-tabs';
import { Link } from 'react-router-dom';
import { useStore, scrubberDate } from '@/app/store';
import { useAllData } from '@/model/useScores';
import { useSpeciesFull } from '@/data/load';
import { nearestSeries } from '@/data/weatherGrid';
import { chance } from '@/model/bite';
import { weatherAt } from '@/model/weather';
import { hydroFor } from '@/model/hydro';
import { hourly, dailyOutlook } from '@/model/outlook';
import { Verdict } from '@/components/Verdict';
import { HourChart } from '@/components/HourChart';
import { RulesToday } from '@/components/RulesToday';
import { ConditionsStrip } from '@/components/ConditionsStrip';
import { ProvenanceBadge } from '@/components/Provenance';
import { chanceColor, dayShort, driveText, MONTHS_SHORT, timeHM } from '@/lib/format';
import { startOfOmskDay, addHours } from '@/lib/time';
import './spotsheet.css';
import { GearText, GearList } from '@/components/GearText';

export function SpotSheet({ spotId, onBack }: { spotId: string; onBack: () => void }) {
  const d = useAllData();
  const full = useSpeciesFull();
  const { speciesId, hoursAhead } = useStore();
  const set = useStore((s) => s.set);
  const spot = d.spots.data?.items.find((s) => s.id === spotId);
  const [pick, setPick] = useState<string | null>(null);
  const date = scrubberDate(hoursAhead);

  // Prefer full records (methods, lifehacks); fall back to the light index until they arrive.
  const byId = useMemo(() => new Map<string, Species>((((full.data?.items ?? d.species.data?.items) ?? []) as Species[]).map((s) => [s.id, s])), [full.data, d.species.data]);
  if (!spot) return <p className="empty">Место не найдено.</p>;
  const series = nearestSeries(d.weather.data, spot.coords[1], spot.coords[0]);

  const hydro = hydroFor(spot, d.gauges.data?.items, d.gauges.data?.ice, d.zones.data, date);
  const w = weatherAt(series, date);
  const listed = spot.species.map((s) => byId.get(s.id)).filter((x): x is NonNullable<typeof x> => !!x);
  const ranked = listed
    .map((sp) => ({ sp, r: chance({ spot, species: sp, date, weather: w, hydro, rules: d.rules.data ?? null }) }))
    .sort((a, b) => b.r.score - a.r.score);
  const chosenId = pick ?? (speciesId && byId.has(speciesId) ? speciesId : ranked[0]?.sp.id);
  const chosen = chosenId ? byId.get(chosenId) : undefined;
  const chosenR = chosen ? (ranked.find((x) => x.sp.id === chosen.id)?.r ?? chance({ spot, species: chosen, date, weather: w, hydro, rules: d.rules.data ?? null })) : null;
  const spotSp = chosen ? spot.species.find((s) => s.id === chosen.id) : undefined;

  const ctx = chosen ? { spot, species: chosen, series, hydro, rules: d.rules.data ?? null } : null;
  const day0 = startOfOmskDay(date);
  const hours = ctx ? hourly(ctx, day0, 48) : [];
  const outlook = ctx ? dailyOutlook(ctx, new Date(), 7) : [];

  return (
    <div className="ss">
      <button type="button" className="ss__back" onClick={onBack}>‹ Все места</button>
      <h1 className="ss__title">{spot.name}</h1>
      <div className="ss__meta">
        <span>{spot.water_name}</span>
        <span>{spot.type}</span>
        {spot.drive_min != null && <span>{driveText(spot.drive_min)} на машине</span>}
        <span>{spot.distance_km} км</span>
        <span title="Подтверждённость: сколько независимых источников описывают это место">достоверность {spot.confidence}/3</span>
      </div>

      {chosen && chosenR && (
        <Verdict result={chosenR} speciesName={chosen.names.ru} subtitle={hoursAhead === 0 ? 'сейчас' : `${dayShort(date)}, ${timeHM(date)}`} />
      )}

      <div className="ss__species chip-row" role="tablist" aria-label="Рыба на этом месте">
        {ranked.map(({ sp, r }) => (
          <button key={sp.id} type="button" role="tab" aria-selected={sp.id === chosenId} className={`ss__sp${sp.id === chosenId ? ' ss__sp--on' : ''}`} onClick={() => setPick(sp.id)}>
            <span className="ss__sp-name">{sp.names.ru}</span>
            <span className="ss__sp-score" style={{ color: r.legal === 'banned' ? 'var(--muted)' : chanceColor(r.score) }}>{r.legal === 'banned' ? '—' : r.score}</span>
          </button>
        ))}
      </div>

      <Tabs.Root defaultValue="how" className="tabs">
        <Tabs.List className="tabs__list" aria-label="Разделы места">
          <Tabs.Trigger value="how" className="tabs__tab">Как ловить</Tabs.Trigger>
          <Tabs.Trigger value="tips" className="tabs__tab">Советы</Tabs.Trigger>
          <Tabs.Trigger value="rules" className="tabs__tab">Правила сегодня</Tabs.Trigger>
          <Tabs.Trigger value="water" className="tabs__tab">Вода и погода</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="how" className="tabs__panel">
          {chosen && ctx && (
            <>
              <h3>Когда клюёт {chosen.names.ru.toLowerCase()}: {dayShort(day0)} и {dayShort(addHours(day0, 24))}</h3>
              <HourChart scores={hours} lat={spot.coords[1]} lon={spot.coords[0]} series={series} selected={date} onSelect={(dd) => set({ hoursAhead: Math.max(0, Math.round((dd.getTime() - Date.now()) / 3600000)) })} />
              <ol className="outlook" aria-label="Прогноз на неделю">
                {outlook.map((o) => (
                  <li key={o.date.toISOString()}>
                    <span className="outlook__day">{dayShort(o.date)}</span>
                    <span className="outlook__bar"><i style={{ width: `${o.score}%`, background: o.legal === 'banned' ? 'var(--wash-strong)' : chanceColor(o.score) }} /></span>
                    <span className="outlook__val" style={{ color: chanceColor(o.score) }}>{o.legal === 'banned' ? 'нельзя' : o.score}</span>
                    <span className="outlook__win muted">{o.best ? `${timeHM(o.best.from)}–${timeHM(addHours(o.best.to, 1))}` : ''}</span>
                  </li>
                ))}
              </ol>
            </>
          )}
          {spotSp && (
            <p>
              <strong>{chosen?.names.ru} здесь:</strong> <GearText text={spotSp.note} /> <span className="muted">Способы: {spotSp.methods.join(', ')}; сезоны: {spotSp.seasons.join(', ')}.</span>
            </p>
          )}
          {chosen && (chosen.methods?.length ?? 0) > 0 && (
            <div className="section">
              <h3>Снасти и приманки</h3>
              {chosen.methods
                .filter((m) => !spotSp || spotSp.methods.includes(m.name) || spotSp.methods.length === 0)
                .slice(0, 3)
                .map((m) => (
                  <details key={m.name} className="method">
                    <summary>
                      <strong>{m.name}</strong> <span className="muted">{m.seasons.join(', ')}</span>
                    </summary>
                    <p><GearText text={m.technique} /></p>
                    <dl className="kv">
                      {m.baits.length > 0 && (<><dt>Наживка</dt><dd><GearList items={m.baits} /></dd></>)}
                      {m.lures.length > 0 && (<><dt>Приманки</dt><dd><GearList items={m.lures} /></dd></>)}
                      <dt>Оснастка</dt><dd><GearText text={m.rig} /></dd>
                      <dt>Снасть</dt><dd><GearText text={m.gear} /></dd>
                    </dl>
                  </details>
                ))}
              <p className="caption"><Link to={`/species/${chosen.id}`}>Всё про {chosen.names.ru.toLowerCase()} →</Link></p>
            </div>
          )}
          <p className="caption">Лучшие месяцы здесь: {spot.best_months.map((m) => MONTHS_SHORT[m - 1]).join(', ')}. {spot.best_hours_note} <ProvenanceBadge kind="generated" /></p>
        </Tabs.Content>

        <Tabs.Content value="tips" className="tabs__panel">
          <p>{spot.notes}</p>
          <p><strong>Глубина.</strong> {spot.depth_note}</p>
          <p><strong>Подъезд.</strong> {spot.access.car} {spot.access.foot ? 'Пешком по берегу можно.' : ''} {spot.access.boat ? 'С лодки удобно.' : 'Лодка не нужна.'} Зимой: {spot.access.winter}</p>
          {spot.features.length > 0 && <p className="inline-list">{spot.features.map((f) => <span key={f} className="tag">{f}</span>)}</p>}
          {spot.paid && (
            <div className="callout">
              <p><strong>Платно.</strong> {spot.paid.price_note} {spot.paid.contact_hint}</p>
              <p className="caption">Зарыбляют: {spot.paid.stocked_species.join(', ')}.</p>
            </div>
          )}
          <h3>Лайфхаки</h3>
          <ul>
            {spot.lifehacks.map((l) => <li key={l}><GearText text={l} /></li>)}
          </ul>
          {chosen && (chosen.lifehacks?.length ?? 0) > 0 && (
            <>
              <h3>Про {chosen.names.ru.toLowerCase()} вообще</h3>
              <ul>{chosen.lifehacks.slice(0, 3).map((l) => <li key={l}><GearText text={l} /></li>)}</ul>
            </>
          )}
          <p className="caption">
            <ProvenanceBadge kind="generated" note={spot.corroborated_by.length ? `Подтверждено источниками: ${spot.corroborated_by.join(', ')} (агрегировано, без копирования).` : 'Единичный источник или экспертная оценка.'} />{' '}
            {spot.corroborated_by.length ? `по отчётам, ${spot.corroborated_by.length} ${spot.corroborated_by.length === 1 ? 'источник' : spot.corroborated_by.length < 5 ? 'источника' : 'источников'}` : 'экспертная оценка'}
          </p>
        </Tabs.Content>

        <Tabs.Content value="rules" className="tabs__panel">
          <RulesToday rules={d.rules.data} spot={spot} date={date} speciesList={listed} hydro={hydro} />
        </Tabs.Content>

        <Tabs.Content value="water" className="tabs__panel">
          <ConditionsStrip date={date} lat={spot.coords[1]} lon={spot.coords[0]} />
          <h3>Лёд</h3>
          {(() => {
            const kind = ['озеро', 'пруд', 'водохранилище', 'платник'].includes(spot.type) ? 'lake' : 'river';
            const est = d.gauges.data?.ice.find((i) => i.kind === kind && (kind === 'lake' || (spot.coords[1] < 54.5 ? i.station === 'cherlak' : i.station === 'omsk'))) ?? d.gauges.data?.ice.find((i) => i.kind === kind);
            if (!est) return <p className="muted">Нет данных.</p>;
            const th = d.gauges.data?.thresholds_cm;
            return (
              <>
                <p>{est.note} <ProvenanceBadge kind="generated" note="Расчёт по сумме отрицательных температур (формула Стефана), не измерение." /></p>
                {est.thickness_cm != null && th && (
                  <p className="caption">Пороги МЧС: {th.person} см один человек, {th.ice_fishing_gims} см зимняя рыбалка, {th.group_crossing} см группа, {th.car} см автомобиль.</p>
                )}
              </>
            );
          })()}
          <h3>Уровень воды</h3>
          {hydro.gauge_name ? (
            (() => {
              const g = d.gauges.data?.items.find((x) => x.name === hydro.gauge_name);
              const stale = g?.measured_at ? Date.now() - Date.parse(g.measured_at) > 48 * 3600000 : true;
              return (
                <p>
                  Гидропост {hydro.gauge_name}, {hydro.gauge_km} км отсюда: {g?.level_cm != null ? `${g.level_cm} см над нулём поста` : 'нет данных'}.
                  {stale && g?.measured_at && <span className="muted"> Данные устарели: измерение от {g.measured_at.slice(0, 10).split('-').reverse().join('.')}. Живых открытых данных по Иртышу сейчас нет.</span>}{' '}
                  <ProvenanceBadge kind="measured" note="allrivers.info по данным Центра регистра и кадастра; обновление прекратилось в 2024." />
                </p>
              );
            })()
          ) : (
            <p className="muted">Для озёр и прудов гидропостов нет.</p>
          )}
          {w?.weather_code != null && w.weather_code >= 95 && <div className="callout callout--ban"><p>Гроза в прогнозе. Удилище на берегу — громоотвод: переждите в машине.</p></div>}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
