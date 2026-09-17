/**
 * Structured-data (JSON-LD) builders.
 *
 * Keeping these in one place means every page emits consistent, valid
 * schema.org markup — which is the single highest-leverage SEO change on a
 * content + affiliate site.
 */

import { SITE } from '../consts';

export interface BreadcrumbEntry {
  name: string;
  /** Root-relative path (e.g. "/pricing/") or an absolute URL. */
  href: string;
}

export function organizationSchema() {
  return {
    '@type': 'Organization',
    '@id': `${SITE.url}/#organization`,
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    email: SITE.publisher.email,
    foundingDate: '2023-04-11',
    knowsAbout: [
      'Web hosting',
      'Hostinger',
      'WordPress hosting',
      'VPS hosting',
      'Cloud hosting',
      'Domain names',
      'Website performance',
    ],
    logo: {
      '@type': 'ImageObject',
      url: `${SITE.url}/images/brand/hostscope-logo.svg`,
      width: 512,
      height: 512,
    },
    sameAs: [
      'https://twitter.com/hostscope',
      'https://www.youtube.com/@hostscope',
      'https://www.linkedin.com/company/hostscope',
    ],
  };
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    url: SITE.url,
    name: SITE.name,
    description: SITE.description,
    publisher: { '@id': `${SITE.url}/#organization` },
    inLanguage: 'en-US',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE.url}/blog/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbSchema(items: BreadcrumbEntry[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.href?.startsWith('http') ? item.href : `${SITE.url}${item.href ?? '/'}`,
    })),
  };
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export function faqSchema(faqs: FaqEntry[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export interface ArticleSchemaInput {
  headline: string;
  description: string;
  url: string;
  image: string;
  datePublished: Date;
  dateModified?: Date;
  authorName: string;
  authorUrl?: string;
  section: string;
  keywords: string[];
  wordCount?: number;
}

export function articleSchema(input: ArticleSchemaInput) {
  return {
    '@type': 'Article',
    '@id': `${input.url}#article`,
    headline: input.headline,
    description: input.description,
    url: input.url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
    image: [input.image.startsWith('http') ? input.image : `${SITE.url}${input.image}`],
    datePublished: input.datePublished.toISOString(),
    dateModified: (input.dateModified ?? input.datePublished).toISOString(),
    author: {
      '@type': 'Person',
      name: input.authorName,
      url: input.authorUrl ? `${SITE.url}${input.authorUrl}` : `${SITE.url}/about/`,
    },
    publisher: { '@id': `${SITE.url}/#organization` },
    articleSection: input.section,
    keywords: input.keywords.join(', '),
    ...(input.wordCount ? { wordCount: input.wordCount } : {}),
    inLanguage: 'en-US',
    isAccessibleForFree: true,
  };
}

export interface ProductSchemaInput {
  name: string;
  description: string;
  url: string;
  image: string;
  lowPrice: number;
  highPrice: number;
  ratingValue?: number;
  reviewCount?: number;
  planNames?: string[];
}

/**
 * SoftwareApplication is the correct schema type for hosting plans —
 * Google treats it as software, which is how hosting products get rich
 * results with price ranges and star ratings.
 */
export function hostingProductSchema(input: ProductSchemaInput) {
  return {
    '@type': 'SoftwareApplication',
    '@id': `${input.url}#product`,
    name: input.name,
    description: input.description,
    url: input.url,
    applicationCategory: 'WebApplication',
    applicationSubCategory: 'Web Hosting',
    operatingSystem: 'Web-based',
    image: input.image.startsWith('http') ? input.image : `${SITE.url}${input.image}`,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: input.lowPrice.toFixed(2),
      highPrice: input.highPrice.toFixed(2),
      offerCount: input.planNames?.length ?? 1,
      availability: 'https://schema.org/InStock',
      url: input.url,
    },
    ...(input.ratingValue && input.reviewCount
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: input.ratingValue.toFixed(1),
            reviewCount: input.reviewCount,
            bestRating: '5',
            worstRating: '1',
          },
        }
      : {}),
  };
}

export interface ReviewSchemaInput {
  itemName: string;
  itemUrl: string;
  reviewBody: string;
  ratingValue: number;
  authorName: string;
  datePublished: Date;
}

export function reviewSchema(input: ReviewSchemaInput) {
  return {
    '@type': 'Review',
    itemReviewed: {
      '@type': 'SoftwareApplication',
      name: input.itemName,
      applicationCategory: 'WebApplication',
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: input.ratingValue.toFixed(1),
      bestRating: '5',
      worstRating: '1',
    },
    reviewBody: input.reviewBody,
    author: { '@type': 'Person', name: input.authorName },
    publisher: { '@id': `${SITE.url}/#organization` },
    datePublished: input.datePublished.toISOString(),
    url: input.itemUrl,
  };
}

export interface HowToStep {
  name: string;
  text: string;
}

export function howToSchema(input: {
  name: string;
  description: string;
  steps: HowToStep[];
  totalTime?: string;
  image?: string;
}) {
  return {
    '@type': 'HowTo',
    name: input.name,
    description: input.description,
    ...(input.totalTime ? { totalTime: input.totalTime } : {}),
    ...(input.image ? { image: `${SITE.url}${input.image}` } : {}),
    step: input.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };
}

/** Wrap one or more schema nodes into a single @graph document. */
export function graph(nodes: object[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes,
  };
}
