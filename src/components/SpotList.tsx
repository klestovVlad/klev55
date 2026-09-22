import { useStore } from '@/app/store';
import type { SpotScore } from '@/model/useScores';
import { chanceColor, driveText, timeHM } from '@/lib/format';

export function SpotRow({ s, onClick }: { s: SpotScore; onClick: () => void }) {
  const banned = s.result.legal === 'banned';
  return (
    <li>
      <button type="button" className="row-btn" onClick={onClick}>
        <span className={`score${banned ? ' score--banned' : ''}`} style={{ background: banned ? undefined : chanceColor(s.result.score) }} aria-label={banned ? 'ловить нельзя' : `шанс ${s.result.score}`}>
          {banned ? 'нельзя' : s.result.score}
        </span>
        <span className="row-btn__main">
          <span className="row-btn__title">{s.spot.name}</span>
          <span className="row-btn__meta">
            <span>{s.spot.water_name}</span>
            {s.spot.drive_min != null && <span>{driveText(s.spot.drive_min)}</span>}
            <span>{s.species.names.ru.toLowerCase()}</span>
            {s.window && !banned && <span>лучше {timeHM(s.window.from)}–{timeHM(s.window.to)}</span>}
            {s.spot.type === 'платник' && <span>платно</span>}
            {s.result.legal === 'restricted' && <span style={{ color: 'var(--amber)' }}>с берега, 1 удочка</span>}
          </span>
        </span>
        <span className="muted" aria-hidden="true">›</span>
      </button>
    </li>
  );
}

export function SpotList({ scores, limit }: { scores: SpotScore[]; limit?: number }) {
  const set = useStore((s) => s.set);
  const items = limit ? scores.slice(0, limit) : scores;
  if (!items.length) return <p className="empty">Под эти фильтры мест нет. Снимите фильтр расстояния или выберите другую рыбу.</p>;
  return (
    <ul className="rows">
      {items.map((s) => (
        <SpotRow key={s.spot.id} s={s} onClick={() => set({ spotId: s.spot.id, waterId: null })} />
      ))}
    </ul>
  );
}
