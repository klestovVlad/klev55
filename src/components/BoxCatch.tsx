/**
 * «С вашим ящиком»: which of the species here can be fished with what the angler owns, and what is
 * missing for the rest. Silent when the box is empty.
 */
import { useMemo } from 'react';
import type { MethodName, Species } from '@/data/types';
import { useGear } from '@/data/load';
import { useBox } from '@/data/box';
import { buildGearIndex } from '@/lib/gearIndex';
import { seasonOf } from '@/model/gearAdvice';
import { speciesCoverage } from '@/model/coverage';
import { chanceColor } from '@/lib/format';

export interface CatchEntry {
  species: Species;
  score: number | null; // mean score for colour and order
  scoreText: string; // "64" or "≈54–64"
  banned: boolean;
  spotMethods?: MethodName[];
}

export function BoxCatch({ entries, date, ice, onPick }: { entries: CatchEntry[]; date: Date; ice: boolean; onPick?: (id: string) => void }) {
  const gear = useGear();
  const ids = useBox((s) => s.ids);
  const rows = useMemo(() => {
    if (!ids.length || !gear.data) return [];
    const box = new Set(ids);
    const index = buildGearIndex(gear.data.items);
    const season = seasonOf(date, ice);
    return entries
      .filter((e) => !e.banned && e.species.methods?.length)
      .map((e) => ({ e, c: speciesCoverage(e.species, box, { season, ice, spotMethods: e.spotMethods, glossary: gear.data!.items, index }) }))
      .filter((r) => r.c.best && r.c.best.level !== 'unknown');
  }, [entries, ids, gear.data, date, ice]);
  if (!ids.length || !rows.length) return null;
  const can = rows.filter((r) => r.c.best!.level === 'full').sort((a, b) => (b.e.score ?? 0) - (a.e.score ?? 0));
  const partly = rows.filter((r) => r.c.best!.level !== 'full').sort((a, b) => (b.e.score ?? 0) - (a.e.score ?? 0)).slice(0, 3);
  return (
    <div className="boxcatch">
      <h3>С вашим ящиком</h3>
      {can.length ? (
        <ul>
          {can.map(({ e, c }) => (
            <li key={e.species.id}>
              <span className="boxcatch__score" style={{ color: e.score != null ? chanceColor(e.score) : undefined }}>{e.scoreText}</span>
              <span>
                {onPick ? <button type="button" className="link" onClick={() => onPick(e.species.id)}>{e.species.names.ru}</button> : e.species.names.ru}
                {' '}<span className="muted">на {c.best!.pick.method.name}: {c.best!.have.map((h) => h.label).slice(0, 3).join(', ')}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">Полного комплекта ни на кого нет.</p>
      )}
      {partly.length > 0 && (
        <p className="boxcatch__missing">
          {partly.map(({ e, c }, i) => `${i ? ' ' : ''}${e.species.names.ru}: не хватает ${c.best!.missing.map((m) => m.label.toLowerCase()).join(', ')}.`)}
        </p>
      )}
    </div>
  );
}
