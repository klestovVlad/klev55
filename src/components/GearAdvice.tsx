/**
 * «Взять с собой»: 1–2 methods that fit the moment for a species, each with its glossary items as
 * chips. The left part of a chip toggles «есть у меня» (мой ящик), the name opens the card popover.
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
  const toggle = useBox((s) => s.toggle);
  const have = useMemo(() => new Set(ids), [ids]);
  const picks = useMemo(() => gearAdvice(species, { season: seasonOf(date, ice), ice, spotMethods, glossary: gear.data?.items ?? [], max }), [species, date, ice, spotMethods, gear.data, max]);
  const byId = useMemo(() => new Map((gear.data?.items ?? []).map((g) => [g.id, g])), [gear.data]);
  if (!picks.length) return null;
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
              if (!g) return <span key={it.label} className="gadv__it gadv__it--plain">{it.label}</span>;
              return (
                <span key={it.id + it.label} className={`gadv__it${own ? ' gadv__it--have' : ''}`}>
                  <button type="button" className="gadv__tick" aria-pressed={own} aria-label={own ? `${g.name}: есть, убрать из ящика` : `${g.name}: отметить, что есть`} onClick={() => toggle(g.id)}>
                    {own ? '✓' : '○'}
                  </button>
                  <GearTerm item={g} className="gadv__name">{it.label}</GearTerm>
                </span>
              );
            })}
          </div>
        </div>
      ))}
      <p className="caption gadv__foot">
        {ids.length ? 'Кружок — отметить, что есть; галочка — уже в вашем ящике. ' : 'Тап по кружку отмечает, что у вас это есть: советы и планировщик начнут это учитывать. '}
        <Link to="/gear">Словарь снастей</Link>
      </p>
    </div>
  );
}
