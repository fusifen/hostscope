import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE, CATEGORIES } from '../consts';

/** Escape the five characters that break XML. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async () => {
  const articles = (await getCollection('articles'))
    .filter((a) => !a.data.draft && !a.data.noindex)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .slice(0, 50);

  const items = articles
    .map((article) => {
      const url = `${SITE.url}/blog/${article.id}/`;
      const category = CATEGORIES[article.data.category as keyof typeof CATEGORIES];
      return `    <item>
      <title>${escapeXml(article.data.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(article.data.description)}</description>
      <pubDate>${article.data.pubDate.toUTCString()}</pubDate>
      <category>${escapeXml(category?.label ?? article.data.category)}</category>
${article.data.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`).join('\n')}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE.name)} — Hostinger research, prices and tutorials</title>
    <link>${SITE.url}</link>
    <description>${escapeXml(SITE.description)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE.url}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
