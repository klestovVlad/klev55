/** Generate PWA icons from an inline SVG. */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
const svg = (size: number) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}"><rect width="64" height="64" rx="14" fill="#173B4F"/><path d="M10 40c8-12 16-12 24 0s16 12 24 0" fill="none" stroke="#DCE8EE" stroke-width="4" stroke-linecap="round"/><circle cx="46" cy="22" r="5" fill="#D8821F"/></svg>`);
mkdirSync('public/icons', { recursive: true });
(async () => {
  for (const s of [192, 512]) await sharp(svg(s)).png().toFile(`public/icons/icon-${s}.png`);
  await sharp(svg(180)).png().toFile('public/icons/apple-touch-icon.png');
  console.log('icons ok');
})();
