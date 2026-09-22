/** Orchestrates the full data build → public/data. Run: npm run data:build */
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, statSync, readdirSync } from 'node:fs';

const steps: [string, string][] = [
  ['water & infra (OSM)', 'scripts/build-water.ts'],
  ['infra (OSM)', 'scripts/build-infra.ts'],
  ['rules & zones', 'scripts/build-rules.ts'],
  ['hydro & ice', 'scripts/build-hydro.ts'],
  ['observations', 'scripts/build-observations.ts'],
  ['species (+photos)', 'scripts/build-species.ts'],
  ['spots', 'scripts/build-spots.ts'],
  ['gear glossary (+photos)', 'scripts/build-gear.ts'],
];
const only = process.argv.slice(2);
for (const [name, script] of steps) {
  if (only.length && !only.some((o) => script.includes(o))) continue;
  if (script.includes('build-water') && existsSync('public/data/water.json') && !only.length) {
    console.log(`▸ ${name}: water.json exists, skipping (pass "water" to force)`);
    continue;
  }
  console.log(`▸ ${name}`);
  execSync(`npx tsx ${script}`, { stdio: 'inherit' });
}
copyFileSync('content/advice.json', 'public/data/advice.json');
console.log('▸ advice.json copied');
let total = 0;
for (const f of readdirSync('public/data')) total += statSync(`public/data/${f}`).size;
if (existsSync('public/img/species')) for (const f of readdirSync('public/img/species')) total += statSync(`public/img/species/${f}`).size;
console.log(`total payload: ${(total / 1024 / 1024).toFixed(2)} MB (budget 6 MB)`);
