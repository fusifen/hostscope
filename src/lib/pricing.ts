/**
 * Price formatting and discount maths.
 * All prices on the site are stored as plain numbers in USD so that the
 * components can recalculate savings, effective monthly rates and multi-year
 * totals without ever hard-coding a percentage.
 */

export function usd(amount: number, opts: { decimals?: number } = {}): string {
  const decimals = opts.decimals ?? (Number.isInteger(amount) ? 0 : 2);
  return `$${amount.toFixed(decimals)}`;
}

/** "$2.99" — the price you actually pay per month during the promo term. */
export function perMonth(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/** Whole-dollar prices read better without cents in dense tables. */
export function compactUsd(amount: number): string {
  return Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`;
}

/** Percentage saved, rounded to a whole number (Hostinger-style "75% off"). */
export function discountPercent(regular: number, promo: number): number {
  if (!regular || regular <= 0) return 0;
  return Math.round(((regular - promo) / regular) * 100);
}

export function discountLabel(regular: number, promo: number): string {
  return `Save ${discountPercent(regular, promo)}%`;
}

/** Total paid upfront for the whole term. */
export function termTotal(monthly: number, months: number): number {
  return Math.round(monthly * months * 100) / 100;
}

/**
 * The real average cost per month once you blend the discounted first term
 * with the renewal term. This is the number most review sites hide — we show
 * it on plan pages because it's what you actually pay.
 */
export function blendedMonthly(
  promoMonthly: number,
  renewalMonthly: number,
  promoMonths: number,
  renewalMonths: number,
): number {
  const total = promoMonthly * promoMonths + renewalMonthly * renewalMonths;
  return Math.round((total / (promoMonths + renewalMonths)) * 100) / 100;
}

/** How much more expensive renewal is, as a percentage. */
export function renewalIncrease(promoMonthly: number, renewalMonthly: number): number {
  if (!promoMonthly) return 0;
  return Math.round(((renewalMonthly - promoMonthly) / promoMonthly) * 100);
}

export function formatDate(date: Date, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatDateShort(date: Date, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** ISO date string for <time datetime> and JSON-LD. */
export function isoDate(date: Date): string {
  return date.toISOString();
}

export function relativeDays(date: Date, now = new Date()): string {
  const days = Math.round((now.getTime() - date.getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  const years = Math.round(months / 12);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

/** Turn an arbitrary string into a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** "cloud-startup" → "Cloud Startup" (with brand-aware casing). */
export function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((part) =>
      ['vps', 'ssd', 'nvme', 'ssl', 'cdn', 'ai', 'kvm', 'php', 'dns', 'api', 'cpu', 'ram', 'og'].includes(
        part.toLowerCase(),
      )
        ? part.toUpperCase()
        : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(' ');
}

export function numberWithCommas(value: number): string {
  return value.toLocaleString('en-US');
}
