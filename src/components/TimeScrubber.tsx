import { useStore, scrubberDate } from '@/app/store';
import { dayShort, timeHM } from '@/lib/format';
import { startOfOmskDay } from '@/lib/time';
import './scrubber.css';

/** Steps: 0..48 h hourly, then one step per day up to 7 days (landing at 10:00 Omsk time). */
function steps(now: Date): number[] {
  const hourly = Array.from({ length: 49 }, (_, i) => i);
  const day0 = startOfOmskDay(now).getTime();
  const daily: number[] = [];
  for (let d = 3; d <= 7; d++) {
    const target = day0 + d * 86400000 + 10 * 3600000;
    daily.push(Math.round((target - now.getTime()) / 3600000));
  }
  return [...hourly, ...daily];
}

export function TimeScrubber() {
  const hoursAhead = useStore((s) => s.hoursAhead);
  const set = useStore((s) => s.set);
  const now = new Date();
  const STEPS = steps(now);
  let idx = STEPS.findIndex((h) => h >= hoursAhead);
  if (idx < 0) idx = STEPS.length - 1;
  const date = scrubberDate(hoursAhead, now);
  const label = hoursAhead === 0 ? 'сейчас' : hoursAhead <= 48 ? `${dayShort(date)}, ${timeHM(date)}` : `${dayShort(date)}, утро`;
  return (
    <div className="scrubber">
      <label className="scrubber__label">
        <span>Когда</span>
        <strong>{label}</strong>
      </label>
      <input
        type="range"
        min={0}
        max={STEPS.length - 1}
        step={1}
        value={idx}
        aria-label="Время прогноза"
        aria-valuetext={label}
        onChange={(e) => set({ hoursAhead: STEPS[Number(e.target.value)] })}
      />
      <div className="scrubber__ticks" aria-hidden="true">
        <span>сейчас</span>
        <span>+24 ч</span>
        <span>+48 ч</span>
        <span>7 дней</span>
      </div>
    </div>
  );
}
