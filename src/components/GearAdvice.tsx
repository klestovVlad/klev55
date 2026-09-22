/**
 * «Взять с собой»: 1–2 methods that fit the moment for a species, each with its glossary items as
 * tappable chips. Items the angler marked in «мой ящик» get a ✓; the rest stay plain.
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { MethodName, Species } from '@/data/types';
import { useGear } from '@/data/load';
import { useBox } from '@/data/box';
import { gearAdvice, seasonOf } from '@/model/gearAdvice';
import { GearTerm } from './GearText';
import './gearadvice.css';

interface Props {
  species: Species;
  date: Date;
  ice: boolean;
  spotMethods?: MethodName[];
  title?: string;
  max?: number;
}

export function GearAdvice({ species, date, ice, spotMethods, title = 'Взять с собой', max = 2 }: Props) {
  const gear = useGear();
  const ids = useBox((s) => s.ids);
  const have = useMemo(() => new Set(ids), [ids]);
  const picks = useMemo(() => gearAdvice(species, { season: seasonOf(date, ice), ice, spotMethods, glossary: gear.data?.items ?? [], max }), [species, date, ice, spotMethods, gear.data, max]);
  const byId = useMemo(() => new Map((gear.data?.items ?? []).map((g) => [g.id, g])), [gear.data]);
  if (!picks.length) return null;
  const owned = picks.flatMap((p) => p.items).filter((i) => i.id && have.has(i.id)).length;
  return (
    <div className="gadv">
      <h3>{title}</h3>
      {picks.map((p) => (
        <div key={p.method.name} className="gadv__row">
          <div className="gadv__method">
            <strong>{p.method.name}</strong>
            {!p.fitsSeason && <span className="muted"> — не лучший сезон, но здесь так ловят</span>}
          </div>
          <div className="gadv__items">
            {p.items.map((it) => {
              const g = it.id ? byId.get(it.id) : undefined;
              const own = !!it.id && have.has(it.id);
              const cls = `gadv__it${own ? ' gadv__it--have' : ''}`;
              return g ? (
                <GearTerm key={it.id + it.label} item={g} className={cls}>
                  {own && <span className="gadv__tick" aria-label="есть в ящике">✓</span>}
                  {it.label}
                </GearTerm>
              ) : (
                <span key={it.label} className={`${cls} gadv__it--plain`}>{it.label}</span>
              );
            })}
          </div>
        </div>
      ))}
      <p className="caption gadv__foot">
        {ids.length ? `✓ — есть в вашем ящике${owned ? '' : ', здесь ничего из него не нужно'}. ` : 'Отметьте свои снасти в словаре, и здесь появятся галочки. '}
        <Link to="/gear">Словарь снастей</Link>
      </p>
    </div>
  );
}
