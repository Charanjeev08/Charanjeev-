// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import sitemap from '@astrojs/sitemap';

// Pages that are not ready yet. They redirect to homepage sections
// and are kept out of the sitemap.
// Draft pages: built and viewable, but noindex and kept out of the sitemap.
const draftPages = ['/homepage'];

const placeholderRedirects = {
  // '/services': '/#services',
};

export default defineConfig({
  site: 'https://charanjeev.com',
  output: 'static',
  adapter: vercel(),
  trailingSlash: 'never',
  build: { inlineStylesheets: 'always' },
  redirects: placeholderRedirects,
  integrations: [
    react(),
    markdoc(),
    keystatic(),
    sitemap({
      filter: (page) =>
        !page.includes('/keystatic') &&
        !draftPages.some((p) => page.replace(/\/$/, '').endsWith(p)) &&
        !Object.keys(placeholderRedirects).some((p) => page.endsWith(p)),
    }),
  ],
});
