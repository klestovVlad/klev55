import { useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useSpecies, useSpots, useWater, useGear } from '@/data/load';
import { useStore } from '@/app/store';
import { usePins } from '@/data/pins';
import './dialog.css';
import './search.css';

export function Search({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [q, setQ] = useState('');
  const species = useSpecies();
  const spots = useSpots();
  const water = useWater(open); // 1.3 MB overlay: fetch only when the search opens
  const gear = useGear();
  const pins = usePins((s) => s.pins);
  const set = useStore((s) => s.set);
  const nav = useNavigate();
  const waters = useMemo(() => {
    const seen = new Map<string, number>();
    for (const f of water.data?.features ?? []) {
      const n = f.properties?.name as string;
      if (n && !seen.has(n) && f.properties?.jurisdiction !== 'kz') seen.set(n, f.properties!.osm_id);
    }
    return [...seen.entries()];
  }, [water.data]);
  const ql = q.trim().toLowerCase();
  const filt = (s: string) => !ql || s.toLowerCase().includes(ql);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dlg__overlay" />
        <Dialog.Content className="dlg search" aria-describedby={undefined}>
          <Dialog.Title className="visually-hidden">Поиск</Dialog.Title>
          <Command label="Поиск мест, водоёмов и рыб" shouldFilter={false}>
            <div className="search__input-wrap">
              <Command.Input autoFocus value={q} onValueChange={setQ} placeholder="Место, река, озеро, рыба" className="search__input" />
              <Dialog.Close className="dlg__close" aria-label="Закрыть">×</Dialog.Close>
            </div>
            <Command.List className="search__list">
              <Command.Empty className="empty">Ничего не нашлось. Попробуйте «Иртыш», «затон», «щука».</Command.Empty>
              {pins.some((p) => filt(p.name)) && (
                <Command.Group heading="Мои места">
                  {pins
                    .filter((p) => filt(p.name))
                    .slice(0, 6)
                    .map((p) => (
                      <Command.Item key={p.id} value={`pin ${p.id}`} onSelect={() => { set({ pin: [p.lon, p.lat], pinFrom: 'list', waterId: p.waterId, spotId: null }); nav('/'); onOpenChange(false); }}>
                        <span>{p.name}</span>
                        <span className="muted">моё место</span>
                      </Command.Item>
                    ))}
                </Command.Group>
              )}
              <Command.Group heading="Места">
                {(spots.data?.items ?? [])
                  .filter((s) => filt(s.name) || filt(s.water_name) || filt(s.district))
                  .slice(0, ql ? 12 : 6)
                  .map((s) => (
                    <Command.Item key={s.id} value={`spot ${s.id}`} onSelect={() => { set({ spotId: s.id, waterId: null }); nav('/'); onOpenChange(false); }}>
                      <span>{s.name}</span>
                      <span className="muted">{s.water_name}, {s.distance_km} км</span>
                    </Command.Item>
                  ))}
              </Command.Group>
              <Command.Group heading="Рыбы">
                {(species.data?.items ?? [])
                  .filter((s) => filt(s.names.ru) || s.names.aliases.some(filt) || filt(s.names.lat))
                  .slice(0, ql ? 10 : 5)
                  .map((s) => (
                    <Command.Item key={s.id} value={`species ${s.id}`} onSelect={() => { nav(`/species/${s.id}`); onOpenChange(false); }}>
                      <span>{s.names.ru}</span>
                      <span className="muted">{s.names.aliases.slice(0, 2).join(', ')}</span>
                    </Command.Item>
                  ))}
              </Command.Group>
              {ql && (
                <Command.Group heading="Снасти и приманки">
                  {(gear.data?.items ?? [])
                    .filter((g) => filt(g.name) || g.aliases.some(filt))
                    .slice(0, 6)
                    .map((g) => (
                      <Command.Item key={g.id} value={`gear ${g.id}`} onSelect={() => { nav(`/gear/${g.id}`); onOpenChange(false); }}>
                        <span>{g.name}</span>
                        <span className="muted">{g.kind}</span>
                      </Command.Item>
                    ))}
                </Command.Group>
              )}
              {ql && (
                <Command.Group heading="Водоёмы">
                  {waters
                    .filter(([n]) => filt(n))
                    .slice(0, 10)
                    .map(([n, id]) => (
                      <Command.Item key={id} value={`water ${id}`} onSelect={() => { set({ waterId: id, spotId: null }); nav('/'); onOpenChange(false); }}>
                        <span>{n}</span>
                      </Command.Item>
                    ))}
                </Command.Group>
              )}
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
