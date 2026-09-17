import type { APIRoute } from 'astro';
import { SITE } from '../consts';

export const GET: APIRoute = () => {
  const body = `# robots.txt for ${SITE.name}
# ${SITE.description}

User-agent: *
Allow: /

# The CMS admin panel is for our editors only. The panel also carries
# <meta name="robots" content="noindex, nofollow">, so this is belt and braces.
Disallow: /admin/
Disallow: /admin

# NOTE: /_astro/ is deliberately NOT disallowed.
# It holds the site's content-hashed CSS and JavaScript bundles. Googlebot
# must be able to fetch them to render the page; blocking them makes the site
# look unstyled and scriptless to crawlers, which harms rendering-based
# indexing and Core Web Vitals assessment.

# Be explicit about the AI crawlers — we are happy to be cited,
# but we do not license full-text reproduction. See /terms/
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: ${SITE.url}/sitemap-index.xml
`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
