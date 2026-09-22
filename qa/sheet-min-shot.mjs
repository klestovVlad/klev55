import { chromium } from '@playwright/test';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
await page.goto('http://localhost:5173/');
await page.waitForSelector('.rows .row-btn', { timeout: 30000 });
await page.waitForTimeout(6000);
const grip = page.locator('.sheet__grip');
for (let i = 0; i < 3; i++) { await grip.click(); await page.waitForTimeout(350); }
await page.waitForTimeout(500);
console.log(JSON.stringify(await page.evaluate(() => ({ h: document.querySelector('.sheet').getBoundingClientRect().height, v: getComputedStyle(document.querySelector('.mapscreen')).getPropertyValue('--sheet-h') }))));
await page.screenshot({ path: 'qa/screenshots/sheet-min-mobile.png' });
await browser.close();
