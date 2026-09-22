import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStore, scrubberDate } from '@/app/store';
import { useAllData } from '@/model/useScores';
import { useSpeciesFull } from '@/data/load';
import { nearestSeries } from '@/data/weatherGrid';
import { chance } from '@/model/bite';
import { weatherAt } from '@/model/weather';
import { hydroFor } from '@/model/hydro';
import { hourly } from '@/model/outlook';
import { MonthBar } from '@/components/MonthBar';
import { HourChart } from '@/components/HourChart';
import { ProvenanceBadge } from '@/components/Provenance';
import { Chip } from '@/components/Chip';
import { chanceColor, MONTHS_NOM, mmddRu, dayShort, driveText, BAIT_SPECIES } from '@/lib/format';
import { omskParts, startOfOmskDay } from '@/lib/time';
import type { Species } from '@/data/types';
import './species.css';
import './gear.css';
import { GearText, GearList } from '@/components/GearText';

const PRESENCE: Record<string, string> = { common: 'обычна', local: 'местами', rare: 'редко', stocked: 'только зарыбление' };
const BAIT = new Set([...BAIT_SPECIES, 'gymnocephalus-cernua', 'blicca-bjoerkna', 'scardinius-erythrophthalmus']);
const RISK: Record<string, string> = { high: 'высокий', medium: 'средний', low: 'низкий', none: 'нет' };
const GROUPS = [
  { key: 'predator', title: 'Хищник', ids: ['esox-lucius', 'sander-lucioperca', 'perca-fluviatilis', 'lota-lota', 'gymnocephalus-cernua', 'perccottus-glenii', 'oncorhynchus-mykiss'] },
  { key: 'white', title: 'Белая рыба', ids: ['leuciscus-idus', 'abramis-brama', 'rutilus-rutilus', 'leuciscus-leuciscus', 'blicca-bjoerkna', 'alburnus-alburnus', 'leucaspius-delineatus', 'gobio-gobio', 'phoxinus-phoxinus', 'scardinius-erythrophthalmus'] },
  { key: 'carp', title: 'Карась, сазан и зарыбляемые', ids: ['carassius-gibelio', 'carassius-carassius', 'cyprinus-carpio', 'tinca-tinca', 'ctenopharyngodon-idella', 'hypophthalmichthys-molitrix'] },
  { key: 'sig', title: 'Сиговые и осетровые', ids: ['coregonus-peled', 'coregonus-muksun', 'stenodus-leucichthys', 'acipenser-ruthenus', 'acipenser-baerii'] },
];

function Photo({ s, small }: { s: Species; small?: boolean }) {
  const base = import.meta.env.BASE_URL;
  if (!s.photo) return <div className={`sp-photo sp-photo--empty${small ? ' sp-photo--small' : ''}`} aria-label="Фото нет" />;
  const url = s.photo.url.startsWith('http') ? s.photo.url : base + s.photo.url;
  return <img className={`sp-photo${small ? ' sp-photo--small' : ''}`} src={url} alt={`${s.names.ru} — фото`} loading="lazy" />;
}

export function SpeciesListScreen() {
  const full = useSpeciesFull();
  const nav = useNavigate();
  const [month, setMonth] = useState<number | null>(null);
  const items = full.data?.items ?? [];
  const nowMonth = omskParts(new Date()).month;
  const byId = new Map(items.map((s) => [s.id, s]));
  const peaks = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) =>
      items
        .filter((s) => s.status.legal !== 'banned' && !BAIT.has(s.id) && s.presence !== 'rare' && s.presence !== 'stocked')
        .map((s) => ({ s, a: s.activity_by_month[i] }))
        .sort((a, b) => b.a - a.a)
        .slice(0, 4),
    );
  }, [items]);
  return (
    <div className="screen">
      <div className="screen__inner">
        <div className="seg" role="tablist" aria-label="Справочник">
          <Link to="/species" role="tab" aria-selected className="seg__item seg__item--on">Рыбы</Link>
          <Link to="/gear" role="tab" aria-selected={false} className="seg__item">Снасти</Link>
        </div>
        <h1 className="screen__title">Рыбы Иртыша и озёр</h1>
        <p className="screen__lead">{items.length} видов, которые здесь реально ловят или встречают. Что за рыба, когда берёт, на что, можно ли есть.</p>

        <div className="section">
          <h2>Календарь</h2>
          <p className="caption">Тапните месяц — кто в нём активнее всего. Нерестовый запрет: реки 20 апреля – 20 мая, озёра 25 апреля – 25 мая. Зимовальные ямы закрыты 15 ноября – 20 апреля. Перволёдье обычно в середине ноября, последний лёд — начало апреля.</p>
          <div className="cal">
            {MONTHS_NOM.map((m, i) => {
              const ban = i === 3 || i === 4;
              const ice = i <= 2 || i >= 10;
              return (
                <button key={m} type="button" className={`cal__m${month === i + 1 ? ' cal__m--on' : ''}${nowMonth === i + 1 ? ' cal__m--now' : ''}`} onClick={() => setMonth(month === i + 1 ? null : i + 1)} aria-pressed={month === i + 1}>
                  <span className="cal__name">{m}</span>
                  <span className="cal__peaks">{peaks[i]?.slice(0, 3).map((p) => p.s.names.ru.toLowerCase()).join(', ')}</span>
                  <span className="cal__flags">{ban && <i className="cal__flag cal__flag--ban" title="нерестовый запрет" />}{ice && <i className="cal__flag cal__flag--ice" title="лёд" />}</span>
                </button>
              );
            })}
          </div>
          {month && (
            <div className="callout">
              <p><strong>{MONTHS_NOM[month - 1]}.</strong> Активнее всего: {peaks[month - 1].map((p) => `${p.s.names.ru.toLowerCase()} ${p.a}/10`).join(', ')}.
                {month === 4 && ' С 20 апреля на реках нерестовый запрет: одна удочка с берега.'}
                {month === 5 && ' До 20 мая на реках и до 25 мая на озёрах — только одна удочка с берега, без лодки.'}
                {month === 11 && ' С 15 ноября зимовальные ямы Иртыша закрыты. Перволёдье на затонах и озёрах — лучшие дни зимы.'}
                {(month === 1 || month === 2) && ' Глухозимье: на мелких озёрах возможен замор, ищите налима на Иртыше.'}
                {month === 4 && ' Последний лёд — до середины апреля, потом сход.'}
              </p>
            </div>
          )}
        </div>

        {GROUPS.map((g) => (
          <div key={g.key} className="section">
            <h2>{g.title}</h2>
            <ul className="rows">
              {g.ids.map((id) => byId.get(id)).filter((s): s is Species => !!s).map((s) => (
                <li key={s.id}>
                  <button type="button" className="row-btn" onClick={() => nav(`/species/${s.id}`)}>
                    <Photo s={s} small />
                    <span className="row-btn__main">
                      <span className="row-btn__title">{s.names.ru}{s.status.legal === 'banned' && <span className="sp-ban"> нельзя</span>}</span>
                      <span className="row-btn__meta">
                        <span>{s.names.aliases.slice(0, 2).join(', ') || s.names.lat}</span>
                        <span>{PRESENCE[s.presence]}</span>
                        <span style={{ color: chanceColor(s.activity_by_month[nowMonth - 1] * 10) }}>сейчас {s.activity_by_month[nowMonth - 1]}/10</span>
                      </span>
                    </span>
                    <span className="muted" aria-hidden="true">›</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SpeciesScreen() {
  const { id } = useParams();
  const d = useAllData();
  const full = useSpeciesFull();
  const nav = useNavigate();
  const set = useStore((s) => s.set);
  const hoursAhead = useStore((s) => s.hoursAhead);
  const s = full.data?.items.find((x) => x.id === id);
  const date = scrubberDate(hoursAhead);
  const spotsRanked = useMemo(() => {
    if (!s || !d.spots.data) return [];
    return d.spots.data.items
      .filter((sp) => sp.species.some((x) => x.id === s.id))
      .map((sp) => ({ sp, r: chance({ spot: sp, species: s, date, weather: weatherAt(nearestSeries(d.weather.data, sp.coords[1], sp.coords[0]), date), hydro: hydroFor(sp, d.gauges.data?.items, d.gauges.data?.ice, d.zones.data, date), rules: d.rules.data ?? null }), rank: sp.species.find((x) => x.id === s.id)!.rank }))
      .sort((a, b) => b.r.score - a.r.score || b.rank - a.rank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, d.spots.data, d.gauges.data, d.zones.data, d.rules.data, d.weather.data, Math.floor(date.getTime() / 3600000)]);
  if (!s) return <div className="screen"><div className="screen__inner"><p className="empty">{full.isPending ? 'Загружаем…' : 'Такой рыбы нет.'}</p></div></div>;
  const top = spotsRanked[0];
  const ctx = top ? { spot: top.sp, species: s, series: nearestSeries(d.weather.data, top.sp.coords[1], top.sp.coords[0]), hydro: hydroFor(top.sp, d.gauges.data?.items, d.gauges.data?.ice, d.zones.data, date), rules: d.rules.data ?? null } : null;
  const day0 = startOfOmskDay(new Date());
  const hours = ctx ? hourly(ctx, day0, 24) : [];
  const rules = d.rules.data;
  const banned = s.status.legal === 'banned';
  const fine = rules?.fines.per_fish_rub.find((f) => f.species_id === s.id);
  const nowMonth = omskParts(new Date()).month;

  return (
    <div className="screen">
      <div className="screen__inner sp">
        <button type="button" className="ss__back" onClick={() => nav(-1)}>‹ Назад</button>
        <div className="sp__head">
          <Photo s={s} />
          <div>
            <h1 className="screen__title">{s.names.ru}</h1>
            <p className="muted"><i>{s.names.lat}</i>{s.names.aliases.length ? ` — ${s.names.aliases.join(', ')}` : ''}</p>
            <div className="inline-list">
              <span className="tag">{s.family}</span>
              <span className="tag">{PRESENCE[s.presence]}</span>
              {banned && <span className="tag" style={{ background: 'var(--ban-wash)', color: 'var(--ban)' }}>вылов запрещён</span>}
              {s.status.red_book && <span className="tag" style={{ background: 'var(--ban-wash)', color: 'var(--ban)' }}>Красная книга</span>}
              {s.status.invasive && <span className="tag">инвазивный вид</span>}
            </div>
          </div>
        </div>
        {s.photo && (
          <p className="caption">Фото: {s.photo.author}, {s.photo.license}{s.photo.nc ? ' (некоммерческая лицензия)' : ''}, <a href={s.photo.source_url} target="_blank" rel="noopener">{s.photo.source}</a></p>
        )}
        {s.status.note && <div className="callout callout--restricted"><p>{s.status.note}</p></div>}

        <div className="section">
          <p className="sp__desc">{s.description}</p>
          <p className="caption"><ProvenanceBadge kind="generated" /> описание, активность, способы и лайфхаки — экспертная модель; размеры и нерест — справочные значения.</p>
        </div>

        <div className="section">
          <h2>Когда берёт</h2>
          <MonthBar species={s} rules={rules} currentMonth={nowMonth} />
          {ctx && top && !banned && (
            <>
              <h3>Сегодня, {dayShort(day0)} — на месте «{top.sp.name}»</h3>
              <HourChart scores={hours} lat={top.sp.coords[1]} lon={top.sp.coords[0]} series={nearestSeries(d.weather.data, top.sp.coords[1], top.sp.coords[0])} selected={date} />
            </>
          )}
          <dl className="kv">
            <dt>Нерест</dt><dd>{mmddRu(s.spawning.from)} – {mmddRu(s.spawning.to)}, вода {s.spawning.water_temp_c[0]}–{s.spawning.water_temp_c[1]} °C</dd>
            <dt>Размер</dt><dd>обычно {s.size.typical_cm[0]}–{s.size.typical_cm[1]} см, {s.size.typical_kg[0]}–{s.size.typical_kg[1]} кг; трофей от {s.size.trophy_kg} кг</dd>
            <dt>Где стоит</dt><dd>{s.habitat.water_types.join(', ')}; глубина {s.habitat.depth_m[0]}–{s.habitat.depth_m[1]} м; {s.habitat.structure.join(', ')}</dd>
          </dl>
          <h3>Погода и вода</h3>
          <dl className="kv">
            <dt>Давление</dt><dd>{s.weather_response.pressure}</dd>
            <dt>Ветер</dt><dd>{s.weather_response.wind}</dd>
            <dt>Облачность</dt><dd>{s.weather_response.cloud}</dd>
            <dt>Похолодание</dt><dd>{s.weather_response.temp_change}</dd>
            <dt>Уровень воды</dt><dd>{s.weather_response.water_level}</dd>
          </dl>
        </div>

        {!banned && (
          <div className="section">
            <h2>Как ловить</h2>
            {s.methods.map((m) => (
              <details key={m.name} className="method" open={s.methods.length <= 2}>
                <summary><strong>{m.name}</strong> <span className="muted">{m.seasons.join(', ')}</span></summary>
                <p><GearText text={m.technique} /></p>
                <dl className="kv">
                  {m.baits.length > 0 && (<><dt>Наживка</dt><dd><GearList items={m.baits} /></dd></>)}
                  {m.lures.length > 0 && (<><dt>Приманки</dt><dd><GearList items={m.lures} /></dd></>)}
                  <dt>Оснастка</dt><dd><GearText text={m.rig} /></dd>
                  <dt>Снасть</dt><dd><GearText text={m.gear} /></dd>
                </dl>
              </details>
            ))}
          </div>
        )}
        {banned && s.methods[0] && (
          <div className="section">
            <h2>Если попалась</h2>
            <p>{s.methods[0].technique}</p>
          </div>
        )}

        <div className="section">
          <h2>Лайфхаки</h2>
          <ul>{s.lifehacks.map((l) => <li key={l}><GearText text={l} /></li>)}</ul>
        </div>

        <div className="section">
          <h2>На столе</h2>
          <dl className="kv">
            <dt>Вкус</dt><dd>{'●'.repeat(s.edible.quality)}{'○'.repeat(5 - s.edible.quality)} — {s.edible.best_dishes.join(', ')}</dd>
            <dt>Кости</dt><dd>{s.edible.bones}</dd>
            <dt>Описторхоз</dt><dd><strong>риск {RISK[s.edible.opisthorchiasis_risk]}</strong></dd>
          </dl>
          <div className={`callout ${s.edible.opisthorchiasis_risk === 'high' ? 'callout--ban' : s.edible.opisthorchiasis_risk === 'medium' ? 'callout--restricted' : ''}`}>
            <p>{s.edible.safe_preparation}</p>
            <p className="caption"><ProvenanceBadge kind="official" /> режимы обеззараживания — Роспотребнадзор</p>
          </div>
        </div>

        <div className="section">
          <h2>Правила</h2>
          <dl className="kv">
            <dt>Статус</dt><dd>{banned ? 'вылов запрещён повсеместно, отпускать сразу' : 'разрешена'}</dd>
            <dt>Размер</dt><dd>{s.rules_ref.min_size_cm ? `от ${s.rules_ref.min_size_cm} см` : 'не установлен'}</dd>
            <dt>Норма</dt><dd>{s.rules_ref.daily_limit ?? 'отдельной нет, общая 10 кг в сутки'}</dd>
            {fine && (<><dt>Такса</dt><dd>{fine.rub.toLocaleString('ru-RU')} ₽ за штуку при нарушении, в запрет вдвое</dd></>)}
          </dl>
          <p>{s.handling}</p>
          <p className="caption"><ProvenanceBadge kind="official" /> <Link to="/rules">Все правила</Link></p>
        </div>

        {!banned && (
          <div className="section">
            <h2>Где ловить</h2>
            <p className="caption">Места, где {s.names.ru.toLowerCase()} отмечена, по шансу на выбранное время.</p>
            <ul className="rows">
              {spotsRanked.slice(0, 8).map(({ sp, r, rank }) => (
                <li key={sp.id}>
                  <button type="button" className="row-btn" onClick={() => { set({ speciesId: s.id, spotId: sp.id, waterId: null }); nav('/'); }}>
                    <span className={`score${r.legal === 'banned' ? ' score--banned' : ''}`} style={{ background: r.legal === 'banned' ? undefined : chanceColor(r.score) }}>{r.legal === 'banned' ? 'нельзя' : r.score}</span>
                    <span className="row-btn__main">
                      <span className="row-btn__title">{sp.name}</span>
                      <span className="row-btn__meta"><span>{sp.water_name}</span><span>{driveText(sp.drive_min)}</span><span>цель {rank}/5</span></span>
                    </span>
                    <span className="muted" aria-hidden="true">›</span>
                  </button>
                </li>
              ))}
            </ul>
            <p><Chip onClick={() => { set({ speciesId: s.id, spotId: null }); nav('/'); }}>Показать на карте</Chip></p>
          </div>
        )}
      </div>
    </div>
  );
}
