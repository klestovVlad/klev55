/** Re-fetch only live sources (hydro/ice, gauges, observations). Run daily by CI. */
import { execSync } from 'node:child_process';
for (const s of ['scripts/build-hydro.ts', 'scripts/build-observations.ts']) {
  console.log('▸', s);
  execSync(`npx tsx ${s}`, { stdio: 'inherit' });
}
