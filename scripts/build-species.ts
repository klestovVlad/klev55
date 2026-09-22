/**
 * Assemble public/data/species.json from content/species/*.json and attach a
 * licensed photo per species: Wikidata P18 → Commons (license from extmetadata),
 * fallback iNaturalist taxon default photo (CC only). Thumbnails → public/img/species/<id>.webp (400 px).
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import sharp from 'sharp';
import { cachedFetch } from './lib/cache';
import { validateSpecies } from './validate-species';
import type { Species, SpeciesPhoto } from '../src/data/types';

const OUT = 'public/data';
const IMG = 'public/img/species';
const PERMISSIVE = /^(CC0|CC BY|CC BY-SA|CC BY-NC|CC BY-NC-SA|Public domain|PD)/i;
// Alternative scientific names for Wikidata lookup when the primary name has no usable image.
const ALT_NAMES: Record<string, string[]> = { 'stenodus-leucichthys': ['Stenodus nelma', 'Stenodus leucichthys nelma'], 'carassius-gibelio': ['Carassius auratus gibelio'] };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

async function wikidataQid(lat: string): Promise<string | null> {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(lat)}&language=en&type=item&format=json&limit=5`;
  const j = JSON.parse(await cachedFetch(url, { label: 'wikidata search' }));
  const hit = (j.search ?? []).find((s: any) => /taxon|species|fish/i.test(s.description ?? '') || s.label?.toLowerCase() === lat.toLowerCase());
  return hit?.id ?? j.search?.[0]?.id ?? null;
}

async function commonsPhoto(qid: string): Promise<SpeciesPhoto | null> {
  const ent = JSON.parse(await cachedFetch(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`, { label: 'wikidata entity' }));
  const claims = ent.entities?.[qid]?.claims ?? {};
  const file: string | undefined = claims.P18?.[0]?.mainsnak?.datavalue?.value;
  if (!file) return null;
  const title = 'File:' + file;
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=extmetadata|url&iiurlwidth=800&format=json`;
  const j = JSON.parse(await cachedFetch(url, { label: 'commons imageinfo' }));
  const page: any = Object.values(j.query?.pages ?? {})[0];
  const ii = page?.imageinfo?.[0];
  if (!ii) return null;
  const meta = ii.extmetadata ?? {};
  const license = stripHtml(meta.LicenseShortName?.value ?? '');
  if (!PERMISSIVE.test(license)) return null;
  const artist = stripHtml(meta.Artist?.value ?? '') || 'автор не указан (см. страницу файла)';
  return {
    url: ii.thumburl ?? ii.url,
    author: artist,
    license,
    license_url: meta.LicenseUrl?.value,
    source: 'Wikimedia Commons',
    source_url: ii.descriptionurl,
    nc: /NC/i.test(license) ? true : undefined,
  };
}

async function inatPhoto(lat: string): Promise<SpeciesPhoto | null> {
  const url = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(lat)}&rank=species&locale=ru&per_page=3`;
  const j = JSON.parse(await cachedFetch(url, { label: 'inat taxa' }));
  const taxon = (j.results ?? []).find((t: any) => t.name?.toLowerCase() === lat.toLowerCase()) ?? j.results?.[0];
  const p = taxon?.default_photo;
  if (!p || !p.license_code || !/^cc/.test(p.license_code)) return null;
  const license = p.license_code.toUpperCase().replace('CC-', 'CC ').replace(/-/g, '-');
  return {
    url: p.medium_url ?? p.url,
    author: stripHtml(p.attribution ?? '').replace(/^\(c\)\s*/i, '').replace(/,?\s*some rights reserved.*$/i, '') || 'iNaturalist user',
    license: license === 'CC0' ? 'CC0' : license,
    source: 'iNaturalist',
    source_url: `https://www.inaturalist.org/taxa/${taxon.id}`,
    nc: /NC/i.test(license) ? true : undefined,
  };
}

async function thumbnail(id: string, remoteUrl: string): Promise<string | null> {
  mkdirSync(IMG, { recursive: true });
  const file = `${IMG}/${id}.webp`;
  if (existsSync(file)) return `img/species/${id}.webp`;
  try {
    const res = await fetch(remoteUrl, { headers: { 'User-Agent': 'klev55-data-build/0.1 (fishing atlas)' } });
    if (!res.ok) throw new Error(String(res.status));
    const buf = Buffer.from(await res.arrayBuffer());
    await sharp(buf).resize({ width: 400, height: 300, fit: 'cover', position: 'attention' }).webp({ quality: 78 }).toFile(file);
    return `img/species/${id}.webp`;
  } catch (e) {
    console.warn(`  thumbnail failed for ${id}: ${(e as Error).message}`);
    return null;
  }
}

async function main() {
  const dir = 'content/species';
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  const items: Species[] = [];
  let errors = 0;
  for (const f of files) {
    const s: Species = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
    const errs = validateSpecies(s, f);
    if (errs.length) {
      errors++;
      console.error(errs.join('\n'));
    }
    if (!s.photo) {
      let photo: SpeciesPhoto | null = null;
      try {
        for (const name of [s.names.lat, ...(ALT_NAMES[s.id] ?? [])]) {
          await sleep(1200); // Wikidata rate limit
          const qid = await wikidataQid(name);
          if (qid) photo = await commonsPhoto(qid);
          if (photo) break;
        }
        if (!photo) photo = await inatPhoto(s.names.lat);
      } catch (e) {
        console.warn(`  photo lookup failed for ${s.id}: ${(e as Error).message}`);
      }
      if (photo) {
        const local = await thumbnail(s.id, photo.url);
        if (local) photo.url = local;
        s.photo = photo;
        s.provenance.photo = 'reference';
      }
      console.log(`${s.id}: photo ${photo ? photo.source + ' / ' + photo.license : 'NONE'}`);
    }
    items.push(s);
  }
  if (errors) {
    console.error(`${errors} species files invalid`);
    process.exit(1);
  }
  items.sort((a, b) => a.names.ru.localeCompare(b.names.ru, 'ru'));
  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    `${OUT}/species.json`,
    JSON.stringify({
      meta: {
        generated_at: new Date().toISOString(),
        sources: ['Экспертная модель (generated)', 'Приказ Минсельхоза № 646 (official)', 'Роспотребнадзор ЦГОН (описторхоз)', 'Wikimedia Commons / iNaturalist (фото, лицензии по каждому фото)'],
        license: 'Тексты CC BY-SA 4.0; фото — по лицензии каждого файла',
      },
      items,
    }),
  );
  console.log(`species.json: ${items.length} species`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
