import { Link, useNavigate, useParams } from 'react-router-dom';
import { useGear, useSpeciesFull } from '@/data/load';
import { ProvenanceBadge } from '@/components/Provenance';
import type { GearKind } from '@/data/types';
import './gear.css';

const KINDS: GearKind[] = ['приманка', 'наживка', 'оснастка', 'снасть'];
const KIND_TITLE: Record<GearKind, string> = { приманка: 'Приманки', наживка: 'Наживки и насадки', оснастка: 'Оснастки', снасть: 'Снасти' };
const base = import.meta.env.BASE_URL;
const img = (u: string) => (u.startsWith('http') ? u : base + u);

export function GearListScreen() {
  const gear = useGear();
  const nav = useNavigate();
  const items = gear.data?.items ?? [];
  return (
    <div className="screen">
      <div className="screen__inner">
        <div className="seg" role="tablist" aria-label="Справочник">
          <Link to="/species" role="tab" aria-selected={false} className="seg__item">Рыбы</Link>
          <Link to="/gear" role="tab" aria-selected className="seg__item seg__item--on">Снасти</Link>
        </div>
        <h1 className="screen__title">Снасти и приманки</h1>
        <p className="screen__lead">Что это такое, когда работает у нас и какого размера брать. Классы, а не модели: марки и цены здесь не обсуждаются.</p>
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
                      <span className="gear-card__name">{g.name}</span>
                      <span className="gear-card__sizes">{g.sizes}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        {!items.length && <p className="empty">{gear.isPending ? 'Загружаем…' : 'Словарь не загрузился.'}</p>}
      </div>
    </div>
  );
}

export function GearScreen() {
  const { id } = useParams();
  const gear = useGear();
  const species = useSpeciesFull();
  const nav = useNavigate();
  const g = gear.data?.items.find((x) => x.id === id);
  if (!g) return <div className="screen"><div className="screen__inner"><p className="empty">{gear.isPending ? 'Загружаем…' : 'Такой карточки нет.'}</p></div></div>;
  const related = (species.data?.items ?? []).filter((s) => g.species.includes(s.id));
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
