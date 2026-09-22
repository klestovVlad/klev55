import type { Species, Rules } from '@/data/types';
import { MONTHS_SHORT, chanceColor } from '@/lib/format';
import { mmdd } from '@/lib/time';
import './monthbar.css';

/** 12-month activity bars with spawning (biology) and ban (law) windows drawn on the same axis. */
export function MonthBar({ species, rules, currentMonth }: { species: Species; rules?: Rules; currentMonth?: number }) {
  const spawnFrom = mmdd(species.spawning.from);
  const spawnTo = mmdd(species.spawning.to);
  const toX = (v: number) => (((Math.floor(v / 100) - 1) + ((v % 100) - 1) / 31) / 12) * 100;
  const bans = (rules?.spawning_bans ?? []).filter((w) => !w.species || w.species.includes(species.id));
  const banned = species.status.legal === 'banned';
  return (
    <div className="mb">
      <div className="mb__bars">
        {species.activity_by_month.map((a, i) => (
          <div key={i} className={`mb__col${currentMonth === i + 1 ? ' mb__col--now' : ''}`} title={`${MONTHS_SHORT[i]}: ${a}/10`}>
            <div className="mb__bar" style={{ height: `${a * 10}%`, background: chanceColor(a * 10) }} />
            <span className="mb__lbl">{MONTHS_SHORT[i]}</span>
          </div>
        ))}
      </div>
      <div className="mb__tracks">
        <div className="mb__track" aria-label="Нерест">
          <span className="mb__track-lbl">нерест</span>
          <i className="mb__win mb__win--spawn" style={{ left: `${toX(spawnFrom)}%`, width: `${Math.max(1, toX(spawnTo) - toX(spawnFrom))}%` }} />
        </div>
        <div className="mb__track" aria-label="Запрет">
          <span className="mb__track-lbl">запрет</span>
          {banned ? (
            <i className="mb__win mb__win--ban" style={{ left: 0, width: '100%' }} title="Вылов запрещён круглый год" />
          ) : (
            bans.map((w) => <i key={w.id} className={`mb__win ${w.full_ban ? 'mb__win--ban' : 'mb__win--restricted'}`} style={{ left: `${toX(mmdd(w.from))}%`, width: `${Math.max(1, toX(mmdd(w.to)) - toX(mmdd(w.from)))}%` }} title={`${w.scope}: ${w.from}–${w.to}`} />)
          )}
        </div>
        <div className="mb__track" aria-label="Лёд">
          <span className="mb__track-lbl">лёд</span>
          <i className="mb__win mb__win--ice" style={{ left: 0, width: `${toX(415)}%` }} title="Лёд обычно до середины апреля" />
          <i className="mb__win mb__win--ice" style={{ left: `${toX(1110)}%`, width: `${100 - toX(1110)}%` }} title="Ледостав обычно с начала-середины ноября" />
        </div>
      </div>
      <p className="caption">Столбики — активность по месяцам (оценка). Полосы: нерест по биологии, запрет по правилам (светлая полоса — только с берега одной удочкой), типичный лёд.</p>
    </div>
  );
}
