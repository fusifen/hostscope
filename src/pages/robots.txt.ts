import type { APIRoute } from 'astro';
import { SITE } from '../consts';

export const GET: APIRoute = () => {
  const body = `# robots.txt for ${SITE.name}
# ${SITE.description}

User-agent: *
Allow: /

# The CMS admin panel is for our editors only
Disallow: /admin/
Disallow: /admin

# Build artefacts and internal endpoints
Disallow: /_astro/
Disallow: /api/

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

# Hostinger's own affiliate tracking redirects must never be indexed
User-agent: *
Disallow: /go/

Sitemap: ${SITE.url}/sitemap-index.xml
`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
