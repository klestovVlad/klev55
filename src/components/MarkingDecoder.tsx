/** «Прочитать маркировку»: type what is written on the rod, lure or spool and get it in plain Russian. */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { decodeMarking } from '@/lib/marking';
import { useGear, useSpecies } from '@/data/load';

const EXAMPLES = ['S762ML-F 5-21g', '70SP-MR', 'Feeder 3.6m 60-120g', 'PE #0.8', '#8', '2500'];

export function MarkingDecoder({ initial = '' }: { initial?: string }) {
  const [q, setQ] = useState(initial);
  const gear = useGear();
  const species = useSpecies();
  const d = useMemo(() => decodeMarking(q), [q]);
  const gearById = useMemo(() => new Map((gear.data?.items ?? []).map((g) => [g.id, g])), [gear.data]);
  const spById = useMemo(() => new Map((species.data?.items ?? []).map((s) => [s.id, s])), [species.data]);
  const typed = q.trim().length > 0;
  return (
    <div className="decoder">
      <label className="decoder__label" htmlFor="decoder-input">Прочитать маркировку</label>
      <input id="decoder-input" className="decoder__input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Что написано на бланке или упаковке: 762ML 5-21g, 70SP-MR, PE 0.8…" autoComplete="off" autoCapitalize="off" spellCheck={false} />
      {!typed && (
        <div className="decoder__examples">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" className="tag decoder__ex" onClick={() => setQ(ex)}>{ex}</button>
          ))}
        </div>
      )}
      {typed && d.parts.length > 0 && (
        <ul className="decoder__parts">
          {d.parts.map((p, i) => (
            <li key={p.token + i}>
              <div className="decoder__head"><strong>{p.label}</strong>{!p.label.startsWith(p.kind.slice(0, 5)) && <span className="muted"> {p.kind}</span>}</div>
              <div className="decoder__detail">{p.detail}</div>
            </li>
          ))}
        </ul>
      )}
      {typed && d.parts.length === 0 && <p className="muted decoder__none">{d.summary}</p>}
      {typed && d.parts.length > 0 && d.unknown.length > 0 && (
        <p className="caption">Не разобрано: {d.unknown.join(', ')} — скорее всего, название модели или серии; по нему ничего не понять.</p>
      )}
      {typed && (d.gear.length > 0 || d.species.length > 0) && (
        <p className="decoder__links">
          {d.gear.length > 0 && (
            <span>
              Это про: {d.gear.map((id, i) => { const g = gearById.get(id); return g ? <span key={id}>{i ? ', ' : ''}<Link to={`/gear/${id}`}>{g.name.toLowerCase()}</Link></span> : null; })}.{' '}
            </span>
          )}
          {d.species.length > 0 && (
            <span>
              У нас подходит на: {d.species.map((id, i) => { const s = spById.get(id); return s ? <span key={id}>{i ? ', ' : ''}<Link to={`/species/${id}`}>{s.names.ru.toLowerCase()}</Link></span> : null; })}.
            </span>
          )}
        </p>
      )}
      <details className="decoder__legend">
        <summary>Какие коды бывают</summary>
        <dl className="kv">
          <dt>Удилище</dt><dd>мощность UL, L, ML, M, MH, H, XH, XXH; строй XF, F, MF, M, S; длина в футах (762 = 7′6″, 2 колена) или в см; тест в граммах (5–21 g); C или casting — под мультипликатор.</dd>
          <dt>Воблер</dt><dd>длина в мм, затем F плавающий, SP суспендер, S тонущий; глубина SSR, SR, MR, DR, MDR, SDR.</dd>
          <dt>Крючок</dt><dd>№ 20…№ 1 — чем больше номер, тем мельче; дальше 1/0…10/0 — крупные. Российская нумерация в мм с ней не совпадает.</dd>
          <dt>Леска</dt><dd>диаметр в мм (0,18), японская PE по сечению (#0.8), разрывная в lb или кг.</dd>
          <dt>Катушка</dt><dd>размер 1000…6000; HG/XG — быстрая подмотка, PG — силовая.</dd>
          <dt>Силикон</dt><dd>длина в дюймах: 2″, 3″, 4″.</dd>
        </dl>
        <p className="caption">Название модели (Rigge, X-Rap, Ranger) ничего не значит вне каталога производителя; расшифровываем только стандартные обозначения.</p>
      </details>
    </div>
  );
}
