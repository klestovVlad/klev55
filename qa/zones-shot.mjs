import { chromium } from '@playwright/test';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'light' });
const page = await ctx.newPage();
await page.goto('http://localhost:5173/');
await page.waitForFunction(() => window.__map && window.__map.loaded(), null, { timeout: 30000 });
await page.getByRole('button', { name: 'Слои и фильтры' }).click();
await page.getByRole('button', { name: 'Ямы вне сезона' }).click();
await page.getByRole('button', { name: 'Слои и фильтры' }).click();
await page.evaluate(() => window.__map.jumpTo({ center: [73.53, 54.81], zoom: 11 })); // Падинская яма
await page.waitForTimeout(4000);
console.log(JSON.stringify(await page.evaluate(() => ({ fill: window.__map.queryRenderedFeatures({ layers: ['zones-all-fill'] }).length, label: window.__map.queryRenderedFeatures({ layers: ['zones-all-label'] }).length }))));
await page.screenshot({ path: 'qa/screenshots/zones-offseason-mobile.png' });
await browser.close();
