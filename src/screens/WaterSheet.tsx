/**
 * «Точка на воде»: the sheet for a tapped water body or a dropped pin. Everything shown is
 * labelled by where it came from: weather and rules are exact for the point, species come from the
 * class of water / neighbours / observations, and the chance is a range from neighbours of the same
 * class — or absent, with the reason.
 */
import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Link } from 'react-router-dom';
import { useStore, scrubberDate } from '@/app/store';
import { useAllData } from '@/model/useScores';
import { useWater } from '@/data/load';
import { useHere } from '@/model/useHere';
import { usePins, pinAt } from '@/data/pins';
import { GearAdvice } from '@/components/GearAdvice';
import { BoxCatch } from '@/components/BoxCatch';
import { RulesToday } from '@/components/RulesToday';
import { ConditionsStrip } from '@/components/ConditionsStrip';
import { ProvenanceBadge } from '@/components/Provenance';
import { FactorChip } from '@/components/Verdict';
import { chanceColor, chanceWord, dayShort, driveText, plural, timeHM } from '@/lib/format';
import './spotsheet.css';
import './heresheet.css';

const TYPE_RU: Record<string, string> = { river: 'река', stream: 'ручей', canal: 'канал', lake: 'озеро', pond: 'пруд', reservoir: 'водохранилище', oxbow: 'старица', riverbank: 'русло', wetland: 'болото' };
const CLASS_RU = { river: 'река или протока', lake: 'озеро, пруд или старица', unknown: 'вода не определена' } as const;

export function WaterSheet({ waterId, pin, onBack }: { waterId: number | null; pin: [number, number] | null; onBack: () => void }) {
  const d = useAllData();
  const { hoursAhead, speciesId } = useStore();
  const set = useStore((s) => s.set);
  const pins = usePins((s) => s.pins);
  const addPin = usePins((s) => s.add);
  const removePin = usePins((s) => s.remove);
  const date = scrubberDate(hoursAhead);
  const [pick, setPick] = useState<string | null>(null);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');

  // The point: the tap itself, else the water body's centroid (search / list).
  const centroid = useCentroid(waterId);
  const coords = pin ?? centroid;
  const here = useHere(coords, waterId, date);

  if (!coords) return <p className="empty">{waterId != null ? 'Загружаем водоём…' : 'Точка не выбрана.'}</p>;
  if (!here) return <p className="empty">Загружаем…</p>;
  const { water, cls, spot, nb, species } = here;
  const title = water?.name || (water ? `${TYPE_RU[water.type] ?? 'вода'} без названия` : 'Точка на карте');
  const saved = pinAt(pins, coords[0], coords[1]);
  const kz = water?.jurisdiction === 'kz';
  const chosenId = pick && species.some((s) => s.species.id === pick) ? pick : speciesId && species.some((s) => s.species.id === speciesId) ? speciesId : species[0]?.species.id;
  const chosen = species.find((s) => s.species.id === chosenId);
  const withRange = species.filter((s) => s.range);
  const top = withRange[0];
  const nbKm = nb.length ? Math.round(nb[nb.length - 1].km) : 0;

  const verdict = kz
    ? 'Это Казахстан: правила Республики Казахстан в приложение не включены, оценок для этой воды нет.'
    : water?.salt
      ? 'Солёное озеро: рыбы здесь нет.'
      : top && top.range && top.range.result.legal !== 'banned'
        ? `${top.species.names.ru} ${hoursAhead === 0 ? 'сейчас' : `${dayShort(date)} в ${timeHM(date)}`}: примерно ${top.range.lo}–${top.range.hi}, ${chanceWord(Math.round((top.range.lo + top.range.hi) / 2))}${top.window ? `, лучше ${timeHM(top.window.from)}–${timeHM(top.window.to)}` : ''}.`
        : species.length
          ? `Оценки шанса нет: в ${here.nb.length ? 'этих' : '30'} км нет описанных мест на такой же воде. Кто здесь водится — по типу воды${here.obsTotal ? ' и наблюдениям' : ''}.`
          : here.ready
            ? 'Про эту воду мы ничего не знаем: ни описанных мест рядом, ни наблюдений.'
            : 'Загружаем…';

  const onSave = () => {
    if (!naming) {
      setName(water?.name ? `${water.name}, ${TYPE_RU[water.type] === 'река' ? 'берег' : 'точка'}` : 'Моё место');
      setNaming(true);
      return;
    }
    addPin({ name: name.trim() || 'Моё место', lon: coords[0], lat: coords[1], waterId });
    setNaming(false);
  };

  return (
    <div className="ss here">
      <button type="button" className="ss__back" onClick={onBack}>‹ Все места</button>
      <h1 className="ss__title">{saved ? saved.name : title}</h1>
      <div className="ss__meta">
        {saved && <span className="here__mine">моё место{water?.name ? `, ${water.name}` : ''}</span>}
        <span>{water ? (TYPE_RU[water.type] ?? water.type) : CLASS_RU[cls]}</span>
        {water?.area_km2 ? <span>{water.area_km2} км²</span> : null}
        {water?.length_km && !['river', 'riverbank'].includes(water.type) ? <span>{water.length_km} км</span> : null}
        <span>{spot.distance_km} км от Омска</span>
        <span>≈ {driveText(here.driveMin)} на машине</span>
        {kz && <span style={{ color: 'var(--ban)' }}>другая юрисдикция</span>}
      </div>

      <p className="here__verdict">{verdict}</p>

      {!kz && !water?.salt && species.length > 0 && (
        <div className="ss__species chip-row" role="tablist" aria-label="Кто здесь водится">
          {species.map((s) => {
            const r = s.range;
            const banned = r?.result.legal === 'banned' || s.species.status.legal === 'banned';
            return (
              <button key={s.species.id} type="button" role="tab" aria-selected={s.species.id === chosenId} className={`ss__sp${s.species.id === chosenId ? ' ss__sp--on' : ''}`} onClick={() => setPick(s.species.id)}>
                <span className="ss__sp-name">{s.species.names.ru}</span>
                <span className="ss__sp-score" style={{ color: banned ? 'var(--muted)' : r ? chanceColor(Math.round((r.lo + r.hi) / 2)) : 'var(--muted)' }}>{banned ? '—' : r ? `≈${r.lo}–${r.hi}` : '·'}</span>
              </button>
            );
          })}
        </div>
      )}

      {!kz && (
        <Tabs.Root defaultValue="take" className="tabs">
          <Tabs.List className="tabs__list" aria-label="Разделы точки">
            <Tabs.Trigger value="take" className="tabs__tab">Что брать</Tabs.Trigger>
            <Tabs.Trigger value="rules" className="tabs__tab">Правила сегодня</Tabs.Trigger>
            <Tabs.Trigger value="water" className="tabs__tab">Вода и погода</Tabs.Trigger>
            <Tabs.Trigger value="near" className="tabs__tab">Рядом</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="take" className="tabs__panel">
            <BoxCatch
              date={date}
              ice={here.hydro.ice_on}
              onPick={setPick}
              entries={species.map((s) => ({ species: s.species, score: s.range ? Math.round((s.range.lo + s.range.hi) / 2) : null, scoreText: s.range ? `≈${s.range.lo}–${s.range.hi}` : '·', banned: s.species.status.legal === 'banned' || s.range?.result.legal === 'banned', spotMethods: spot.species.find((x) => x.id === s.species.id)?.methods }))}
            />
            {chosen ? (
              <>
                {chosen.range && chosen.range.result.legal !== 'banned' && (
                  <>
                    <p>
                      <strong>{chosen.species.names.ru}</strong>: примерно {chosen.range.lo}–{chosen.range.hi}
                      {chosen.window && <span className="muted">, лучшие часы {timeHM(chosen.window.from)}–{timeHM(chosen.window.to)}</span>}.
                    </p>
                    <div className="verdict__factors">
                      {chosen.range.result.factors.slice(0, 3).map((f) => <FactorChip key={f.name} f={f} />)}
                    </div>
                  </>
                )}
                {chosen.species.status.legal === 'banned' && (
                  <div className="callout callout--ban"><p><strong>{chosen.species.names.ru}: вылов запрещён.</strong> Здесь отмечен по наблюдениям. Попалась — отпустить сразу.</p></div>
                )}
                <p className="caption">
                  Откуда:{' '}
                  {[
                    chosen.via.includes('места рядом') ? `${nb.length} ${plural(nb.length, 'описанное место', 'описанных места', 'описанных мест')} рядом, до ${nbKm} км` : null,
                    chosen.obs ? `${chosen.obs} ${plural(chosen.obs, 'научная запись', 'научные записи', 'научных записей')} в 20 км` : null,
                    chosen.via.includes('тип воды') ? 'тип воды' : null,
                  ].filter(Boolean).join('; ')}.
                </p>
                {chosen.species.status.legal !== 'banned' && (
                  <GearAdvice species={chosen.species} date={date} ice={here.hydro.ice_on} spotMethods={spot.species.find((s) => s.id === chosen.species.id)?.methods} />
                )}
                <p className="caption"><Link to={`/species/${chosen.species.id}`}>{chosen.species.names.ru}: карточка вида →</Link></p>
              </>
            ) : (
              <p className="muted">{here.ready ? 'Нечего советовать: мы не знаем, кто здесь водится. Ткните в другое место или в известный водоём.' : 'Загружаем…'}</p>
            )}
            <p className="caption">
              <ProvenanceBadge kind="generated" note={`Шанс для точки — интерполяция по описанным местам того же класса воды в 30 км, поэтому показан диапазон, а не число. Погода — ближайшая ячейка сетки прогноза (${here.weatherKm ?? '?'} км). Правила — по классу воды и координате.`} />{' '}
              диапазон, а не число: у точки нет описания, только соседи
            </p>
          </Tabs.Content>

          <Tabs.Content value="rules" className="tabs__panel">
            {cls === 'unknown' && (
              <div className="callout callout--restricted"><p><strong>Тип воды не определён</strong>: точка не на известном водоёме. Ниже правила для озёр; на реках и протоках нерестовый запрет с 20 апреля по 20 мая.</p></div>
            )}
            <RulesToday rules={d.rules.data} spot={spot} date={date} speciesList={species.map((s) => s.species)} hydro={here.hydro} />
          </Tabs.Content>

          <Tabs.Content value="water" className="tabs__panel">
            <ConditionsStrip date={date} lat={coords[1]} lon={coords[0]} />
            <p className="caption">Прогноз для ячейки в {here.weatherKm ?? '?'} км от точки.</p>
            <h3>Лёд</h3>
            {(() => {
              const kind = cls === 'river' ? 'river' : 'lake';
              const est = d.gauges.data?.ice.find((i) => i.kind === kind && (kind === 'lake' || (coords[1] < 54.5 ? i.station === 'cherlak' : i.station === 'omsk'))) ?? d.gauges.data?.ice.find((i) => i.kind === kind);
              if (!est) return <p className="muted">Нет данных.</p>;
              return <p>{est.note} <ProvenanceBadge kind="generated" note="Расчёт по сумме отрицательных температур (формула Стефана), не измерение." /></p>;
            })()}
            {here.hydro.gauge_name && here.hydro.gauge_km != null && here.hydro.gauge_km <= 60 && (
              <p className="caption">Ближайший гидропост {here.hydro.gauge_name}, {here.hydro.gauge_km} км. Живых данных по уровню сейчас нет.</p>
            )}
            {here.weather?.weather_code != null && here.weather.weather_code >= 95 && <div className="callout callout--ban"><p>Гроза в прогнозе. Удилище на берегу — громоотвод: переждите в машине.</p></div>}
          </Tabs.Content>

          <Tabs.Content value="near" className="tabs__panel">
            {nb.length > 0 && (
              <>
                <h3>Та же вода, по ним считали</h3>
                <ul className="rows">
                  {nb.map((n) => (
                    <li key={n.spot.id}>
                      <button type="button" className="row-btn" onClick={() => set({ spotId: n.spot.id, waterId: null, pin: null })}>
                        <span className="row-btn__main">
                          <span className="row-btn__title">{n.spot.name}</span>
                          <span className="row-btn__meta"><span>{n.spot.water_name}</span><span>{n.km < 1 ? 'меньше км' : `${Math.round(n.km)} км`}</span><span>{n.spot.type}</span></span>
                        </span>
                        <span className="muted" aria-hidden="true">›</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <h3>Ближайшие описанные места</h3>
            <ul className="rows">
              {here.nearest.map((n) => (
                <li key={n.spot.id}>
                  <button type="button" className="row-btn" onClick={() => set({ spotId: n.spot.id, waterId: null, pin: null })}>
                    <span className="row-btn__main">
                      <span className="row-btn__title">{n.spot.name}</span>
                      <span className="row-btn__meta"><span>{n.spot.water_name}</span><span>{Math.round(n.km)} км</span>{n.spot.drive_min != null && <span>{driveText(n.spot.drive_min)} от Омска</span>}</span>
                    </span>
                    <span className="muted" aria-hidden="true">›</span>
                  </button>
                </li>
              ))}
            </ul>
          </Tabs.Content>
        </Tabs.Root>
      )}

      {!kz && (
        <div className="here__save">
          {saved ? (
            <button type="button" className="btn btn--ghost btn--small" onClick={() => removePin(saved.id)}>Убрать из моих мест</button>
          ) : naming ? (
            <form className="here__form" onSubmit={(e) => { e.preventDefault(); onSave(); }}>
              <input className="here__input" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onSave(); } }} maxLength={60} aria-label="Название места" autoFocus />
              <button type="submit" className="btn btn--small">Сохранить</button>
              <button type="button" className="btn btn--ghost btn--small" onClick={() => setNaming(false)}>Отмена</button>
            </form>
          ) : (
            <button type="button" className="btn btn--ghost btn--small" onClick={onSave}>Сохранить как моё место</button>
          )}
          <p className="caption">Мои места хранятся только на этом устройстве.</p>
        </div>
      )}
    </div>
  );
}

/** Centroid of a water body from water.json (for sheets opened from search without a tap). */
function useCentroid(waterId: number | null): [number, number] | null {
  const water = useWater(waterId != null);
  const f = waterId != null ? water.data?.features.find((x) => x.properties?.osm_id === waterId) : undefined;
  const c = f?.properties?.centroid as [number, number] | undefined;
  return c ?? null;
}
