import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(process.cwd(), 'scripts', '.cache');

export function cacheKey(s: string): string {
  return createHash('sha1').update(s).digest('hex').slice(0, 16);
}

export function isCached(url: string, body = '', ttlHours = 24 * 7): boolean {
  const file = join(DIR, cacheKey(url + '|' + body) + '.txt');
  return existsSync(file) && Date.now() - statSync(file).mtimeMs < ttlHours * 3600 * 1000;
}

/** Fetch text with an on-disk cache (default TTL 7 days). Retries twice with backoff. */
export async function cachedFetch(
  url: string,
  opts: { method?: string; body?: string; headers?: Record<string, string>; ttlHours?: number; label?: string } = {},
): Promise<string> {
  mkdirSync(DIR, { recursive: true });
  const key = cacheKey(url + '|' + (opts.body ?? ''));
  const file = join(DIR, key + '.txt');
  const ttl = (opts.ttlHours ?? 24 * 7) * 3600 * 1000;
  if (existsSync(file) && Date.now() - statSync(file).mtimeMs < ttl) {
    return readFileSync(file, 'utf8');
  }
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: opts.method ?? 'GET',
        body: opts.body,
        headers: { 'User-Agent': 'klev55-data-build/0.1 (fishing atlas; contact via repo)', ...(opts.headers ?? {}) },
        signal: AbortSignal.timeout(180_000),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${opts.label ?? url}`);
      const text = await res.text();
      writeFileSync(file, text);
      return text;
    } catch (e) {
      lastErr = e;
      const wait = 5000 * (attempt + 1);
      console.warn(`  retry ${attempt + 1} after error: ${(e as Error).message}; waiting ${wait / 1000}s`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}
