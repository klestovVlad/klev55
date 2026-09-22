import { chromium } from '@playwright/test';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'light' });
const page = await ctx.newPage();
await page.goto('http://localhost:5173/');
await page.waitForFunction(() => window.__map && window.__map.loaded(), null, { timeout: 30000 });
await page.evaluate(() => window.__map.jumpTo({ center: [73.37, 54.985], zoom: 11.6 })); // Красноярка: bridge, camps, spots
await page.waitForTimeout(5000);
console.log(JSON.stringify(await page.evaluate(() => ({ hasLayer: !!window.__map.getLayer('infra'), src: window.__map.querySourceFeatures('infra').length, infra: window.__map.queryRenderedFeatures({ layers: ['infra'] }).length, fuel: window.__map.queryRenderedFeatures({ layers: ['infra-fuel'] }).length }))));
await page.screenshot({ path: 'qa/screenshots/infra-mobile.png' });
await browser.close();
