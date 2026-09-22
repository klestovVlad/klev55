/**
 * Data QA (BRIEF §8). Fails the build on violations.
 * Run: npm run qa
 */
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import * as turf from '@turf/turf';
import { CENTER, RADIUS_KM, distanceKm } from './lib/geo';
import { validateSpecies } from './validate-species';
import { validateSpot } from './validate-spots';

const D = 'public/data';
const problems: string[] = [];
const warn: string[] = [];
const need = (c: boolean, m: string) => {
  if (!c) problems.push(m);
};
const load = (f: string) => JSON.parse(readFileSync(`${D}/${f}`, 'utf8'));

for (const f of ['species.json', 'spots.json', 'rules.json', 'zones.geojson', 'gauges.json', 'water.json', 'advice.json', 'observations.geojson']) need(existsSync(`${D}/${f}`), `${f} missing`);
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}

const species = load('species.json');
const spots = load('spots.json');
const rules = load('rules.json');
const zones = load('zones.geojson');
const gauges = load('gauges.json');
const water = load('water.json');
const advice = load('advice.json');

// meta blocks
for (const [name, obj] of [['species', species], ['spots', spots], ['rules', rules], ['zones', zones], ['gauges', gauges], ['water', water], ['advice', advice]] as const)
  need(obj.meta?.generated_at && Array.isArray(obj.meta?.sources) && obj.meta?.license, `${name}: meta{generated_at,sources[],license}`);

// species
const ids = new Set<string>();
for (const s of species.items) {
  ids.add(s.id);
  problems.push(...validateSpecies(s, `species/${s.id}`));
  need(!!s.photo && !!s.photo.license && !!s.photo.author && !!s.photo.source_url, `species/${s.id}: licensed photo with author + source`);
  if (s.photo && !s.photo.url.startsWith('http')) need(existsSync(`public/${s.photo.url}`), `species/${s.id}: thumbnail file ${s.photo.url} missing`);
  if (s.status.legal !== 'banned') need(s.methods.some((m: any) => m.baits.length || m.lures.length), `species/${s.id}: no baits/lures in any method`);
  // rules_ref resolved against rules.json
  const min = rules.min_size_cm[s.id] ?? null;
  need((s.rules_ref.min_size_cm ?? null) === min, `species/${s.id}: rules_ref.min_size_cm ${s.rules_ref.min_size_cm} ≠ rules.json ${min}`);
  const lim = rules.daily_limits.find((l: any) => l.species_id === s.id)?.limit ?? null;
  const banned = rules.banned_species.some((b: any) => b.id === s.id);
  if (!banned) need((s.rules_ref.daily_limit ?? null) === lim, `species/${s.id}: rules_ref.daily_limit "${s.rules_ref.daily_limit}" ≠ rules.json "${lim}"`);
  need(banned === (s.status.legal === 'banned'), `species/${s.id}: legal status disagrees with rules.banned_species`);
}
need(species.items.length >= 25, `species count ${species.items.length} < 25`);

// spots
const waterIds = new Set(water.features.map((f: any) => f.properties.osm_id));
for (const s of spots.items) {
  problems.push(...validateSpot(s, `spots/${s.id}`, ids));
  const dist = distanceKm(CENTER, s.coords);
  need(dist <= RADIUS_KM, `spots/${s.id}: ${dist.toFixed(0)} km from Omsk > ${RADIUS_KM}`);
  need(s.water_osm_id != null && waterIds.has(s.water_osm_id), `spots/${s.id}: water_osm_id not resolved`);
  need(typeof s.drive_min === 'number', `spots/${s.id}: drive_min missing`);
  need(s.species.length >= 1, `spots/${s.id}: no species`);
  need([0, 1, 2, 3].includes(s.confidence), `spots/${s.id}: confidence`);
  // ≤ 300 m from that water feature
  const wf = water.features.find((f: any) => f.properties.osm_id === s.water_osm_id);
  if (wf) {
    const pt = turf.point(s.coords);
    let d = Infinity;
    const g = wf.geometry;
    if (g.type === 'Polygon' || g.type === 'MultiPolygon') {
      if (turf.booleanPointInPolygon(pt, wf)) d = 0;
      else {
        const lines = turf.polygonToLine(wf);
        const feats = lines.type === 'FeatureCollection' ? lines.features : [lines];
        for (const l of feats) for (const one of turf.flatten(l as any).features) d = Math.min(d, turf.nearestPointOnLine(one as any, pt, { units: 'meters' }).properties.dist ?? Infinity);
      }
    } else for (const one of turf.flatten(wf).features) d = Math.min(d, turf.nearestPointOnLine(one as any, pt, { units: 'meters' }).properties.dist ?? Infinity);
    need(d <= 300, `spots/${s.id}: ${Math.round(d)} m from its water feature`);
  }
}
need(spots.items.length >= 40, `spots count ${spots.items.length} < 40`);
const paid = spots.items.filter((s: any) => s.type === 'платник').length;
if (paid < 6) warn.push(`paid ponds: ${paid} (brief asks 6–10)`);
if (spots.items.filter((s: any) => s.ice_spot).length < 10) warn.push('fewer than 10 ice spots');

// rules
need(/^\d{4}-\d{2}-\d{2}$/.test(rules.edition_date), 'rules.edition_date');
need(/^https?:\/\//.test(rules.source_url), 'rules.source_url');
need(rules.spawning_bans.length >= 2 && rules.spawning_bans.every((w: any) => /^\d\d-\d\d$/.test(w.from) && /^\d\d-\d\d$/.test(w.to)), 'rules.spawning_bans dates');

// zones
for (const z of zones.features) need(/^\d\d-\d\d$/.test(z.properties.active_from) && /^\d\d-\d\d$/.test(z.properties.active_to) && !!z.properties.name, `zone ${z.properties.id}: dates/name`);
need(zones.features.length >= 20, `zones count ${zones.features.length}`);

// gauges
for (const g of gauges.items) need('measured_at' in g, `gauge ${g.id}: measured_at`);
need(Array.isArray(gauges.ice) && gauges.ice.length >= 1, 'gauges.ice[]');

// advice
need(advice.checklists.length >= 10 && advice.sections.length >= 12, 'advice: checklists ≥ 10, sections ≥ 12');

// payload
let total = 0;
for (const f of readdirSync(D)) total += statSync(`${D}/${f}`).size;
if (existsSync('public/img/species')) for (const f of readdirSync('public/img/species')) total += statSync(`public/img/species/${f}`).size;
need(total < 6 * 1024 * 1024, `payload ${(total / 1048576).toFixed(2)} MB ≥ 6 MB`);

if (warn.length) console.warn('warnings:\n' + warn.join('\n'));
if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\nQA failed: ${problems.length} problems`);
  process.exit(1);
}
console.log(`QA ok: ${species.items.length} species, ${spots.items.length} spots (${paid} paid), ${zones.features.length} zones, payload ${(total / 1048576).toFixed(2)} MB`);
