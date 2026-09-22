import { useState } from 'react';
import { useStore } from '@/app/store';
import { useSpecies } from '@/data/load';
import { Chip } from './Chip';
import { SpeciesPicker } from './SpeciesPicker';
import { Search } from './Search';
import type { MethodName } from '@/data/types';
import './filterbar.css';

const METHODS: MethodName[] = ['спиннинг', 'фидер', 'поплавок', 'донка', 'жерлицы', 'мормышка', 'балансир'];
const KM = [null, 30, 60, 120] as const;

export function FilterBar() {
  const [pick, setPick] = useState(false);
  const [search, setSearch] = useState(false);
  const [more, setMore] = useState(false);
  const { speciesId, method, maxKm, iceOnly, freeOnly, set, layers, toggleLayer } = useStore();
  const species = useSpecies();
  const sp = species.data?.items.find((s) => s.id === speciesId);
  const kmNext = () => set({ maxKm: KM[(KM.indexOf(maxKm as any) + 1) % KM.length] });
  return (
    <div className="fbar">
      <div className="fbar__top">
        <button type="button" className="fbar__search" onClick={() => setSearch(true)} aria-label="Поиск мест, водоёмов и рыб">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <span>Место, вода, рыба</span>
        </button>
        <button type="button" className={`fbar__icon${more ? ' fbar__icon--on' : ''}`} onClick={() => setMore((m) => !m)} aria-label="Слои и фильтры" aria-expanded={more}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5" /></svg>
        </button>
      </div>
      <div className="chip-row fbar__chips">
        <Chip selected={!!speciesId} onClick={() => setPick(true)}>
          {sp ? sp.names.ru : 'Любая рыба'} <span aria-hidden="true">▾</span>
        </Chip>
        <Chip selected={maxKm != null} onClick={kmNext} ariaLabel={`Расстояние: ${maxKm ? `до ${maxKm} км` : 'любое'}`}>
          {maxKm ? `до ${maxKm} км` : 'Любая даль'}
        </Chip>
        <Chip selected={iceOnly} onClick={() => set({ iceOnly: !iceOnly })}>Со льда</Chip>
        <Chip selected={freeOnly} onClick={() => set({ freeOnly: !freeOnly })}>Бесплатно</Chip>
      </div>
      {more && (
        <div className="fbar__more">
          <div className="chip-row">
            {METHODS.map((m) => (
              <Chip key={m} small selected={method === m} onClick={() => set({ method: method === m ? null : m })}>{m}</Chip>
            ))}
          </div>
          <div className="chip-row">
            <Chip small selected={layers.zones} onClick={() => toggleLayer('zones')}>Запретные зоны</Chip>
            <Chip small selected={layers.satellite} onClick={() => toggleLayer('satellite')}>Спутник</Chip>
            <Chip small selected={layers.observations} onClick={() => toggleLayer('observations')}>Научные наблюдения</Chip>
          </div>
        </div>
      )}
      <SpeciesPicker open={pick} onOpenChange={setPick} />
      <Search open={search} onOpenChange={setSearch} />
    </div>
  );
}
