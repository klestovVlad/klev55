/**
 * Gear glossary → public/data/gear.json with a free photo per card from Wikimedia Commons
 * (search by `commons_search`, first file with a permissive license), thumbnails → public/img/gear/<id>.webp.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import sharp from 'sharp';
import { cachedFetch } from './lib/cache';
import type { GearFile, SpeciesPhoto } from '../src/data/types';

const OUT = 'public/data';
// Blind Commons search is unreliable; photos are kept only for cards where the hit was checked by eye.
const PHOTO_OK = new Set(['koleblyalka', 'vobler', 'motyl', 'oparysh', 'rucheynik', 'koroed', 'gorokh', 'perlovka', 'kukuruza', 'mormysh', 'spinning', 'zimnyaya-udochka', 'cherv']);
const IMG = 'public/img/gear';
const PERMISSIVE = /^(CC0|CC BY|CC BY-SA|Public domain|PD)/i;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const strip = (s: string) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
// Extra search phrases per card (Commons search is literal; several phrasings raise the hit rate).
const ALT: Record<string, string[]> = {
  vertushka: ['Mepps spinner lure', 'inline spinner fishing lure', 'spinnerbait'],
  dzhig: ['jig head', 'soft plastic lure twister', 'jighead fishing'],
  porolonka: ['foam fish lure', 'jig lure fishing'],
  balansir: ['balance lure ice fishing', 'ice fishing lure', 'Rapala Jigging Rap'],
  'vertikalnaya-blesna': ['vertical jigging spoon', 'ice fishing spoon lure', 'jigging spoon'],
  mormyshka: ['mormyshka', 'ice fishing jig', 'мормышка'],
  bezmotylka: ['mormyshka', 'ice jig lure small'],
  zhivets: ['live bait minnow hook', 'baitfish on hook', 'minnow bait'],
  boyl: ['boilies', 'boilie', 'carp bait boilies'],
  pellets: ['fishing pellets bait', 'trout pellets', 'halibut pellets'],
  tekhnoplankton: ['technoplankton', 'silver carp bait'],
  motyl: ['Chironomidae larva', 'bloodworm larvae', 'chironomid larvae'],
  rucheynik: ['caddisfly larva case', 'Trichoptera larva', 'caddis larva'],
  koroed: ['bark beetle larva', 'Cerambycidae larva', 'beetle larvae'],
  gorokh: ['dry peas', 'Pisum sativum seeds', 'boiled peas'],
  perlovka: ['pearl barley', 'barley groats', 'cooked pearl barley'],
  kukuruza: ['sweet corn kernels', 'canned corn', 'corn kernels bowl'],
  testo: ['dough bait', 'bread dough ball', 'fishing dough'],
  khleb: ['bread crumb', 'white bread slice', 'bread'],
  paternoster: ['paternoster rig', 'feeder rig', 'fishing rig diagram'],
  inlayn: ['inline feeder', 'method feeder', 'feeder fishing'],
  'asimmetrichnaya-petlya': ['feeder rig', 'fishing rig loop', 'feeder fishing rig'],
  'otvodnoy-povodok': ['Carolina rig', 'drop shot rig', 'split shot rig fishing'],
  'drop-shot': ['drop shot rig', 'drop shot fishing', 'dropshot'],
  koltso: ['fishing sinker ring', 'bream fishing boat feeder', 'fishing weight ring'],
  postavushka: ['tip-up ice fishing', 'ice fishing tip up', 'tip-up'],
  zakidushka: ['handline fishing', 'fishing handline', 'donka fishing'],
  pruzhina: ['spring feeder fishing', 'method feeder', 'coil feeder'],
  'skolzyashchiy-poplavok': ['waggler float', 'fishing float', 'slider float fishing'],
  fider: ['feeder rod fishing', 'feeder fishing', 'quivertip rod'],
  'bolonskaya-udochka': ['bolognese rod', 'float fishing rod', 'telescopic fishing rod'],
  'makhovaya-udochka': ['pole fishing', 'whip pole fishing', 'fishing pole float'],
  zherlitsa: ['tip-up ice fishing', 'ice fishing tip-up flag', 'zherlitsa'],
};

async function commonsSearch(term: string): Promise<SpeciesPhoto | null> {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(term + ' filetype:bitmap')}&gsrnamespace=6&gsrlimit=20&prop=imageinfo&iiprop=extmetadata|url|mime&iiurlwidth=800&format=json`;
  const j = JSON.parse(await cachedFetch(url, { label: `commons ${term}`, ttlHours: 24 * 30 }));
  const pages: any[] = Object.values(j.query?.pages ?? {});
  pages.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    if (!ii || !/^image\/(jpeg|png|webp)$/.test(ii.mime ?? '')) continue;
    const meta = ii.extmetadata ?? {};
    const license = strip(meta.LicenseShortName?.value ?? '');
    if (!PERMISSIVE.test(license)) continue;
    return {
      url: ii.thumburl ?? ii.url,
      author: strip(meta.Artist?.value ?? '') || 'автор не указан (см. страницу файла)',
      license,
      license_url: meta.LicenseUrl?.value,
      source: 'Wikimedia Commons',
      source_url: ii.descriptionurl,
    };
  }
  return null;
}

async function thumb(id: string, remote: string): Promise<string | null> {
  mkdirSync(IMG, { recursive: true });
  const file = `${IMG}/${id}.webp`;
  if (existsSync(file)) return `img/gear/${id}.webp`;
  try {
    const res = await fetch(remote, { headers: { 'User-Agent': 'klev55-data-build/0.1 (fishing atlas)' } });
    if (!res.ok) throw new Error(String(res.status));
    await sharp(Buffer.from(await res.arrayBuffer())).resize({ width: 480, height: 320, fit: 'cover', position: 'attention' }).webp({ quality: 78 }).toFile(file);
    return `img/gear/${id}.webp`;
  } catch (e) {
    console.warn(`  thumb failed ${id}: ${(e as Error).message}`);
    return null;
  }
}

async function main() {
  const gear: GearFile = JSON.parse(readFileSync('content/gear.json', 'utf8'));
  const speciesIds = new Set(JSON.parse(readFileSync(`${OUT}/species-index.json`, 'utf8')).items.map((s: any) => s.id));
  let missing = 0;
  for (const g of gear.items) {
    for (const sid of g.species) if (!speciesIds.has(sid)) throw new Error(`${g.id}: unknown species ${sid}`);
    if (existsSync(`public/img/gear-svg/${g.id}.svg`)) g.illustration = `img/gear-svg/${g.id}.svg`;
    if (!PHOTO_OK.has(g.id)) g.photo = null;
    if (!g.photo && PHOTO_OK.has(g.id)) {
      for (const term of [g.commons_search, ...(ALT[g.id] ?? [])].filter((t): t is string => !!t)) {
        await sleep(1200);
        try {
          const p = await commonsSearch(term);
          if (p) {
            const local = await thumb(g.id, p.url);
            if (local) p.url = local;
            g.photo = p;
            break;
          }
        } catch (e) {
          console.warn(`  ${g.id}: ${(e as Error).message}`);
        }
      }
    }
    if (!g.photo && !g.illustration) missing++;
    console.log(`${g.id}: ${g.photo ? 'photo ' + g.photo.license : ''}${g.illustration ? ' + scheme' : ''}${!g.photo && !g.illustration ? 'NOTHING' : ''}`);
  }
  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/gear.json`, JSON.stringify({ ...gear, meta: { ...gear.meta, generated_at: new Date().toISOString(), sources: [...gear.meta.sources, 'Wikimedia Commons (фото, лицензии по каждому файлу)'] } }));
  console.log(`gear.json: ${gear.items.length} cards, ${missing} without any image`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
