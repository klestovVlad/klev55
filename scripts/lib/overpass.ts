import { cachedFetch } from './cache';

const ENDPOINTS = ['https://lz4.overpass-api.de/api/interpreter', 'https://overpass-api.de/api/interpreter'];

export async function overpass(query: string, label = 'overpass'): Promise<any> {
  const q = `[out:json][timeout:900][maxsize:1073741824];\n${query}`;
  let lastErr: unknown;
  for (const ep of ENDPOINTS) {
    try {
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
