import { config, fields, singleton } from '@keystatic/core';

// Local mode while developing on a computer, GitHub mode on the live site.
const isProd = import.meta.env.PROD;

export default config({
  storage: isProd
    ? { kind: 'github', repo: { owner: 'Charanjeev08', name: 'Charanjeev-' } }
    : { kind: 'local' },
  ui: { brand: { name: 'Charanjeev' } },
  singletons: {
    home: singleton({
      label: 'Homepage',
      path: 'content/home/',
      format: { data: 'json' },
      schema: {
        eyebrow: fields.text({ label: 'Eyebrow' }),
        headline: fields.text({ label: 'Headline (H1)' }),
        lead: fields.text({ label: 'Lead paragraph', multiline: true }),
      },
    }),
  },
});
