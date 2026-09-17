import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';

const svg = readFileSync('public/images/brand/hostscope-logo.svg');

// Apple touch icon
writeFileSync(
  'public/images/brand/apple-touch-icon.png',
  await sharp(svg, { density: 300 }).resize(180, 180).png().toBuffer(),
);

// favicon.ico fallback (browsers accept PNG content in .ico)
writeFileSync(
  'public/favicon.ico',
  await sharp(svg, { density: 300 }).resize(32, 32).png().toBuffer(),
);

// High-resolution icon
writeFileSync(
  'public/images/brand/icon-512.png',
  await sharp(svg, { density: 300 }).resize(512, 512).png().toBuffer(),
);

console.log('icons generated');
