// Lighthouse mobile audit against the preview server. Run: npm run build && npm run preview & npm run lighthouse
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { writeFileSync, mkdirSync } from 'node:fs';

const url = process.argv[2] ?? 'http://localhost:4173/';
const chrome = await launch({ chromeFlags: ['--headless=new', '--no-sandbox'] });
const result = await lighthouse(url, { port: chrome.port, output: 'json', onlyCategories: ['performance', 'accessibility', 'best-practices', 'pwa'], formFactor: 'mobile', screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 2, disabled: false }, throttlingMethod: 'simulate' });
await chrome.kill();
mkdirSync('qa', { recursive: true });
writeFileSync('qa/lighthouse.json', result.report);
const c = result.lhr.categories;
const line = Object.entries(c).map(([k, v]) => `${k}: ${Math.round((v.score ?? 0) * 100)}`).join(', ');
const fcp = result.lhr.audits['first-contentful-paint']?.displayValue;
const lcp = result.lhr.audits['largest-contentful-paint']?.displayValue;
console.log(`${line}; FCP ${fcp}; LCP ${lcp}`);
