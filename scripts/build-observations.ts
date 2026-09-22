/** GBIF + iNaturalist fish occurrences inside the circle → public/data/observations.geojson (thinned). */
import { writeFileSync, mkdirSync } from 'node:fs';
import { cachedFetch } from './lib/cache';
import { circleBbox, insideCircle } from './lib/geo';

const OUT = 'public/data';
// GBIF backbone has no Actinopterygii class key; fish orders instead (see research/SOURCES.md).
const GBIF_ORDERS = [587, 1153, 548, 1313, 708, 1152, 1067]; // Perciformes, Cypriniformes, Esociformes, Salmoniformes, Gadiformes, Acipenseriformes, Siluriformes
const [w, s, e, n] = circleBbox();
const poly = `POLYGON((${w} ${s},${e} ${s},${e} ${n},${w} ${n},${w} ${s}))`;

async function gbif() {
  const feats: any[] = [];
  for (const order of GBIF_ORDERS) {
    let offset = 0;
    for (;;) {
      const url = `https://api.gbif.org/v1/occurrence/search?orderKey=${order}&geometry=${encodeURIComponent(poly)}&hasCoordinate=true&limit=300&offset=${offset}`;
      const j = JSON.parse(await cachedFetch(url, { label: `gbif order ${order}`, ttlHours: 24 * 7 }));
      for (const r of j.results ?? []) {
        const c: [number, number] = [r.decimalLongitude, r.decimalLatitude];
        if (!insideCircle(c)) continue;
        feats.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [Math.round(c[0] * 1e4) / 1e4, Math.round(c[1] * 1e4) / 1e4] },
          properties: {
            src: 'GBIF',
            species: r.species ?? r.scientificName,
            date: r.eventDate?.slice(0, 10) ?? (r.year ? String(r.year) : null),
            license: r.license ?? null,
            dataset: r.datasetName ?? null,
            url: `https://www.gbif.org/occurrence/${r.key}`,
          },
        });
      }
      if (j.endOfRecords || (j.results?.length ?? 0) < 300) break;
      offset += 300;
    }
  }
  return feats;
}

async function inat() {
  const feats: any[] = [];
  for (let page = 1; page <= 5; page++) {
    const url = `https://api.inaturalist.org/v1/observations?taxon_id=47178&nelat=${n}&nelng=${e}&swlat=${s}&swlng=${w}&quality_grade=research&per_page=200&page=${page}&locale=ru&license=cc0,cc-by,cc-by-nc,cc-by-sa`;
    const j = JSON.parse(await cachedFetch(url, { label: `inat p${page}`, ttlHours: 24 * 7 }));
    for (const r of j.results ?? []) {
      const loc = (r.location ?? '').split(',').map(Number);
      if (loc.length !== 2 || Number.isNaN(loc[0])) continue;
      const c: [number, number] = [loc[1], loc[0]];
      if (!insideCircle(c)) continue;
      feats.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [Math.round(c[0] * 1e4) / 1e4, Math.round(c[1] * 1e4) / 1e4] },
        properties: {
          src: 'iNaturalist',
          species: r.taxon?.name ?? null,
          species_ru: r.taxon?.preferred_common_name ?? null,
          date: r.observed_on ?? null,
          license: r.license_code ?? null,
          user: r.user?.login ?? null,
          url: r.uri ?? `https://www.inaturalist.org/observations/${r.id}`,
        },
      });
    }
    if ((j.results?.length ?? 0) < 200) break;
  }
  return feats;
}

async function main() {
  const [g, i] = await Promise.all([gbif(), inat()]);
  // Thin: one point per species per 0.01° cell.
  const seen = new Set<string>();
  const features = [...i, ...g].filter((f) => {
    const [x, y] = f.geometry.coordinates;
    const k = `${f.properties.species}|${x.toFixed(2)}|${y.toFixed(2)}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    `${OUT}/observations.geojson`,
    JSON.stringify({
      type: 'FeatureCollection',
      meta: { generated_at: new Date().toISOString(), sources: ['GBIF occurrence API', 'iNaturalist API (research grade, CC)'], license: 'Per record (CC0 / CC BY / CC BY-NC); see properties.license' },
      features,
    }),
  );
  console.log(`observations.geojson: ${features.length} points (gbif ${g.length}, inat ${i.length} before thinning)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
