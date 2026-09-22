/** «Мои места» on the main sheet: saved pins with their current range estimate. */
import { useStore, scrubberDate } from '@/app/store';
import { usePins, type Pin } from '@/data/pins';
import { useHere } from '@/model/useHere';
import { chanceColor, driveText, timeHM } from '@/lib/format';

function PinRow({ p, date }: { p: Pin; date: Date }) {
  const set = useStore((s) => s.set);
  const here = useHere([p.lon, p.lat], p.waterId, date);
  const top = here?.species.find((s) => s.range && s.range.result.legal !== 'banned');
  const r = top?.range ?? null;
  return (
    <li>
      <button type="button" className="row-btn" onClick={() => set({ pin: [p.lon, p.lat], waterId: p.waterId, spotId: null })}>
        <span className="score score--range" style={{ background: r ? chanceColor(Math.round((r.lo + r.hi) / 2)) : undefined }} aria-label={r ? `шанс примерно ${r.lo}–${r.hi}` : 'оценки нет'}>
          {r ? `≈${r.lo}–${r.hi}` : '·'}
        </span>
        <span className="row-btn__main">
          <span className="row-btn__title">{p.name}</span>
          <span className="row-btn__meta">
            {here?.water?.name && <span>{here.water.name}</span>}
            {here && <span>≈ {driveText(here.driveMin)}</span>}
            {top && <span>{top.species.names.ru.toLowerCase()}</span>}
            {top?.window && <span>лучше {timeHM(top.window.from)}–{timeHM(top.window.to)}</span>}
          </span>
        </span>
        <span className="muted" aria-hidden="true">›</span>
      </button>
    </li>
  );
}

export function PinList({ limit }: { limit?: number }) {
  const pins = usePins((s) => s.pins);
  const hoursAhead = useStore((s) => s.hoursAhead);
  if (!pins.length) return null;
  const date = scrubberDate(hoursAhead);
  const items = limit ? pins.slice(0, limit) : pins;
  return (
    <>
      <h2 className="mapscreen__h2">Мои места</h2>
      <ul className="rows">
        {items.map((p) => <PinRow key={p.id} p={p} date={date} />)}
      </ul>
    </>
  );
}
