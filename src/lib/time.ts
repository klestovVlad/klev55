/** Omsk is UTC+6 all year (no DST). All model math uses Omsk wall-clock time. */
export const OMSK_TZ = 'Asia/Omsk';
export const OMSK_OFFSET_MS = 6 * 60 * 60 * 1000;

export interface LocalParts {
  year: number;
  month: number; // 1–12
  day: number; // 1–31
  hour: number; // 0–23
  minute: number;
  dayOfYear: number;
}

/** Wall-clock parts in Omsk time, computed with a fixed offset (fast, no Intl). */
export function omskParts(date: Date): LocalParts {
  const d = new Date(date.getTime() + OMSK_OFFSET_MS);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const start = Date.UTC(year, 0, 1);
  const dayOfYear = Math.floor((Date.UTC(year, month - 1, day) - start) / 86400000) + 1;
  return { year, month, day, hour: d.getUTCHours(), minute: d.getUTCMinutes(), dayOfYear };
}

/** Build a Date from Omsk wall-clock components. */
export function omskDate(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - OMSK_OFFSET_MS);
}

/** "MM-DD" → day-of-year-ish comparable number (month*100+day). */
export function mmdd(s: string): number {
  const [m, d] = s.split('-').map(Number);
  return m * 100 + d;
}

/** Is the local date inside an "MM-DD".."MM-DD" window (wrap-around allowed, inclusive)? */
export function inWindow(parts: LocalParts, from: string, to: string): boolean {
  const v = parts.month * 100 + parts.day;
  const a = mmdd(from);
  const b = mmdd(to);
  return a <= b ? v >= a && v <= b : v >= a || v <= b;
}

export function startOfOmskDay(date: Date): Date {
  const p = omskParts(date);
  return omskDate(p.year, p.month, p.day);
}

export function addHours(date: Date, h: number): Date {
  return new Date(date.getTime() + h * 3600000);
}
