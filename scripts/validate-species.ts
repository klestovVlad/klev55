/** Validate one or more content/species/*.json files against the Species contract. Usage: tsx scripts/validate-species.ts content/species/*.json */
import { readFileSync } from 'node:fs';

const METHODS = new Set(['спиннинг', 'фидер', 'поплавок', 'донка', 'жерлицы', 'мормышка', 'балансир', 'блесна', 'нахлыст', 'троллинг']);
const SEASONS = new Set(['весна', 'лето', 'осень', 'зима']);
const PROV = new Set(['measured', 'official', 'reference', 'generated']);

function words(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

export function validateSpecies(s: any, file = ''): string[] {
  const e: string[] = [];
  const need = (cond: boolean, msg: string) => {
    if (!cond) e.push(`${file}: ${msg}`);
  };
  need(typeof s.id === 'string' && /^[a-z0-9-]+$/.test(s.id), 'id must be a latin slug');
  need(s.names && s.names.ru && s.names.lat && s.names.en && Array.isArray(s.names.aliases), 'names{ru,lat,en,aliases[]}');
  need(typeof s.family === 'string' && s.family.length > 2, 'family');
  need(s.photo === null || (s.photo && s.photo.url && s.photo.license), 'photo null or {url,license,...}');
  need(s.status && ['allowed', 'banned', 'banned_outside_licensed_sites'].includes(s.status.legal), 'status.legal');
  need(typeof s.status?.red_book === 'boolean' && typeof s.status?.invasive === 'boolean', 'status.red_book/invasive booleans');
  need(s.rules_ref && 'min_size_cm' in s.rules_ref && 'daily_limit' in s.rules_ref, 'rules_ref{min_size_cm,daily_limit}');
  const w = words(s.description ?? '');
  need(w >= 110 && w <= 200, `description 120–180 words (got ${w})`);
  need(Array.isArray(s.size?.typical_cm) && s.size.typical_cm.length === 2 && Array.isArray(s.size?.typical_kg) && typeof s.size?.trophy_kg === 'number', 'size{typical_cm[2],typical_kg[2],trophy_kg}');
  need(Array.isArray(s.habitat?.water_types) && s.habitat.water_types.length > 0, 'habitat.water_types[]');
  need(Array.isArray(s.habitat?.depth_m) && s.habitat.depth_m.length === 2, 'habitat.depth_m[2]');
  need(['none', 'slow', 'moderate', 'fast'].includes(s.habitat?.current), 'habitat.current');
  need(/^\d\d-\d\d$/.test(s.spawning?.from ?? '') && /^\d\d-\d\d$/.test(s.spawning?.to ?? ''), 'spawning.from/to MM-DD');
  need(Array.isArray(s.spawning?.water_temp_c) && s.spawning.water_temp_c.length === 2, 'spawning.water_temp_c[2]');
  need(Array.isArray(s.activity_by_month) && s.activity_by_month.length === 12 && s.activity_by_month.every((v: any) => Number.isInteger(v) && v >= 0 && v <= 10), 'activity_by_month 12 ints 0–10');
  for (const m of ['openwater', 'ice']) {
    const a = s.activity_by_hour?.[m];
    need(Array.isArray(a) && a.length === 24 && a.every((v: any) => Number.isInteger(v) && v >= 0 && v <= 10), `activity_by_hour.${m} 24 ints 0–10`);
  }
  for (const k of ['pressure', 'wind', 'cloud', 'temp_change', 'water_level']) need(typeof s.weather_response?.[k] === 'string' && s.weather_response[k].length > 10, `weather_response.${k}`);
  need(Array.isArray(s.methods) && s.methods.length >= 1, 'methods ≥ 1');
  for (const m of s.methods ?? []) {
    need(METHODS.has(m.name), `method name "${m.name}" not in allowed list`);
    need(Array.isArray(m.seasons) && m.seasons.every((x: string) => SEASONS.has(x)), `method ${m.name}: seasons`);
    need(Array.isArray(m.baits) && Array.isArray(m.lures), `method ${m.name}: baits[]/lures[]`);
    need(typeof m.rig === 'string' && typeof m.technique === 'string' && typeof m.gear === 'string', `method ${m.name}: rig/technique/gear strings`);
    need(words(m.technique) >= 20, `method ${m.name}: technique ≥ 2 sentences`);
  }
  need(Array.isArray(s.lifehacks) && s.lifehacks.length >= 3 && s.lifehacks.length <= 6, 'lifehacks 3–6');
  need([1, 2, 3, 4, 5].includes(s.edible?.quality), 'edible.quality 1–5');
  need(['high', 'medium', 'low', 'none'].includes(s.edible?.opisthorchiasis_risk), 'edible.opisthorchiasis_risk');
  need(typeof s.edible?.safe_preparation === 'string' && s.edible.safe_preparation.length > 20, 'edible.safe_preparation');
  need(typeof s.edible?.bones === 'string' && Array.isArray(s.edible?.best_dishes), 'edible.bones / best_dishes[]');
  need(typeof s.handling === 'string' && s.handling.length > 40, 'handling');
  need(['common', 'local', 'rare', 'stocked'].includes(s.presence), 'presence');
  need(s.provenance && typeof s.provenance === 'object' && Object.values(s.provenance).every((v) => PROV.has(v as string)), 'provenance map');
  for (const k of ['description', 'size', 'habitat', 'spawning', 'activity_by_month', 'activity_by_hour', 'methods', 'lifehacks', 'edible', 'rules_ref'])
    need(k in (s.provenance ?? {}), `provenance.${k} missing`);
  return e;
}

if (process.argv[1]?.endsWith('validate-species.ts')) {
  let bad = 0;
  for (const f of process.argv.slice(2)) {
    const errs = validateSpecies(JSON.parse(readFileSync(f, 'utf8')), f);
    if (errs.length) {
      bad++;
      console.log(errs.join('\n'));
    } else console.log(`${f}: ok`);
  }
  process.exit(bad ? 1 : 0);
}
