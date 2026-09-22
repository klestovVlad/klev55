// MapLibre's module worker imports ./maplibre-gl-shared.mjs by relative path, so both files must sit
// side by side at a stable URL. Copied into public/maplibre on predev/prebuild (gitignored).
import { copyFileSync, mkdirSync } from 'node:fs';
mkdirSync('public/maplibre', { recursive: true });
for (const f of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) copyFileSync(`node_modules/maplibre-gl/dist/${f}`, `public/maplibre/${f}`);
console.log('maplibre worker copied');
