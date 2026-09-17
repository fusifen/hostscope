import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import sharp from 'sharp';
import { SITE, CATEGORIES } from '../../consts';

/**
 * Build-time Open Graph image generator.
 *
 * Astro prerenders one PNG per entry in getStaticPaths(). We compose an SVG
 * from the page's own title and metadata, then rasterise it with sharp — so
 * every article, plan and comparison page gets a bespoke social card with zero
 * design work and no runtime cost.
 */

interface OgEntry {
  slug: string;
  eyebrow: string;
  title: string;
  meta: string;
  accent: string;
}

/** Rough word-wrap — SVG has no automatic text wrapping. */
function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);

  if (lines.length === maxLines) {
    const last = lines[maxLines - 1];
    const consumed = lines.join(' ').length;
    if (consumed < text.length - 2) {
      lines[maxLines - 1] = `${last.replace(/[,.;:]$/, '')}…`;
    }
  }
  return lines;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildSvg(entry: OgEntry): string {
  const titleLines = wrap(entry.title, 25, 3);
  const titleSize = titleLines.length >= 3 ? 58 : titleLines.length === 2 ? 70 : 80;
  // First baseline is fixed so the headline never collides with the eyebrow
  // pill above it, regardless of how many lines the title wraps to.
  const titleStartY = 302;
  const lineHeight = titleSize * 1.16;

  const titleTspans = titleLines
    .map(
      (line, i) =>
        `<tspan x="86" y="${Math.round(titleStartY + i * lineHeight)}">${escapeXml(line)}</tspan>`,
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0A0F1E"/>
      <stop offset="1" stop-color="#1B0D47"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${entry.accent}"/>
      <stop offset="1" stop-color="#10B981"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.78" cy="0.16" r="0.6">
      <stop offset="0" stop-color="#673DE6" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#673DE6" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="46" height="46" patternUnits="userSpaceOnUse">
      <path d="M46 0H0V46" fill="none" stroke="#ffffff" stroke-opacity="0.055" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <rect x="0" y="0" width="1200" height="8" fill="url(#accent)"/>

  <!-- Brand lockup -->
  <g transform="translate(86, 74)">
    <rect width="52" height="52" rx="14" fill="url(#accent)"/>
    <path d="M14.3 35.8V16.2h6v7h7.9v-7h6v19.6h-6v-7.4h-7.9v7.4h-6Z" fill="#ffffff"/>
    <text x="70" y="24" font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif" font-size="23" font-weight="800" fill="#ffffff" letter-spacing="-0.4">HostScope</text>
    <text x="70" y="45" font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif" font-size="13" font-weight="600" fill="#B9A5F7" letter-spacing="2.4">HOSTINGER RESEARCH</text>
  </g>

  <!-- Eyebrow pill -->
  <g transform="translate(86, 190)">
    <rect width="${Math.max(150, entry.eyebrow.length * 13 + 44)}" height="40" rx="20" fill="#ffffff" fill-opacity="0.1" stroke="#ffffff" stroke-opacity="0.22"/>
    <text x="22" y="26" font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif" font-size="16" font-weight="700" fill="#D7CBFB" letter-spacing="1.6">${escapeXml(
      entry.eyebrow.toUpperCase(),
    )}</text>
  </g>

  <!-- Headline -->
  <text font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif" font-size="${titleSize}" font-weight="800" fill="#ffffff" letter-spacing="-2.2">${titleTspans}</text>

  <!-- Meta line -->
  <text x="86" y="546" font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif" font-size="22" font-weight="600" fill="#8590AC">${escapeXml(
    entry.meta,
  )}</text>

  <!-- Price badge -->
  <g transform="translate(944, 498)">
    <rect width="170" height="76" rx="18" fill="#ffffff" fill-opacity="0.08" stroke="#ffffff" stroke-opacity="0.2"/>
    <text x="85" y="30" text-anchor="middle" font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif" font-size="13" font-weight="700" fill="#A7F3D0" letter-spacing="1.4">FROM</text>
    <text x="85" y="58" text-anchor="middle" font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif" font-size="27" font-weight="800" fill="#ffffff">$2.99/mo</text>
  </g>
</svg>`;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const plans = await getCollection('plans');
  const articles = (await getCollection('articles')).filter((a) => !a.data.draft);
  const comparisons = await getCollection('comparisons');

  const entries: OgEntry[] = [
    {
      slug: 'default',
      eyebrow: 'Hostinger research',
      title: 'Hostinger, minus the marketing',
      meta: 'Real prices, real limits, renewal rates included',
      accent: '#673DE6',
    },
    {
      slug: 'pricing',
      eyebrow: 'Live pricing',
      title: 'Every Hostinger plan, one honest matrix',
      meta: 'Intro price, upfront total and renewal rate',
      accent: '#673DE6',
    },
    {
      slug: 'coupons',
      eyebrow: 'Deals',
      title: 'Current Hostinger deals, ranked',
      meta: 'Verified promo pricing with renewal rates',
      accent: '#10B981',
    },
    ...plans.map((plan) => ({
      slug: `plans-${plan.id}`,
      eyebrow: `Hostinger ${plan.data.name}`,
      title: `${plan.data.name} review and pricing`,
      meta: `${plan.data.specs.cpuCores} core(s) · ${plan.data.specs.ram} RAM · ${plan.data.specs.storage} ${plan.data.specs.storageType}`,
      accent: '#673DE6',
    })),
    ...articles.map((article) => ({
      slug: `blog-${article.id}`,
      eyebrow:
        CATEGORIES[article.data.category as keyof typeof CATEGORIES]?.label ?? article.data.category,
      title: article.data.title,
      meta: `${article.data.readingTime ?? 9} min read · prices verified ${SITE.pricingVerified}`,
      accent: '#7C52E8',
    })),
    ...comparisons.map((comparison) => ({
      slug: `compare-${comparison.id}`,
      eyebrow: 'Head to head',
      title: comparison.data.title,
      meta: `${comparison.data.rows.length} comparison points · winner: ${comparison.data.winner}`,
      accent: '#0E7490',
    })),
  ];

  return entries.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { entry } = props as { entry: OgEntry };
  const svg = buildSvg(entry);
  const png = await sharp(Buffer.from(svg), { density: 144 })
    .resize(1200, 630)
    .png({ compressionLevel: 9 })
    .toBuffer();

  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
