// Icons, favicon and social preview from design/*.png. Run: node scripts/make-brand.mjs
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
mkdirSync('public/icons', { recursive: true });
const icon = 'design/icon-source.png';
const BG = { r: 13, g: 59, b: 46, alpha: 1 }; // icon's dark green, for platforms that forbid transparency
for (const s of [512, 192, 96, 64, 32]) await sharp(icon).resize(s, s).png().toFile(`public/icons/icon-${s}.png`);
// iOS: square, opaque, no rounded corners (iOS rounds itself).
await sharp(icon).resize(180, 180).flatten({ background: BG }).png().toFile('public/icons/apple-touch-icon.png');
// Maskable: art inside the 80 % safe zone on a solid background.
await sharp({ create: { width: 512, height: 512, channels: 4, background: BG } })
  .composite([{ input: await sharp(icon).resize(400, 400).toBuffer(), gravity: 'centre' }])
  .png().toFile('public/icons/icon-maskable-512.png');
await sharp(icon).resize(32, 32).png().toFile('public/favicon.png');
// Social preview 1200×630 (source is 1734×907 ≈ same ratio).
await sharp('design/og-source.png').resize(1200, 630, { fit: 'cover', position: 'centre' }).jpeg({ quality: 86, progressive: true }).toFile('public/og.jpg');
console.log('brand assets ok');
