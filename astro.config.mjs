// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import { SITE } from './src/consts.ts';

// https://astro.build/config
export default defineConfig({
  site: SITE.url,
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/admin') && !page.includes('/404') && !page.includes('/go/'),
      changefreq: 'weekly',
      priority: 0.7,
      serialize(item) {
        const { pathname } = new URL(item.url);
        if (pathname === '/') {
          return { ...item, priority: 1.0, changefreq: 'daily' };
        }
        if (/^\/(pricing|coupons|plans)\/?$/.test(pathname)) {
          return { ...item, priority: 0.9, changefreq: 'daily' };
        }
        if (pathname.startsWith('/plans/')) {
          return { ...item, priority: 0.85, changefreq: 'weekly' };
        }
        if (pathname.startsWith('/blog/')) {
          return { ...item, priority: 0.8, changefreq: 'monthly' };
        }
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
    },
  },
});
