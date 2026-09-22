import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useGear, useSpeciesFull } from '@/data/load';
import { useBox } from '@/data/box';
import { ProvenanceBadge } from '@/components/Provenance';
import { MarkingDecoder } from '@/components/MarkingDecoder';
import { GearKey } from '@/components/GearKey';
import { Chip } from '@/components/Chip';
import type { GearKind } from '@/data/types';
import './gear.css';

const KINDS: GearKind[] = ['приманка', 'наживка', 'оснастка', 'снасть'];
const KIND_TITLE: Record<GearKind, string> = { приманка: 'Приманки', наживка: 'Наживки и насадки', оснастка: 'Оснастки', снасть: 'Снасти' };
const base = import.meta.env.BASE_URL;
const img = (u: string) => (u.startsWith('http') ? u : base + u);

export function GearListScreen() {
  const gear = useGear();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const ids = useBox((s) => s.ids);
  const [mine, setMine] = useState(false);
  const [keyOpen, setKeyOpen] = useState(params.get('key') === '1');
  const all = gear.data?.items ?? [];
  const items = mine ? all.filter((g) => ids.includes(g.id)) : all;
  return (
    <div className="screen">
      <div className="screen__inner">
        <div className="seg" role="tablist" aria-label="Справочник">
          <Link to="/species" role="tab" aria-selected={false} className="seg__item">Рыбы</Link>
          <Link to="/gear" role="tab" aria-selected className="seg__item seg__item--on">Снасти</Link>
        </div>
        <h1 className="screen__title">Снасти и приманки</h1>
        <p className="screen__lead">Что это такое, когда работает у нас и какого размера брать. Классы, а не модели: марки и цены здесь не обсуждаются.</p>

        <MarkingDecoder initial={params.get('q') ?? ''} />

        <details className="method gkey-wrap" open={keyOpen} onToggle={(e) => setKeyOpen((e.currentTarget as HTMLDetailsElement).open)}>
          <summary><strong>Не знаете, что у вас в руках?</strong> <span className="muted">Определить по признакам</span></summary>
          {keyOpen && <GearKey />}
        </details>

        <div className="chip-row gear__filters">
          <Chip selected={!mine} onClick={() => setMine(false)}>Все</Chip>
          <Chip selected={mine} onClick={() => setMine(true)}>Мой ящик{ids.length ? ` · ${ids.length}` : ''}</Chip>
        </div>
        {mine && !ids.length && <p className="muted">Ящик пуст. Откройте карточку и нажмите «В мой ящик» — тогда в советах «Взять с собой» появятся галочки у того, что у вас есть.</p>}

        {KINDS.map((k) => {
          const list = items.filter((g) => g.kind === k);
          if (!list.length) return null;
          return (
            <div key={k} className="section">
              <h2>{KIND_TITLE[k]}</h2>
              <ul className="gear-grid">
                {list.map((g) => (
                  <li key={g.id}>
                    <button type="button" className="gear-card" onClick={() => nav(`/gear/${g.id}`)}>
                      {g.illustration ? <img className="gear-card__scheme" src={base + g.illustration} alt="" loading="lazy" /> : g.photo ? <img src={img(g.photo.url)} alt="" loading="lazy" /> : <div className="gear-card__empty" aria-hidden="true" />}
                      {ids.includes(g.id) && <span className="gear-card__own" aria-label="в моём ящике">✓</span>}
                      <span className="gear-card__name">{g.name}</span>
                      <span className="gear-card__sizes">{g.sizes}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        {!all.length && <p className="empty">{gear.isPending ? 'Загружаем…' : 'Словарь не загрузился.'}</p>}
      </div>
    </div>
  );
}

export function GearScreen() {
  const { id } = useParams();
  const gear = useGear();
  const species = useSpeciesFull();
  const nav = useNavigate();
  const ids = useBox((s) => s.ids);
  const toggle = useBox((s) => s.toggle);
  const g = gear.data?.items.find((x) => x.id === id);
  if (!g) return <div className="screen"><div className="screen__inner"><p className="empty">{gear.isPending ? 'Загружаем…' : 'Такой карточки нет.'}</p></div></div>;
  const related = (species.data?.items ?? []).filter((s) => g.species.includes(s.id));
  const own = ids.includes(g.id);
  return (
    <div className="screen">
      <div className="screen__inner">
        <button type="button" className="ss__back" onClick={() => nav(-1)}>‹ Назад</button>
        <h1 className="screen__title">{g.name}</h1>
        <p className="muted">{g.kind}{g.aliases.length ? ` — ${g.aliases.slice(0, 3).join(', ')}` : ''}</p>
        {g.illustration && <img className="gear-scheme" src={base + g.illustration} alt={`Схема: ${g.name}`} />}
        {g.photo && (
          <figure className="gear-fig">
            <img src={img(g.photo.url)} alt={g.name} />
            <figcaption className="caption">Фото: {g.photo.author}, {g.photo.license}, <a href={g.photo.source_url} target="_blank" rel="noopener">{g.photo.source}</a></figcaption>
          </figure>
        )}
        <p>
          <button type="button" className={`btn ${own ? 'btn--ghost' : ''} btn--small gear__box`} aria-pressed={own} onClick={() => toggle(g.id)}>{own ? '✓ В моём ящике' : '+ В мой ящик'}</button>
          <span className="caption gear__box-note"> {own ? 'В советах «Взять с собой» это отмечено галочкой.' : 'Отметьте, что у вас есть: советы покажут, что из вашего ящика брать.'}</span>
        </p>
        <div className="section">
          <p className="sp__desc">{g.summary}</p>
          <p>{g.here}</p>
          <dl className="kv">
            <dt>Размеры</dt><dd>{g.sizes}</dd>
            <dt>Способы</dt><dd>{g.methods.join(', ')}</dd>
          </dl>
          <p className="caption"><ProvenanceBadge kind="generated" /> описание и рекомендации — экспертная модель</p>
        </div>
        {related.length > 0 && (
          <div className="section">
            <h2>На кого</h2>
            <ul className="rows">
              {related.map((s) => (
                <li key={s.id}>
                  <button type="button" className="row-btn" onClick={() => nav(`/species/${s.id}`)}>
                    {s.photo && <img className="sp-photo sp-photo--small" src={img(s.photo.url)} alt="" loading="lazy" />}
                    <span className="row-btn__main"><span className="row-btn__title">{s.names.ru}</span></span>
                    <span className="muted" aria-hidden="true">›</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
