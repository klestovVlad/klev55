import { chromium } from '@playwright/test';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('console:', m.text().slice(0, 160)); });
page.on('pageerror', (e) => console.log('pageerror:', String(e).slice(0, 200)));
await page.goto(process.argv[2] ?? 'http://localhost:4173/');
await page.waitForSelector('.rows .row-btn', { timeout: 30000 });
await page.waitForTimeout(8000);
console.log(JSON.stringify(await page.evaluate(() => { const m = window.__map; return { hasMap: !!m, loaded: m?.loaded(), styleLoaded: m?.isStyleLoaded(), clusters: m?.getLayer('clusters') ? m.queryRenderedFeatures({ layers: ['clusters', 'spots'] }).length : -1 }; })));
// expand the sheet fully to check it stays inside the map area
await page.getByRole('button', { name: 'Развернуть панель' }).click();
await page.getByRole('button', { name: 'Развернуть панель' }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: 'qa/screenshots/prod-mobile-full-sheet.png' });
await browser.close();
