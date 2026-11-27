import { SITE } from './site';

export const PERSON_ID = `${SITE.url}/#person`;
export const WEBSITE_ID = `${SITE.url}/#website`;

export function personSchema() {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: SITE.personName,
    url: SITE.url,
    ...(SITE.jobTitle ? { jobTitle: SITE.jobTitle } : {}),
    ...(SITE.sameAs.length ? { sameAs: SITE.sameAs } : {}),
  };
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE.url,
    name: SITE.name,
    inLanguage: SITE.locale,
    publisher: { '@id': PERSON_ID },
  };
}

export function webPageSchema(opts: { url: string; title: string; description: string }) {
  return {
    '@type': 'WebPage',
    '@id': `${opts.url}#webpage`,
    url: opts.url,
    name: opts.title,
    description: opts.description,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': PERSON_ID },
  };
}

/** Wraps nodes in one @graph so every page shares the same Person and WebSite. */
export function graph(...nodes: object[]) {
  return { '@context': 'https://schema.org', '@graph': [personSchema(), websiteSchema(), ...nodes] };
}
