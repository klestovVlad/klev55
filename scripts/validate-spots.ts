/** Validate content/spots/*.json against the Spot contract (geometry checks happen in build-spots). */
import { readFileSync } from 'node:fs';

const TYPES = new Set(['река', 'протока', 'старица', 'озеро', 'пруд', 'водохранилище', 'платник']);
const FEATURES = new Set(['бровка', 'яма', 'коса', 'перекат', 'коряжник', 'устье', 'плёс', 'заросли', 'плотина', 'мост', 'обрывистый берег', 'пологий берег']);
const METHODS = new Set(['спиннинг', 'фидер', 'поплавок', 'донка', 'жерлицы', 'мормышка', 'балансир', 'блесна', 'нахлыст', 'троллинг']);
const SEASONS = new Set(['весна', 'лето', 'осень', 'зима']);

export function validateSpot(s: any, file = '', speciesIds?: Set<string>): string[] {
  const e: string[] = [];
  const need = (c: boolean, m: string) => {
    if (!c) e.push(`${file}: ${m}`);
  };
  need(typeof s.id === 'string' && /^[a-z0-9-]+$/.test(s.id), 'id latin slug');
  need(typeof s.name === 'string' && s.name.length > 2, 'name');
  need(Array.isArray(s.coords) && s.coords.length === 2 && s.coords[0] > 60 && s.coords[0] < 90 && s.coords[1] > 50 && s.coords[1] < 60, 'coords [lon, lat] in Siberia');
  need(typeof s.water_name === 'string', 'water_name');
  need(TYPES.has(s.type), `type "${s.type}"`);
  need(typeof s.district === 'string', 'district');
  need(s.access && typeof s.access.car === 'string' && typeof s.access.foot === 'boolean' && typeof s.access.boat === 'boolean' && typeof s.access.winter === 'string', 'access{car,foot,boat,winter}');
  need(Array.isArray(s.features) && s.features.every((f: string) => FEATURES.has(f)), 'features from list');
  need(Array.isArray(s.species) && s.species.length >= 1, 'species ≥ 1');
  for (const sp of s.species ?? []) {
    need(typeof sp.id === 'string', 'species.id');
    if (speciesIds) need(speciesIds.has(sp.id), `species id "${sp.id}" unknown`);
    need([1, 2, 3, 4, 5].includes(sp.rank), `species ${sp.id}: rank 1–5`);
    need(Array.isArray(sp.seasons) && sp.seasons.every((x: string) => SEASONS.has(x)), `species ${sp.id}: seasons`);
    need(Array.isArray(sp.methods) && sp.methods.every((x: string) => METHODS.has(x)), `species ${sp.id}: methods`);
    need(typeof sp.note === 'string', `species ${sp.id}: note`);
  }
  need(Array.isArray(s.best_months) && s.best_months.every((m: number) => m >= 1 && m <= 12), 'best_months 1–12');
  need(typeof s.best_hours_note === 'string' && typeof s.depth_note === 'string', 'best_hours_note/depth_note');
  need(typeof s.notes === 'string' && s.notes.split(/[.!?]\s/).length >= 2, 'notes 2–4 sentences');
  need(Array.isArray(s.lifehacks) && s.lifehacks.length >= 1 && s.lifehacks.length <= 3, 'lifehacks 1–3');
  if (s.type === 'платник') need(s.paid && typeof s.paid.price_note === 'string' && Array.isArray(s.paid.stocked_species), 'paid{price_note,contact_hint,stocked_species[]} for платник');
  need(typeof s.ice_spot === 'boolean', 'ice_spot');
  need([0, 1, 2, 3].includes(s.confidence), 'confidence 0–3');
  need(Array.isArray(s.corroborated_by), 'corroborated_by[]');
  need(s.provenance === 'generated', 'provenance "generated"');
  return e;
}

if (process.argv[1]?.endsWith('validate-spots.ts')) {
  let bad = 0;
  for (const f of process.argv.slice(2)) {
    const errs = validateSpot(JSON.parse(readFileSync(f, 'utf8')), f);
    if (errs.length) {
      bad++;
      console.log(errs.join('\n'));
    } else console.log(`${f}: ok`);
  }
  process.exit(bad ? 1 : 0);
}
