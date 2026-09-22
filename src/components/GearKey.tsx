/** Step-through determination key: a few questions lead to a glossary card. */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GEAR_KEY, KEY_BY_ID, type KeyOption } from '@/data/gearKey';
import { useGear } from '@/data/load';
import { useBox } from '@/data/box';

const base = import.meta.env.BASE_URL;

export function GearKey() {
  const [path, setPath] = useState<string[]>(['root']);
  const [result, setResult] = useState<KeyOption | null>(null);
  const gear = useGear();
  const nav = useNavigate();
  const ids = useBox((s) => s.ids);
  const toggle = useBox((s) => s.toggle);
  const node = KEY_BY_ID.get(path[path.length - 1]) ?? GEAR_KEY[0];
  const reset = () => {
    setPath(['root']);
    setResult(null);
  };
  const back = () => {
    if (result) setResult(null);
    else if (path.length > 1) setPath(path.slice(0, -1));
  };
  const choose = (o: KeyOption) => {
    if (o.result) setResult(o);
    else if (o.next) setPath([...path, o.next]);
  };
  const items = result ? (result.result ?? []).map((id) => gear.data?.items.find((g) => g.id === id)).filter((g): g is NonNullable<typeof g> => !!g) : [];
  return (
    <div className="gkey">
      {!result ? (
        <>
          <p className="gkey__q">{node.question}</p>
          <ul className="rows">
            {node.options.map((o) => (
              <li key={o.label}>
                <button type="button" className="row-btn gkey__opt" onClick={() => choose(o)}>
                  <span className="row-btn__main"><span className="row-btn__title">{o.label}</span></span>
                  <span className="muted" aria-hidden="true">›</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className="gkey__q">{items.length > 1 ? 'Похоже на одно из этого:' : 'Похоже, это:'}</p>
          <ul className="gear-grid">
            {items.map((g) => (
              <li key={g.id}>
                <button type="button" className="gear-card" onClick={() => nav(`/gear/${g.id}`)}>
                  {g.illustration && <img className="gear-card__scheme" src={base + g.illustration} alt="" loading="lazy" />}
                  <span className="gear-card__name">{g.name}</span>
                  <span className="gear-card__sizes">{g.sizes}</span>
                </button>
                <button type="button" className={`btn btn--ghost btn--small gkey__box${ids.includes(g.id) ? ' gkey__box--on' : ''}`} onClick={() => toggle(g.id)}>{ids.includes(g.id) ? '✓ В моём ящике' : '+ В мой ящик'}</button>
              </li>
            ))}
          </ul>
          {result.hint && <p className="caption">{result.hint}</p>}
        </>
      )}
      <div className="gkey__nav">
        {(path.length > 1 || result) && <button type="button" className="btn btn--ghost btn--small" onClick={back}>‹ Назад</button>}
        {(path.length > 1 || result) && <button type="button" className="btn btn--ghost btn--small" onClick={reset}>Сначала</button>}
      </div>
    </div>
  );
}
