import { cachedFetch } from './cache';

// lz4 mirror has been the reliable one; the main host answers 504 "too busy" under load.
const ENDPOINTS = ['https://overpass.openstreetmap.fr/api/interpreter', 'https://lz4.overpass-api.de/api/interpreter', 'https://overpass-api.de/api/interpreter'];
let lastCall = 0;
const MIN_GAP_MS = 4000; // rate limit: 2 slots per IP; be polite

async function pace() {
  const wait = lastCall + MIN_GAP_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCall = Date.now();
}

export async function overpass(query: string, label = 'overpass', timeout = 180): Promise<any> {
  const q = `[out:json][timeout:${timeout}];\n${query}`;
  let lastErr: unknown;
  for (const ep of ENDPOINTS) {
    try {
      await pace();
      const text = await cachedFetch(ep, { method: 'POST', body: 'data=' + encodeURIComponent(q), label, ttlHours: 24 * 30 });
      const json = JSON.parse(text);
      if (json.remark && /runtime error/i.test(json.remark)) throw new Error(json.remark);
      return json;
    } catch (e) {
      lastErr = e;
      console.warn(`  ${label}: ${ep} failed: ${(e as Error).message}`);
    }
  }
  throw lastErr;
}

/** Split a bbox [minLon,minLat,maxLon,maxLat] into tiles of `step` degrees. Returns Overpass "s,w,n,e" strings. */
export function tiles(b: [number, number, number, number], step = 1): string[] {
  const out: string[] = [];
  for (let lat = b[1]; lat < b[3]; lat += step) {
    for (let lon = b[0]; lon < b[2]; lon += step) {
      const n = Math.min(lat + step, b[3]);
      const e = Math.min(lon + step, b[2]);
      out.push(`${lat.toFixed(3)},${lon.toFixed(3)},${n.toFixed(3)},${e.toFixed(3)}`);
    }
  }
  return out;
}

/** Run a bbox-parameterised query per tile and merge elements (dedup by type+id). */
export async function overpassTiled(
  makeQuery: (bbox: string) => string,
  b: [number, number, number, number],
  label: string,
  step = 1,
): Promise<{ elements: any[] }> {
  const seen = new Set<string>();
  const elements: any[] = [];
  const ts = tiles(b, step);
  let i = 0;
  for (const t of ts) {
    i++;
    const r = await overpass(makeQuery(t), `${label} ${i}/${ts.length}`);
    for (const el of r.elements ?? []) {
      const k = `${el.type}/${el.id}`;
      if (seen.has(k)) continue;
      seen.add(k);
      elements.push(el);
    }
  }
  return { elements };
}
