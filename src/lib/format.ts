import { OMSK_TZ } from './time';

const fmtTime = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: OMSK_TZ });
const fmtDay = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: 'numeric', month: 'short', timeZone: OMSK_TZ });
const fmtDayLong = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: OMSK_TZ });
const fmtDate = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: OMSK_TZ });
const fmtHour = new Intl.DateTimeFormat('ru-RU', { hour: 'numeric', timeZone: OMSK_TZ });

export const timeHM = (d: Date) => fmtTime.format(d);
export const dayShort = (d: Date) => fmtDay.format(d).replace('.', '');
export const dayLong = (d: Date) => fmtDayLong.format(d);
export const dateDMY = (d: Date) => fmtDate.format(d);
export const hourH = (d: Date) => fmtHour.format(d);

/** "MM-DD" → "20 мая" */
export function mmddRu(s: string): string {
  const [m, d] = s.split('-').map(Number);
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  return `${d} ${months[m - 1]}`;
}

export const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
export const MONTHS_NOM = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

export function chanceWord(score: number): string {
  if (score >= 80) return 'отлично';
  if (score >= 60) return 'хорошо';
  if (score >= 40) return 'так себе';
  return 'плохо';
}

/** Chance colour on the grey-blue → river → reed → amber scale (docs/DESIGN.md). */
export function chanceColor(score: number): string {
  if (score >= 80) return 'var(--chance-85)';
  if (score >= 60) return 'var(--chance-65)';
  if (score >= 40) return 'var(--chance-40)';
  return 'var(--chance-0)';
}

/** Same scale as hex for MapLibre expressions (light theme; dark uses lighter set). */
export const CHANCE_HEX = {
  light: ['#a9b4ba', '#2f5d75', '#6e7f3a', '#d8821f'],
  dark: ['#6d7a82', '#5f93b0', '#98ad55', '#f0a24a'],
};

export function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

export function driveText(min: number | null): string {
  if (min == null) return '';
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} ч ${m} мин` : `${h} ч`;
}

export function windDirText(deg: number): string {
  const dirs = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'];
  return dirs[Math.round(deg / 45) % 8];
}

export function weatherWord(code: number): string {
  if (code === 0) return 'ясно';
  if (code <= 2) return 'малооблачно';
  if (code === 3) return 'пасмурно';
  if (code <= 48) return 'туман';
  if (code <= 57) return 'морось';
  if (code <= 67) return 'дождь';
  if (code <= 77) return 'снег';
  if (code <= 82) return 'ливень';
  if (code <= 86) return 'снегопад';
  return 'гроза';
}

/** Angler-relevance order for species pickers (rest alphabetical after these). */
export const SPECIES_PRIORITY = ['esox-lucius', 'sander-lucioperca', 'perca-fluviatilis', 'abramis-brama', 'leuciscus-idus', 'carassius-gibelio', 'rutilus-rutilus', 'cyprinus-carpio', 'lota-lota', 'leuciscus-leuciscus', 'tinca-tinca', 'coregonus-peled', 'gymnocephalus-cernua', 'perccottus-glenii', 'carassius-carassius', 'ctenopharyngodon-idella', 'hypophthalmichthys-molitrix', 'oncorhynchus-mykiss'];
export function bySpeciesPriority<T extends { id: string; names: { ru: string } }>(a: T, b: T): number {
  const ia = SPECIES_PRIORITY.indexOf(a.id);
  const ib = SPECIES_PRIORITY.indexOf(b.id);
  if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  return a.names.ru.localeCompare(b.names.ru, 'ru');
}
