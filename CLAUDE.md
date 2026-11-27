# CLAUDE.md: personal portfolio and consulting website

This file is the working brief for building this site. Claude keeps it updated with decisions, facts about the owner, and things to never do.

## Status

- **Current phase:** Phase 1 (Scaffold and deploy). The owner asked to set up GitHub and Vercel first; design and content (Phase 0 discovery onward) come later.
- Skeleton site is built: Astro 7 + Keystatic (homepage singleton) + Vercel adapter, base layout with SEO head and shared Person/WebSite schema, robots.txt, sitemap.
- Next: connect the repo to Vercel, set up Keystatic's GitHub app, confirm editing works on the live site.

## Decisions log

| Date | Decision |
|------|----------|
| 2026-11-27 | Brief saved as CLAUDE.md. Repo was empty. Working branch: `claude/serene-goodall-mla0vs`. |
| 2026-11-27 | Owner chose to do setup (GitHub + Vercel) before discovery/design/content. |
| 2026-11-27 | Versions installed: astro 7.4, @astrojs/vercel 11, @astrojs/react 7 (current major for Astro 7), @astrojs/markdoc 2, @keystatic/core 0.6, @keystatic/astro 6, react 19, @astrojs/sitemap 3.7, @fontsource-variable/inter (placeholder font until brand is agreed). |
| 2026-11-27 | Keystatic uses local storage in dev and GitHub storage (repo Charanjeev08/Charanjeev-) in production builds. Content lives in `content/`. |
| 2026-11-27 | Domain assumed `charanjeev.com` in `astro.config.mjs`, `src/lib/site.ts` and `public/robots.txt`. Confirm with owner. |

## Open questions / waiting on the owner

- Phase 0 answers (section 1 below), when the owner is ready.
- Confirm the domain (`charanjeev.com`?) and whether they own it yet.

---

## 1. About me (to be filled in during Phase 0)

- **Name:** [NAME]
- **What I do / title I want to own:** [e.g. "Performance marketing consultant", "Product designer"]
- **Domain:** [charanjeev.com]
- **Primary audience:** [usually potential clients: who are they, what roles, what companies]
- **Secondary audience:** [e.g. hiring managers, recruiters]
- **Focus areas / niches I want to be known for:** [1 to 3]
- **Real proof I can show:** [clients, projects, results with numbers, testimonials, LinkedIn recommendations]
- **Career history:** [roles, companies; only what I'm happy to publish]
- **Socials:** [LinkedIn, X, GitHub, etc.]
- **Logos and headshot:** [owner will provide files]

The owner already has a GitHub account, a Vercel account and Claude Code. They may not be technical, so explain each step plainly and do the work wherever possible.

## 2. Stack (proven, use the same)

- **Astro** (static output) for the site.
- **Keystatic** as the CMS, in GitHub storage mode: edit content at `yoursite.com/keystatic`, logged in with GitHub; every save commits to the repo and redeploys. No database.
- **Vercel** for hosting (free Hobby tier), connected to the GitHub repo, so every push to `main` deploys automatically.
- **Markdoc** for rich text fields, **React** only for Keystatic's admin UI, **@astrojs/sitemap** for the sitemap.
- Self-hosted variable font via **@fontsource-variable** (no Google Fonts request).
- **Node.js 22.12** or newer.

Reference versions that worked together: astro ^7.2, @astrojs/vercel ^11, @astrojs/markdoc ^2, @keystatic/core ^0.6, @keystatic/astro ^6, @markdoc/markdoc ^0.5, @astrojs/react ^6, react ^19, @astrojs/sitemap ^3.7. If versions conflict, prefer the current majors that support the installed Astro version and check peer dependencies.

### Config that mattered

- `output: 'static'` with the Vercel adapter. The adapter is needed only because Keystatic's admin routes render on the server; every public page stays static. (Cloudflare's adapter did not work with Keystatic's filesystem reader.)
- `trailingSlash: 'never'`: one URL per page.
- `build: { inlineStylesheets: 'always' }`: no render-blocking CSS requests.
- Placeholder pages that aren't ready redirect to homepage sections (e.g. `/services` to `/#services`) and are excluded from the sitemap with a sitemap filter. Draft pages live as `_name.astro` files so they don't build.
- `site: 'https://yourdomain.com'` set, so canonicals and the sitemap use the right domain.

### Keystatic GitHub mode setup

- Needs a GitHub OAuth App and three env vars in Vercel: `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`. Keystatic's first-run flow at `/keystatic` walks through creating the app.
- **Security rule:** never ask the owner to paste tokens, secrets or passwords into chat. Tell them exactly where to paste them (Vercel → Project → Settings → Environment Variables, or GitHub settings).

### Deploying

- Create the GitHub repo, push, then in Vercel "Add New Project" → import the repo. Vercel deploys on every push to `main`. Add the custom domain in Vercel → Domains and follow its DNS instructions.
- After each push, check that the deployment succeeded before saying it's live.

## 3. How we work (the method)

- **One page at a time.** For each page: share a short outline (sections, the buyer question each answers, the main call to action, the interactive element), wait for approval, then build.
- **Build, then test before pushing:**
  - Check at desktop 1440px and mobile 390px, with no horizontal scroll.
  - Click every interactive element and every form.
  - Run Lighthouse for mobile and desktop; aim for 100 on performance, accessibility, best practices and SEO.
  - Playwright with Chromium for automated screenshots and checks.
- Commit with a clear message, push, confirm the Vercel deploy succeeded, and explain what changed in plain words.
- Keep CLAUDE.md updated with decisions, facts about the owner, and things to never do.
- Quick fun changes (like a homepage greeting) go in a separate commit so they're easy to roll back.

## 4. Quality bar for every page

### Buyer psychology first
- Before writing, define who lands on the page, their awareness level, what worries them, and what they must believe before they get in touch.
- Speak to their problem in their words, then the outcome, then the method. Answer real objections on the page.

### Conversion (CRO)
- One primary call to action per page, plus one lighter option for people not ready to talk (a free tool, a free audit, a checklist).
- CTA in the hero, after the proof, and at the end. A sticky CTA bar after the hero works well.
- Every CTA destination must actually work (real form or booking embed).
- Short forms: name, email, website, one or two qualifying selects, an optional note.

### Content and trust (E-E-A-T)
- Natural, human, specific, persuasive. US English unless the owner prefers otherwise.
- Never invent results, numbers, clients, testimonials, prices, dates or credentials. Use clearly marked placeholders and ask.
- Copy rules: **no em dashes.** No AI-sounding phrases ("unlock", "elevate", "leverage", "game-changer", "in today's fast-paced world", "not just X, but Y"). Short sentences, plain words.
- Proof before claims: real case studies with numbers, named testimonials, client logos.

### Design
- Consistent brand system: one font family, one accent colour, a neutral palette, consistent borders and spacing. Ask for preferences or propose two options.
- Animations and visuals should explain something (calculator, before/after, checker, live demo), not just decorate.
- Mobile first. Respect `prefers-reduced-motion`.

### Performance tricks that got to 100
- Self-host the font, preload the main woff2, and define a metric-matched fallback font (size-adjust, ascent-override, etc.).
- Lazy-load images below the fold, set width and height, use WebP, crop hero images to the displayed size.
- Run animations only when on screen.
- Reveal animations use clip-path wipes, not opacity fades (fading text fails contrast checks mid-animation).
- Make small accent-coloured text slightly darker on grey backgrounds to keep 4.5:1 contrast.

## 5. SEO, AEO and GEO standards

- Follow Google Search Essentials and people-first content guidance.
- One clear search intent per page. No two pages competing for the same terms. Link related pages (hub → spoke → related).
- Keyword research before choosing a URL and title, using real search volume data where available.
- Unique title (about 50 to 65 characters) and meta description (under 160) on every page.
- One H1 per page, logical H2/H3 structure. Section labels that act as headings are real heading tags.
- Write to be cited by AI: clear definition near the top, direct answers, descriptive headings, short paragraphs, lists and tables.
- Structured data (JSON-LD) matching visible content: one shared Person and WebSite entity referenced by `@id` on every page, plus Service, FAQPage, BreadcrumbList, Article (case studies), ProfilePage (about) as relevant. Schema helpers in one file (`src/lib/schema.ts`).
- Entity links: `sameAs` to LinkedIn and other profiles; `knowsAbout` can link to Wikidata. **Verify every Wikidata ID before using it.**
- Canonical URLs use the path only. No internal links with `?parameters`.
- `robots.txt`: allow everything except `/keystatic` and `/api/`; explicitly allow OAI-SearchBot, ChatGPT-User, GPTBot, PerplexityBot, ClaudeBot, Claude-SearchBot, Google-Extended, Applebot-Extended. Point to the sitemap.
- `llms.txt` at the site root: who the owner is, focus areas, services, case studies with results, key pages with one-line descriptions, and a citation note.
- Alt text on every meaningful image; `alt=""` for decorative duplicates.
- Site-wide check before big pushes: titles and descriptions unique and in range, no sentences duplicated across pages, no parameter links, no AI-sounding phrases.

## 6. Build order (phases)

- **Phase 0: Discovery.** Ask 10 to 15 questions to fill section 1. Propose positioning (one sentence: who I help, the outcome, why me) and a site plan for approval.
- **Phase 1: Scaffold and deploy.** Astro + Keystatic + Vercel, base layout (nav, footer, SEO head, schema), placeholder homepage, live on Vercel. Confirm Keystatic editing works on the live site.
- **Phase 2: Homepage.** Hero, trust logos, stats, services, selected work, how I work, testimonials, FAQ, final CTA. All homepage text editable in Keystatic.
- **Phase 3: Case studies.** Keystatic collection, index and template (H1, results stats, "At a glance" box, H2 sections: situation, what I did, what changed; client quote; CTA).
- **Phase 4: Conversion paths.** Contact page with a real form (FormSubmit AJAX endpoint) or calendar embed, plus one free lead magnet.
- **Phase 5: Performance and accessibility pass.** Every page to Lighthouse 100.
- **Phase 6: Hub and spoke pages.** Agree hubs (e.g. Services, Industries, Platforms, About), about 5 pages per hub prioritised by search demand. Build one per hub first, then expand. Reusable kit: breadcrumbs, trust row, "Sound familiar?" section, FAQ, final CTA, sticky CTA, tabs.
- **Phase 7: SEO/AEO/GEO pass.** robots.txt, sitemap, llms.txt, titles, descriptions, headings, schema, alt text, internal links, duplicate content check.
- **Phase 8: Positioning review.** Re-read every page as a buyer. Fix gaps and list what's needed from the owner.

## 7. Page patterns that worked well

- **Hero:** eyebrow, H1 with one highlighted phrase, a 2 to 3 sentence lead naming pain and outcome, primary button plus secondary option, three short trust points.
- **Interactive element in service-page heroes** that teaches something real: scored checklist, calculator, risk checker, "visitor view vs AI crawler view" toggle, in-browser copy checker, filterable sample report.
- **"Sound familiar?"**: 4 to 5 problems in the buyer's words; clicking one shows why it happens, what I change, and the payoff.
- **Proof section:** short case summary in fresh words (no copy-pasted bullets across pages), a stat, a named testimonial.
- **FAQ** answering real objections, with matching FAQPage schema.
- **Navigation:** desktop dropdowns with one-line descriptions plus a highlighted free-offer card; mobile full-height drawer with expandable sections and pinned CTA buttons.

## 8. Things to never do

- Never invent facts, clients, numbers, testimonials, prices or legal claims. Ask.
- Never publish the owner's private email address in the page source (use a form service alias).
- Never ask the owner to paste secrets into chat.
- Never change the design system without asking once it is agreed.
- Never push without testing desktop, mobile and the interactive elements.
- Never claim something is live until the deployment has succeeded.
