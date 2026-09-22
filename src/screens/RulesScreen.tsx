import { useState } from 'react';
import { useAdvice, useRules, useSpeciesFull as useSpecies, useZones } from '@/data/load';
import { useStore, type Theme } from '@/app/store';
import { Chip } from '@/components/Chip';
import { InstallButton } from '@/components/InstallButton';
import { ProvenanceBadge } from '@/components/Provenance';
import { mmddRu } from '@/lib/format';
import { inWindow, omskParts } from '@/lib/time';
import './rules.css';

export function RulesScreen() {
  const rules = useRules();
  const advice = useAdvice();
  const zones = useZones();
  const species = useSpecies();
  const theme = useStore((s) => s.theme);
  const set = useStore((s) => s.set);
  const [tab, setTab] = useState<'rules' | 'safety' | 'about'>('rules');
  const r = rules.data;
  const p = omskParts(new Date());
  const base = import.meta.env.BASE_URL;
  const banned = (species.data?.items ?? []).filter((s) => s.status.legal === 'banned');
  const activeNow = (from: string, to: string) => inWindow(p, from, to);

  return (
    <div className="screen">
      <div className="screen__inner">
        <h1 className="screen__title">Правила и безопасность</h1>
        <div className="chip-row" style={{ margin: '8px 0 16px' }}>
          <Chip selected={tab === 'rules'} onClick={() => setTab('rules')}>Правила</Chip>
          <Chip selected={tab === 'safety'} onClick={() => setTab('safety')}>Безопасность</Chip>
          <Chip selected={tab === 'about'} onClick={() => setTab('about')}>О данных</Chip>
        </div>

        {tab === 'rules' && r && (
          <>
            <div className={`callout ${r.spawning_bans.some((w) => !w.species && activeNow(w.from, w.to)) ? 'callout--restricted' : activeNow(r.winter_pits_ban.from, r.winter_pits_ban.to) ? 'callout--restricted' : 'callout--ok'}`}>
              <p><strong>Сегодня.</strong>{' '}
                {r.spawning_bans.filter((w) => !w.species && activeNow(w.from, w.to)).map((w) => `${w.scope}: нерестовый запрет до ${mmddRu(w.to)}, можно ${w.what_is_allowed}. `)}
                {activeNow(r.winter_pits_ban.from, r.winter_pits_ban.to) ? 'Зимовальные ямы на Иртыше закрыты для любой ловли. ' : ''}
                {!r.spawning_bans.some((w) => !w.species && activeNow(w.from, w.to)) && !activeNow(r.winter_pits_ban.from, r.winter_pits_ban.to) ? 'Сезонных запретов нет. Действуют общие нормы по снастям, размерам и суточной норме.' : ''}
              </p>
            </div>
            <div className="section">
              <h2>Коротко</h2>
              <ul className="rules__digest">{r.plain_digest.map((s) => <li key={s}>{s}</li>)}</ul>
              <p className="caption"><ProvenanceBadge kind="official" /> {r.source_title}, редакция {r.edition_date.split('-').reverse().join('.')}. <a href={r.source_url} target="_blank" rel="noopener">Первоисточник</a>. {r.edition_note}</p>
            </div>
            <div className="section">
              <h2>Сроки запретов</h2>
              <table className="tbl">
                <thead><tr><th>Где</th><th>Когда</th><th>Что можно</th></tr></thead>
                <tbody>
                  {r.spawning_bans.map((w) => (
                    <tr key={w.id} className={activeNow(w.from, w.to) ? 'tbl__now' : ''}>
                      <td>{w.scope}</td>
                      <td>{mmddRu(w.from)} – {mmddRu(w.to)}</td>
                      <td>{w.full_ban ? 'ничего' : w.what_is_allowed}</td>
                    </tr>
                  ))}
                  <tr className={activeNow(r.winter_pits_ban.from, r.winter_pits_ban.to) ? 'tbl__now' : ''}>
                    <td>зимовальные ямы Иртыша</td>
                    <td>{mmddRu(r.winter_pits_ban.from)} – {mmddRu(r.winter_pits_ban.to)}</td>
                    <td>ничего</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="section">
              <h2>Размеры и нормы</h2>
              <table className="tbl">
                <thead><tr><th>Рыба</th><th>Минимум</th><th>В сутки</th></tr></thead>
                <tbody>
                  {Object.entries(r.min_size_cm).map(([id, cm]) => {
                    const lim = r.daily_limits.find((l) => l.species_id === id);
                    const name = species.data?.items.find((s) => s.id === id)?.names.ru ?? id;
                    return <tr key={id}><td>{name}</td><td>{cm} см</td><td>{lim?.limit ?? '—'}</td></tr>;
                  })}
                  <tr><td>Раки</td><td>9 см</td><td>2 кг</td></tr>
                  <tr><td>Все виды вместе</td><td>—</td><td>{r.total_daily_kg}</td></tr>
                </tbody>
              </table>
              <p className="caption">Мерить от вершины рыла при закрытом рте до основания средних лучей хвостового плавника. Меньше нормы — отпустить сразу.</p>
            </div>
            <div className="section">
              <h2>Нельзя ловить</h2>
              <ul className="rules__gallery">
                {banned.map((s) => (
                  <li key={s.id}>
                    {s.photo && <img src={s.photo.url.startsWith('http') ? s.photo.url : base + s.photo.url} alt={s.names.ru} loading="lazy" />}
                    <div>
                      <strong>{s.names.ru}</strong>
                      <div className="caption">{r.banned_species.find((b) => b.id === s.id)?.note}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="caption">Красная книга Омской области: {r.red_book.map((x) => x.name.toLowerCase()).join('; ')}.</p>
            </div>
            <div className="section">
              <h2>Снасти</h2>
              <h3>Можно</h3>
              <ul>{r.gear.allowed.map((g) => <li key={g}>{g}</li>)}</ul>
              <h3>Нельзя</h3>
              <ul>{r.gear.prohibited.map((g) => <li key={g}>{g}</li>)}</ul>
              <ul>{r.gear.notes.map((g) => <li key={g} className="muted">{g}</li>)}</ul>
              <h3>Расстояния</h3>
              <ul>{r.distances.map((x) => <li key={x.place}>{x.place}: {x.meters ? `${x.meters} м` : ''}{x.note ? ` — ${x.note}` : ''}</li>)}</ul>
            </div>
            <div className="section">
              <h2>Зимовальные ямы в 200 км от Омска</h2>
              <p className="caption">Все на Иртыше, закрыты {mmddRu(r.winter_pits_ban.from)} – {mmddRu(r.winter_pits_ban.to)}. На карте показаны штриховкой, когда запрет действует; границы восстановлены по координатам приказа и приблизительны.</p>
              <ul className="rules__pits">
                {(zones.data?.features ?? []).map((f) => (
                  <li key={f.properties!.id}><strong>{f.properties!.name}</strong> <span className="muted">— {f.properties!.landmark}, {f.properties!.district}</span></li>
                ))}
              </ul>
            </div>
            <div className="section">
              <h2>Штрафы</h2>
              <p>{r.fines.koap.article}: {r.fines.koap.fine_rub}.</p>
              <table className="tbl">
                <thead><tr><th>Рыба</th><th>Такса за штуку</th></tr></thead>
                <tbody>{r.fines.per_fish_rub.map((f) => <tr key={f.species_id}><td>{f.name}</td><td>{f.rub.toLocaleString('ru-RU')} ₽</td></tr>)}</tbody>
              </table>
              <ul>{r.fines.multipliers.map((m) => <li key={m.condition}>{m.condition}{m.factor > 1 ? ` — ×${m.factor}` : ''}</li>)}</ul>
              <p className="caption"><ProvenanceBadge kind="official" /> {r.fines.source_title}. <a href={r.fines.source_url} target="_blank" rel="noopener">Таксы</a>, <a href={r.fines.koap.url} target="_blank" rel="noopener">КоАП 8.37</a>.</p>
            </div>
            {advice.data && (
              <div className="section">
                <h2>Как это работает на берегу</h2>
                {advice.data.sections.filter((s) => s.kind === 'legal').map((s) => (
                  <details key={s.id} className="method">
                    <summary><strong>{s.title}</strong></summary>
                    {s.paragraphs.map((t) => <p key={t}>{t}</p>)}
                    {s.source && <p className="caption"><ProvenanceBadge kind={s.provenance} /> {s.source}</p>}
                  </details>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'safety' && advice.data && (
          <>
            {advice.data.sections.filter((s) => s.kind === 'safety').map((s) => (
              <div key={s.id} className="section">
                <h2>{s.title}</h2>
                {s.paragraphs.map((t) => <p key={t}>{t}</p>)}
                {s.source && <p className="caption"><ProvenanceBadge kind={s.provenance} /> {s.source}</p>}
              </div>
            ))}
            <div className="section">
              <h2>Местные наблюдения</h2>
              {advice.data.sections.filter((s) => s.kind === 'lifehack').map((s) => (
                <details key={s.id} className="method">
                  <summary><strong>{s.title}</strong></summary>
                  {s.paragraphs.map((t) => <p key={t}>{t}</p>)}
                </details>
              ))}
              <p className="caption"><ProvenanceBadge kind="generated" /></p>
            </div>
            <div className="section">
              <h2>Чек-листы</h2>
              {advice.data.checklists.map((c) => (
                <details key={c.id} className="method">
                  <summary><strong>{c.title}</strong> <span className="muted">{c.method}, {c.season}</span></summary>
                  <ul>{c.items.map((it) => <li key={it}>{it}</li>)}</ul>
                </details>
              ))}
            </div>
          </>
        )}

        {tab === 'about' && (
          <>
            <div className="section">
              <h2>Тема</h2>
              <div className="chip-row">
                {(['auto', 'light', 'dark'] as Theme[]).map((t) => (
                  <Chip key={t} selected={theme === t} onClick={() => set({ theme: t })}>{t === 'auto' ? 'Как в системе' : t === 'light' ? 'Светлая' : 'Тёмная'}</Chip>
                ))}
              </div>
              <p className="caption">На солнце светлая тема читается лучше; ночью на берегу — тёмная.</p>
            </div>
            <div className="section">
              <h2>Поставить на телефон</h2>
              <InstallButton />
            </div>
            <div className="section">
              <h2>Откуда данные</h2>
              <p>У каждого значения в приложении есть пометка происхождения. Тапните её, чтобы прочитать объяснение.</p>
              <dl className="kv">
                <dt><ProvenanceBadge kind="measured" /></dt><dd>Прогноз погоды Open-Meteo (CC BY 4.0), научные наблюдения GBIF и iNaturalist, последние опубликованные измерения гидропостов. Всегда с датой.</dd>
                <dt><ProvenanceBadge kind="official" /></dt><dd>Правила рыболовства (приказ Минсельхоза № 646), таксы (постановление № 1321), КоАП, режимы обеззараживания Роспотребнадзора, пороги МЧС.</dd>
                <dt><ProvenanceBadge kind="reference" /></dt><dd>Размеры, сроки нереста, фото видов из Wikimedia Commons и iNaturalist с указанием автора и лицензии.</dd>
                <dt><ProvenanceBadge kind="generated" /></dt><dd>Описания, места, советы, активность по месяцам и часам, шанс клёва, расчёт льда. Это экспертная модель, а не измерения. Места собраны по обобщённым отчётам без копирования чужих текстов и координат.</dd>
              </dl>
            </div>
            <div className="section">
              <h2>Чего в приложении нет</h2>
              <ul>
                <li>Живого уровня Иртыша: открытые источники не обновляются с 2024 года. Показываем последнее измерение с датой.</li>
                <li>Правил Казахстана: воды за границей показаны серым.</li>
                <li>Гарантий. Шанс клёва — эвристика: сезон, час, солунар, давление, ветер, осадки, лёд, место.</li>
              </ul>
            </div>
            <div className="section">
              <h2>Карта</h2>
              <p className="caption">Карта: OpenFreeMap © OpenMapTiles, данные © участники OpenStreetMap (ODbL). Спутник: Esri World Imagery. Границы водоёмов и подписи — OpenStreetMap.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
