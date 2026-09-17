import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/* -------------------------------------------------------------------------- */
/*  SHARED PRIMITIVES                                                         */
/* -------------------------------------------------------------------------- */

const faq = z.object({
  question: z.string(),
  answer: z.string(),
});

const seoFields = {
  /** Overrides the auto-generated <title> when set. */
  seoTitle: z.string().optional(),
  /** Overrides the auto-generated meta description when set. */
  seoDescription: z.string().optional(),
  /** Hide from search engines and the sitemap. */
  noindex: z.boolean().default(false),
};

/* -------------------------------------------------------------------------- */
/*  HOSTINGER PLANS                                                           */
/*  One file per plan. Frontmatter = structured data used by the pricing      */
/*  matrix, comparison tables and JSON-LD. Body = the long-form plan review.  */
/* -------------------------------------------------------------------------- */

const plans = defineCollection({
  loader: glob({ base: './src/content/plans', pattern: '**/*.md' }),
  schema: z.object({
    /* ---- Identity --------------------------------------------------- */
    name: z.string(),
    shortName: z.string().optional(),
    /** Product family — drives grouping in the pricing matrix. */
    group: z.enum(['web', 'cloud', 'vps', 'builder', 'agency']),
    tagline: z.string(),
    /** 1-based sort order inside its group. */
    order: z.number().default(99),
    /** Show in the homepage "top picks" strip. */
    featured: z.boolean().default(false),
    /** Ribbon text, e.g. "Best value" / "Most popular". */
    badge: z.string().optional(),
    /** Editorial score out of 5, one decimal. */
    rating: z.number().min(0).max(5),
    reviewCount: z.number().default(0),
    bestFor: z.array(z.string()).default([]),

    /* ---- Pricing ---------------------------------------------------- */
    pricing: z.object({
      currency: z.enum(['USD', 'EUR', 'GBP']).default('USD'),
      /** Length of the discounted introductory term, in months. */
      termMonths: z.number(),
      /** Human label for the term, e.g. "48 months". */
      termLabel: z.string(),
      /** Price per month during the intro term. */
      promoMonthly: z.number(),
      /** The crossed-out "regular" price shown next to the promo price. */
      regularMonthly: z.number(),
      /** Price per month after the intro term ends. */
      renewalMonthly: z.number(),
      /** Free domain included with the intro term? */
      freeDomain: z.boolean().default(true),
      freeDomainMonths: z.number().default(12),
      moneyBackDays: z.number().default(30),
      /** Anything unusual buyers must know (upfront payment, taxes, etc.). */
      note: z.string().optional(),
    }),

    /* ---- Technical specs (mirrors Hostinger's own limits table) ------ */
    specs: z.object({
      websites: z.string(),
      nodeJsSites: z.string().optional(),
      cpuCores: z.string(),
      ram: z.string(),
      storage: z.string(),
      storageType: z.enum(['SSD', 'NVMe', 'NVMe SSD']),
      bandwidth: z.string(),
      inodes: z.string().optional(),
      phpWorkers: z.string().optional(),
      databases: z.string().optional(),
      databaseSize: z.string().optional(),
      mailboxes: z.string(),
      dedicatedIp: z.boolean().default(false),
      backups: z.string(),
      cdn: z.boolean().default(true),
      freeSsl: z.boolean().default(true),
      aiCredits: z.string().optional(),
    }),

    /* ---- Feature checklist rendered as the comparison grid ---------- */
    features: z
      .array(
        z.object({
          label: z.string(),
          included: z.union([z.boolean(), z.string()]),
        }),
      )
      .default([]),

    /** Short marketing bullets for the plan card. */
    highlights: z.array(z.string()).default([]),
    pros: z.array(z.string()).default([]),
    cons: z.array(z.string()).default([]),
    /** One-paragraph editorial verdict shown at the top of the plan page. */
    verdict: z.string(),

    /** Optional list of who should NOT buy this plan. */
    notFor: z.array(z.string()).default([]),

    faqs: z.array(faq).default([]),

    /* ---- Editorial metadata ---------------------------------------- */
    author: z.string().default('maya-ross'),
    publishedDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    /** Date the prices in this file were last checked against Hostinger. */
    priceChecked: z.coerce.date().optional(),
    heroImage: z.string().optional(),

    ...seoFields,
  }),
});

/* -------------------------------------------------------------------------- */
/*  ARTICLES                                                                  */
/*  Reviews, tutorials, buying guides, deals and troubleshooting posts.        */
/* -------------------------------------------------------------------------- */

const articles = defineCollection({
  loader: glob({ base: './src/content/articles', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    /** Max ~160 characters so it survives Google's SERP truncation. */
    description: z.string().max(320),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),

    author: z.string().default('maya-ross'),
    /** Human-readable reviewer credit when different from the author. */
    reviewedBy: z.string().optional(),

    category: z.enum([
      'review',
      'tutorial',
      'guide',
      'deals',
      'comparison',
      'troubleshooting',
    ]),
    tags: z.array(z.string()).default([]),

    /** Primary keyword this article targets — used for internal linking. */
    primaryKeyword: z.string().optional(),

    heroImage: z.string().optional(),
    heroImageAlt: z.string().optional(),

    /** Show the affiliate disclosure banner above the article body. */
    affiliateNotice: z.boolean().default(true),

    /** Pin to the top of listings. */
    featured: z.boolean().default(false),
    /** Exclude from listings but keep the page live. */
    draft: z.boolean().default(false),

    /** Estimated reading time in minutes (set by the content blueprint). */
    readingTime: z.number().optional(),

    faqs: z.array(faq).default([]),

    /** Ordered how-to steps → emits HowTo structured data. */
    steps: z
      .array(z.object({ name: z.string(), text: z.string() }))
      .default([]),

    /** Star score 0–5; only meaningful for review/category pages. */
    rating: z.number().min(0).max(5).optional(),

    /** Which plans this article pushes — powers contextual CTAs. */
    relatedPlans: z.array(z.string()).default([]),
    /** Slugs of other articles to surface in the "read next" block. */
    relatedArticles: z.array(z.string()).default([]),

    ...seoFields,
  }),
});

/* -------------------------------------------------------------------------- */
/*  COMPARISONS                                                               */
/*  Hostinger head-to-head pages. Frontmatter holds both spec columns so the   */
/*  table component can render without any hard-coded markup.                  */
/* -------------------------------------------------------------------------- */

const comparisons = defineCollection({
  loader: glob({ base: './src/content/comparisons', pattern: '**/*.md' }),
  schema: z.object({
    competitor: z.string(),
    competitorUrl: z.string().optional(),
    title: z.string(),
    description: z.string(),
    /** One-line verdict shown above the table. */
    verdict: z.string(),
    /** Editorial winner, e.g. "Hostinger" or "Tie". */
    winner: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('maya-ross'),
    /** 1 = Hostinger, 2 = competitor. */
    highlightColumn: z.number().default(1),

    /** Rows rendered in the head-to-head table. */
    rows: z
      .array(
        z.object({
          label: z.string(),
          hostinger: z.string(),
          competitor: z.string(),
          /** Which side wins this row: 'hostinger' | 'competitor' | 'tie' */
          edge: z.enum(['hostinger', 'competitor', 'tie']).default('tie'),
        }),
      )
      .default([]),

    hostingerPros: z.array(z.string()).default([]),
    hostingerCons: z.array(z.string()).default([]),
    competitorPros: z.array(z.string()).default([]),
    competitorCons: z.array(z.string()).default([]),
    faqs: z.array(faq).default([]),
    ...seoFields,
  }),
});

export const collections = { plans, articles, comparisons };
