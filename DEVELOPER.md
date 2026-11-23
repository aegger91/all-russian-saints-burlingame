# Developer guide

This repository is a **master template for Orthodox parish websites**. The reference content is the Church of All Russian Saints, Burlingame (ROCOR), in English and Russian. It is meant to be imported into a site builder in which parishes edit their own content, and connected to the OrthodoxConnect app.

Design goals:

- **Content is data.** Everything a parish edits lives in `content/` as JSON, and every file has a JSON Schema in `schemas/`. Templates contain no parish text.
- **Presentation is components.** Each section type is one pure function, `props → HTML`, registered in one place.
- **Theme is tokens.** Every color, font, size, spacing and radius comes from `theme/tokens.json` and is exposed as CSS custom properties.
- **Portable output.** The build writes plain static HTML/CSS/JS to `dist/`. It works on any web server, with no framework, CMS or hosting vendor.
- **Small toolchain.** Node 20+ and three dependencies: `marked` (Markdown), `ajv` and `ajv-formats` (schema validation).

Contents:

1. [Quick start](#1-quick-start)
2. [Folder structure](#2-folder-structure)
3. [Architecture](#3-architecture)
4. [Content model](#4-content-model)
5. [Component catalog](#5-component-catalog)
6. [Design tokens and theming](#6-design-tokens-and-theming)
7. [Languages (i18n)](#7-languages-i18n)
8. [Machine translation script](#8-machine-translation-script)
9. [OrthodoxConnect integration](#9-orthodoxconnect-integration)
10. [Wiring into a builder or editor](#10-wiring-into-a-builder-or-editor)
11. [Setting up another parish](#11-setting-up-another-parish)
12. [Deploying](#12-deploying)
13. [Quality checks](#13-quality-checks)

---

## 1. Quick start

```bash
npm ci
npm run dev        # build, serve on http://localhost:4321, rebuild on change
npm run build      # validate content, then write dist/
npm test           # build + link check (both languages) + translation status
```

| Command | What it does |
|---|---|
| `npm run validate` | Validates every content file against its schema, then checks cross-references (ids, pages, documents, people, images). |
| `npm run build` | Runs `validate`, then `node src/build.mjs`, which writes `dist/`. |
| `npm run serve` | Serves `dist/` on port 4321 (`PORT` to change it). |
| `npm run check-links` | Checks every internal link, anchor, image, hreflang pair, language-switch link and sitemap URL in `dist/`. |
| `npm run check-links:external` | Same, plus HEAD/GET requests to every external URL. |
| `npm run translate` | Optional machine translation of missing Russian text (see §8). |
| `npm run translate:check` | Reports translation status. It never fails without `--strict`. |

Build environment variables (all optional):

| Variable | Default | Purpose |
|---|---|---|
| `SITE_URL` | `site.json` → `url` | Origin used for canonical, hreflang, Open Graph and sitemap URLs. |
| `BASE_PATH` | `""` | Serve from a sub-path, e.g. `/burlingame`. All links, assets and CSS `url()`s are prefixed. |
| `OUT_DIR` | `dist` | Output folder. |
| `CONTENT_DIR` | `content` | Content folder to build (one per parish). |
| `PUBLIC_DIR` | `public` | Static files (images, logos, fonts, small PDFs) copied into the output. |
| `ORTHODOXCONNECT_FEED_URL` | — | Fetch the live OrthodoxConnect feed at build time (§9). |

## 2. Folder structure

```text
content/                    all parish content (what an editor changes)
  site.json                 identity, locales, contact, logo, SEO defaults, theme, integrations
  navigation.json           top bar, main menu, header buttons, footer columns
  ui.json                   interface strings ("Read more", aria labels…) per locale
  people.json               clergy, council, ministry leaders, contacts
  services.json             service types, season, notices, dated upcoming services
  events.json               parish events
  news.json                 news items and photo reports
  galleries.json            photo albums
  ministries.json           ministries / groups (cards)
  giving.json               PayPal funds and membership dues
  documents.json            PDFs and other files (local or on their original host)
  links.json                grouped external links
  redirects.json            old URLs -> new pages
  pages/<id>.json           one file per page: an ordered list of sections
  integrations/orthodoxconnect.sample.json   SAMPLE feed (labeled as such on the site)
schemas/                    JSON Schema (draft 2020-12) for every file above + tokens + feed
theme/tokens.json           design tokens -> CSS custom properties
public/                     copied as-is into dist/ (assets/img, assets/docs, assets/fonts, logo/)
src/
  build.mjs                 the build (content -> dist)
  lib/                      content loading, render context, i18n, html escaping, tokens, images
  components/               one module per component family; registry.mjs maps type -> component
  styles/                   base, layout, components, sections, utilities, fonts (concatenated)
  client/site.js            progressive enhancement (menu, language memory, past-date hiding, video, lightbox)
scripts/
  validate.mjs              schema + reference validation (also usable as a library)
  check-links.mjs           link checker for dist/
  translate.mjs             optional DeepL / Google translation
  serve.mjs                 tiny static server with --watch
i18n/
  glossary.en-ru.json       Orthodox terminology for machine translation
  state.ru.json             hashes that tell machine text from human text (§8)
.github/workflows/ci.yml    npm ci && npm test on every push / PR
```

## 3. Architecture

```text
content/*.json ──validate (schemas/ + reference checks)──┐
theme/tokens.json ──tokensToCss──> assets/site.css       │
                                                         ▼
                 loadContent() ─> one render context per (page × locale)
                                                         │
                 layout.renderPage(ctx) ─> header, nav, sections, footer
                                   │
                 registry.renderSection(section, ctx) ─> component.render(props, ctx)
                                                         │
                 dist/<locale>/<slug>/index.html, sitemap.xml, robots.txt,
                 404.html, index.html (language redirect), redirect stubs
```

- **`loadContent()`** (`src/lib/content.mjs`) reads every content file and builds `content.index`, a set of lookups by id: `pages`, `people`, `documents`, `galleries`, `funds`, `ministries` and others.
- **The render context** (`src/lib/context.mjs`) is the only thing a component receives besides its props:

  | Helper | Purpose |
  |---|---|
  | `ctx.l(value)` | Localized text, with fallback to the source locale. |
  | `ctx.lx(value)` | Like `ctx.l`, but returns `{ text, lang }` so a fallback can be marked with `lang`. |
  | `ctx.t('key')` | A UI string from `ui.json`. |
  | `ctx.href(link)` | Resolves a link object (§4.3). |
  | `ctx.pagePath(id, { anchor, locale })` | URL of a page. |
  | `ctx.asset(path)` | Asset URL, with `BASE_PATH` applied. |
  | `ctx.md(markdown)` | Rendered Markdown. |
  | `ctx.formatDate()`, `ctx.formatTime()` | Dates and times in the locale's format. |
  | `ctx.imageSize()` | Image dimensions read from the file. |

  It also carries `ctx.locale`, `ctx.site` and `ctx.content`.
- **Components** (`src/components/*.mjs`) are pure functions. Each one returns HTML built with the auto-escaping `html` tagged template (`src/lib/html.mjs`), so content can never inject markup except through Markdown, which `marked` renders. A component never reads files or global state.
- **The registry** (`src/components/registry.mjs`) maps a section `type` to `{ meta, render }`. `renderSection` wraps every section in the same outer markup:

  ```html
  <section id="…" class="section section--{type} section--bg-{background}" data-section-type="{type}">
    <div class="container">…</div>
  </section>
  ```

  `renderBlock` renders a section nested inside `split` or `stack` as `<div class="block block--{type}">`.
- **Client JS** (`src/client/site.js`, about 10 KB unminified, no dependencies) only enhances the page. Without JavaScript every page still works: menus are links, videos are YouTube links, and galleries link to the full images. JavaScript adds:
  - the mobile menu and dropdowns;
  - remembering the chosen language (`localStorage['site-lang']`);
  - keeping the `#anchor` when switching language;
  - hiding services and events whose date has passed, in the parish time zone, so a static build never shows stale dates;
  - a privacy-friendly YouTube embed that loads on click;
  - a gallery lightbox;
  - highlighting the current section in the on-page navigation.

### URLs

- Pages are built at `/<locale>/<slug>/`. The slug is shared by all locales, so `/en/services/` ↔ `/ru/services/`.
- `/` is a small page that forwards to the stored language, then the browser language, then `site.sourceLocale`.
- Each entry in `redirects.json` produces the same kind of forwarding page at its old path (e.g. `/donate.html` → `/<lang>/give/`).
- Every page has `hreflang` alternates for each locale plus `x-default`, a canonical URL and Open Graph tags (`og:locale` and `og:locale:alternate`).
- `sitemap.xml` lists every page in every locale with `xhtml:link` alternates.

## 4. Content model

### 4.1 Files

| File | Schema | Top-level shape | Referenced by |
|---|---|---|---|
| `site.json` | `site.schema.json` | `{ id, url, name, shortName, location, jurisdiction, timezone, locales[], sourceLocale, contact, social[], livestreamUrl, logo, seo, theme, integrations }` | everything |
| `navigation.json` | `navigation.schema.json` | `{ topbar, header: { items[], actions[] }, footer: { about, columns[], legal } }` | layout |
| `ui.json` | `ui.schema.json` | `{ strings: { "group.key": {en, ru} } }` | `ctx.t()` |
| `people.json` | `people.schema.json` | `{ people[] }` (`id, name, photo, email, phone, roles[]`; a role has a `group` and a localized `title`) | `person-profile`, `people-list` |
| `services.json` | `services.schema.json` | `{ serviceTypes[], season, notices[], standing[], upcoming[] }` (upcoming: `id, date, time, serviceType, title, note, noService`) | `service-times`, `hero` |
| `events.json` | `events.schema.json` | `{ events[] }` (`id, date?, endDate, time, title, location, description, ministry, link`) | `event-list` |
| `news.json` | `news.schema.json` | `{ items[] }` (`id, date?, dateLabel, featured, title, summary, body, image, gallery, videos, links`) | `news-list` |
| `galleries.json` | `galleries.schema.json` | `{ galleries[] }` (`id, title, images[]`) | `gallery`, news |
| `ministries.json` | `ministries.schema.json` | `{ ministries[] }` (`id, title, text, image, link`) | `card-grid` with `source: "ministries"` |
| `giving.json` | `giving.schema.json` | `{ provider, paypal: { action, business, currency, … }, funds[], dues, note }` | `give-block`, `dues-table` |
| `documents.json` | `documents.schema.json` | `{ groups[], documents[] }` (`id, group, category, title, url, lang, note, year, volume, number`) | `document-list`, links `{document}` |
| `links.json` | `links.schema.json` | `{ groups[] }` (`id, title, links[]`) | `link-list` |
| `redirects.json` | `redirects.schema.json` | `{ redirects[]: { from, page, anchor? } }` | build |
| `pages/<id>.json` | `page.schema.json` | `{ id, slug, order, title, subnav, seo, sections[] }` | build, menus |
| `theme/tokens.json` | `tokens.schema.json` | `{ color, semantic, font, font-size, space, radius, shadow, layout, … }` | CSS |

Each file declares its schema in `$schema`, so editors such as VS Code autocomplete and validate while you type. The schemas carry `title`, `description`, `default` and `enum` metadata, which is enough to generate editor forms (§10).

### 4.2 Identifiers

- Every addressable object has an `id`: lowercase letters, digits and hyphens.
- Menus, sections and links reference pages, people, documents, galleries, funds, ministries and link groups **by id**, never by URL or position.
- **Never change a published id.** A builder should treat ids as primary keys and generate them once, when the item is created.
- Section `id`s double as URL anchors (`/en/choir/#concerts`), so the menus and the redirect table depend on them.
- `npm run validate` fails on duplicate ids or slugs and on any reference to an id that does not exist.

### 4.3 Field conventions

- **Localized text:** `{ "en": "Parish History", "ru": "История прихода" }`.
  - When a locale is missing or empty, the source locale (`site.sourceLocale`) is shown with the correct `lang` attribute.
  - A plain string means "the same in every locale". Use it for names, numbers and Church Slavonic text.
  - Fields typed `markdown` accept the same shapes and render as Markdown.
- **Links:** use exactly one target form.

  | Form | Points to |
  |---|---|
  | `{ "page": "services", "anchor": "livestream" }` | A section on another page. |
  | `{ "anchor": "dues" }` | A section on the same page. |
  | `{ "href": "https://…" }` | An external URL. External links get `rel="noopener"` and an icon. |
  | `{ "document": "bylaws" }` | A file from `documents.json`. |
  | `{ "email": "…", "subject": {…} }` | An email address, with an optional subject. |
  | `{ "phone": "+1…" }` | A phone number. |

  Buttons (`action`) add `label`, `style` (`primary`, `secondary`, `accent`, `light`, `ghost`, `link`) and `icon`.
- **Images:** `{ "src": "/assets/img/x.jpg", "alt": {…}, "position": "50% 30%", "caption": {…} }`. Width and height are read from the file at build time, so layout never shifts.
- **Dates:** `YYYY-MM-DD` for dates and `HH:MM` for times, both in `site.timezone`. A date can be omitted where the schema allows it (events or news with a date still to be confirmed).
- **Editorial flags** (allowed on any object, never rendered):
  - `"needsReview": "…"` is a note to editors. Every open content question in this template is marked this way.
  - `"ru_locked": true`, or generally `"<locale>_locked": true`, protects every localized value inside that object from machine translation (§8). The parish's own Russian texts, prayers and liturgical texts are locked.

### 4.4 Pages, sections and blocks

A page is an ordered list of **sections**. Each section has a `type` from the catalog below, plus these common properties:

| Property | Meaning |
|---|---|
| `id` | Anchor id. Required if a menu, the on-page navigation or a link points to the section. |
| `navLabel` | Label in the sticky on-page navigation (pages with `"subnav": true`). |
| `background` | `default`, `alt`, `cream` or `navy`. |
| `spacing` | `default`, `tight` or `none`. |
| `width` | `default`, `narrow` or `wide`. |
| `divider` | Thin ornamental rule above the section. |
| `hidden` | Keep in the data but don't render. Useful for drafts. |
| `locales` | Render only in these locales, e.g. `["ru"]`. |

`split` and `stack` take nested **blocks**: the same component types, minus the page-level layout properties. The page schema dispatches on `type`, so validation errors point at the exact property that is wrong.

## 5. Component catalog

Every component lives in `src/components/` and its props are defined as `section-<type>` in `schemas/page.schema.json`. The schema descriptions are the reference; this table is the overview. Props marked `*` are required. Every catalog component also accepts `eyebrow`, `title`, `accent` (a decorative second line, set in Church Slavonic type) and `intro`, unless noted.

| Type | Module | Purpose | Main props |
|---|---|---|---|
| `hero` | `hero.mjs` | Full-width photograph with the parish name, accent line, buttons and an optional "next services" card. Home page only. | `title*`, `image*`, `text`, `actions`, `nextServices: { title, limit }` |
| `page-header` | `page-header.mjs` | Breadcrumbs, H1, accent, lede, optional arch-framed photo. First section of each inner page. | `title*`, `lede`, `image`, `breadcrumbs` |
| `rich-text` | `rich-text.mjs` | Heading and Markdown body, optionally beside or above a photo, plus a notice, collapsible "more" text and buttons. | `body`, `bodyLang`, `media`, `mediaPosition` (`start`, `end`, `below`), `mediaFrame` (`arch`, `plain`), `notice`, `more`, `actions`, `headingLevel` |
| `split` | `split.mjs` | Two blocks side by side, stacked on mobile. | `columns*` (two blocks), `ratio` (`1:1`, `3:2`, `2:3`, `7:5`, `5:7`), `align` (`start`, `center`), `reverseOnMobile` |
| `stack` | `blocks.mjs` | Several blocks in a column under an optional shared heading. | `blocks*`, `gap` (`default`, `tight`) |
| `service-times` | `service-times.mjs` | Upcoming services from `services.json` (past dates hide), with the season banner, notices and weekly schedule. | `limit`, `variant` (`panel`, `plain`), `showSeason`, `showNotices`, `showStanding`, `actions` |
| `person-profile` | `people.mjs` | One person with an arch portrait, role, contacts, text, quote and a collapsible biography. | `person*` (id), `group`, `body`, `quote`, `media`, `more`, `actions` |
| `people-list` | `people.mjs` | People by role group or id list, shown as a contact directory or cards. | `group` or `people[]`, `variant` (`directory`, `cards`), `columns`, `showEmail`, `showPhone` |
| `event-list` | `event-list.mjs` | Events from `events.json` (past events hide). | `ministry`, `limit`, `variant` (`plain`, `panel`), `actions` |
| `news-list` | `news.mjs` | News as cards linking to the news page, or as full articles. | `variant` (`cards`, `full`), `limit`, `columns`, `featuredOnly`, `actions` |
| `gallery` | `media.mjs` | Photo grid with a keyboard-accessible lightbox. | `gallery*` (id), `limit`, `columns` |
| `video-list` | `media.mjs` | YouTube videos as privacy-friendly facades (thumbnail; the player loads on click). | `videos*` (`youtubeId`, `title`, `heading`, `date`, `description`, `embed: false` when the owner disabled embedding), `layout` (`list`, `grid`) |
| `give-block` | `giving.mjs` | PayPal donation buttons for each fund in `giving.json`. | `funds` (ids, default all), `showNote` |
| `dues-table` | `giving.mjs` | Membership dues rates. | `body`, `actions` |
| `document-list` | `documents.mjs` | Files by group or ids, optionally grouped by year, volume or category, with type, size and language badges. | `group` or `documents[]`, `groupBy` (`year`, `volume`, `category`), `columns`, `limit`, `actions` |
| `contact-map` | `contact.mjs` | Address, phone, email, social links and an embedded map, from `site.json`. | `body`, `showMap`, `actions` |
| `cta-band` | `blocks.mjs` | Short message with buttons on a colored band. | `title*`, `text`, `tone` (`navy`, `cream`, `gold`), `actions` |
| `card-grid` | `blocks.mjs` | Cards with optional image and link, written inline or taken from `ministries.json`. | `cards[]` or `source: "ministries"` + `ids`, `columns` |
| `link-list` | `blocks.mjs` | Grouped external links from `links.json`. | `groups*` (ids), `columns` |
| `quote` | `blocks.mjs` | Pastoral message or quotation with attribution and portrait. | `text*`, `cite`, `image`, `more` |
| `notice` | `blocks.mjs` | Highlighted announcement. | `text*`, `title`, `tone` (`info`, `season`, `alert`), `actions` (no eyebrow/intro) |
| `prayer` | `blocks.mjs` | Liturgical text with line breaks preserved, plus an optional translation. | `text*`, `textLang`, `translation`, `cite` |
| `fact-list` | `blocks.mjs` | Label/value list ("at a glance"). | `facts*` |
| `image` | `blocks.mjs` | One photograph with an optional caption. | `image*`, `frame` (`plain`, `arch`) |
| `orthodoxconnect-feed` | `orthodoxconnect.mjs` | Events, volunteer opportunities and needs from OrthodoxConnect (§9). | `kinds` (`event`, `volunteer`, `need`), `limit`, `actions` |
| `orthodoxconnect-cta` | `orthodoxconnect.mjs` | "Join our parish on OrthodoxConnect" invitation. | `title`, `text`, `buttonLabel` |

Site chrome (`layout.mjs`) is built from `site.json` and `navigation.json`:

- top bar (service notice, livestream link, ENG/RUS switch);
- sticky header (logo lockup, main menu with dropdowns, language switch, Give button), which compacts on scroll and becomes a burger menu below 1200 px;
- breadcrumbs and on-page navigation;
- footer (logo, address, columns, social links, legal line).

Shared primitives live in `_primitives.mjs`: `icon()` and the SVG sprite, `button()`/`actions()`, `sectionHead()` (eyebrow, title, Slavonic accent and intro), `image()`/`figure()` (arch or plain frame) and `linkTo()`.

### Adding a component

1. Write `render(props, ctx, { renderBlock })` and `meta = { title, description }` in a module under `src/components/`.
2. Register it in `registry.mjs`.
3. Add a `section-<type>` definition (and `block-<type>` if it may be nested) to `schemas/page.schema.json`, plus an entry in the `if/then` dispatch.
4. Style it in `src/styles/components.css` or `sections.css`, using tokens only.
5. Add any UI strings to `content/ui.json` in every locale.

## 6. Design tokens and theming

`theme/tokens.json` is the only place raw design values live. At build time each token becomes a CSS custom property on `:root`, both inlined at the top of `assets/site.css` and written separately as `assets/tokens.css`:

| Token | CSS variable |
|---|---|
| `color.navy` | `--color-navy` |
| `semantic.brand` | `--brand` (semantic tokens are unprefixed) |
| `font-size.lg` | `--font-size-lg` |
| `space.6` | `--space-6` |
| `radius.md` | `--radius-md` |
| `layout.logo-height` | `--layout-logo-height` |

A value may reference another token: `"brand": "{color.navy}"` becomes `--brand: var(--color-navy)`.

Groups:

- `color`: the palette.
  - Navy `#174372`, cream `#fff9dc` and gold `#b08d57`.
  - Plus their shades and neutrals.
- `semantic`: roles that components use.
  - `brand`, `accent`, `surface*`, `text*`, `heading`, `link`, `border`, `focus`.
- `font`
  - `serif` (Cormorant Garamond): headings.
  - `sans` (Source Sans 3): body text.
  - `slavonic` (Ponomar): used only for short Russian or Slavonic accent lines.
- `font-weight`, `font-size` (a fluid `clamp()` scale), `line-height`, `letter-spacing`.
- `space` (0–13), `radius`, `shadow`, `motion`.
- `layout`: container widths, gutters, section spacing, and the header and logo heights.

**To re-theme a parish**, edit or copy the tokens file:

- Set `site.theme.tokens` to the copy's path, relative to the repo root.
- Change semantic roles rather than component CSS. For example, point `semantic.brand` at a burgundy `color.*`.
- Set `site.theme.themeColor` (browser UI color) and `site.theme.preloadFonts`.
- Fonts are self-hosted WOFF2 files under `public/assets/fonts/`, declared in `src/styles/fonts.css`. To change fonts, replace the files and declarations, then update `font.*`.

Component CSS uses only `var(--…)`, so a builder can also offer live theming by overriding variables in a `<style>` block or on a wrapper element.

## 7. Languages (i18n)

- `site.locales` lists the languages in toggle order: `{ code, label, name, ogLocale }`. `site.sourceLocale` is the fallback language (`en`).
- **Content** is per field: every localized value is `{ "<code>": "…" }`. **Interface strings** are in `ui.json` and dates use `Intl` for each locale, so templates contain no language-specific text.
- **The switch** in the top bar, header and mobile menu links to the same page and section in the other locale. The checker verifies that every page has its counterpart. Russian pages use `lang="ru"`. Text that falls back to English is wrapped in `lang="en"`, so screen readers and hyphenation stay correct.
- **Russian typography:** headings use the Cyrillic subsets of the same fonts. Accent lines in Church Slavonic use Ponomar. Russian Orthodox terminology is standardized in `i18n/glossary.en-ru.json`.

**Adding a language** (e.g. Serbian):

1. Add `{ "code": "sr", "label": "SRB", "name": "Српски", "ogLocale": "sr_RS" }` to `site.locales`.
2. Add `"sr"` to every entry in `ui.json`. Missing entries fall back to English.
3. Translate content fields, or run `npm run translate -- --to sr` with a key (§8). Until then, those fields fall back to English, marked with `lang="en"`.
4. Optionally add `i18n/glossary.en-sr.json`.

The build then produces `/sr/...` pages, hreflang entries, sitemap entries and a three-way language switch with no code changes.

## 8. Machine translation script

`scripts/translate.mjs` is an **optional, standalone** tool. The build never calls it and never needs a network connection or key. It fills in missing translations in `content/**/*.json` using DeepL or Google Cloud Translation.

```bash
export DEEPL_API_KEY=…              # preferred (Free keys end in ":fx")
# or
export GOOGLE_TRANSLATE_API_KEY=…   # Google Cloud Translation API v2 (Basic)

npm run translate -- --dry-run      # list what would be translated, change nothing
npm run translate                   # translate missing/outdated fields, write content files
npm run translate:check             # status report, no key needed
npm run translate -- --to ru        # one locale only
npm run translate -- --seed         # accept the current text as the reviewed baseline
```

With no key, it prints a notice and exits 0. The site still builds, and any untranslated field shows the source language.

**Rules.** The script never overwrites human work:

- Anything inside an object with `"ru_locked": true` (generally `"<locale>_locked"`) is never written. The parish's own Russian texts, the prayers and the liturgical texts are locked.
- `i18n/state.<locale>.json` stores, for each field (e.g. `pages/home.json#sections.[community].title`, where array items are addressed by id), a hash of the source text and a hash of the machine output.
  - If the target text no longer matches the machine hash, a person edited it, and it is treated as human text from then on.
- Empty or missing target text is translated.
- Machine text whose English source has changed is translated again.
- Human text whose English source has changed is **reported as "needs review"**, never rewritten.
  - After review, run `--seed` to accept the current text.
- Before sending text, the script protects URLs, email addresses, phone numbers, Markdown link targets, inline code and `{placeholders}`:
  - for DeepL, with `<keep>` tags plus `tag_handling: xml`, `formality: prefer_more` and a glossary built from `i18n/glossary.en-ru.json`;
  - for Google, with `<span translate="no">` and HTML format.
- Content files are rewritten with stable formatting (`src/lib/json-format.mjs`), so diffs stay small.

`--check` prints counts: human, locked, machine, missing, outdated, review. Add `--strict` to make CI fail when anything is missing. `I18N_DIR` moves the state and glossary folder, e.g. one per parish.

## 9. OrthodoxConnect integration

Two section types are placeholder integration points. **The data is clearly marked as sample until the API exists.**

### 9.1 Configuration (`site.json`)

```json
"integrations": {
  "orthodoxconnect": {
    "enabled": true,
    "sampleFeed": "integrations/orthodoxconnect.sample.json",
    "joinUrl": "",
    "parishId": ""
  }
}
```

- `joinUrl` is the parish's invitation or deep link in the app. While it is empty, `orthodoxconnect-cta` shows a disabled "Coming soon" button instead of a dead link.
- `parishId` is the parish's OrthodoxConnect id, passed back in the feed.
- `enabled: false` hides both sections everywhere, with no empty wrappers left behind.

### 9.2 Feed contract (`schemas/orthodoxconnect-feed.schema.json`, version 1)

```json
{
  "version": 1,
  "isSample": false,
  "parishId": "…",
  "generatedAt": "2027-01-01T12:00:00Z",
  "items": [
    {
      "id": "evt_123",
      "kind": "event",
      "status": "open",
      "title": { "en": "…", "ru": "…" },
      "summary": { "en": "…", "ru": "…" },
      "startsAt": "2027-01-16T10:00:00-08:00",
      "endsAt": "2027-01-16T14:00:00-08:00",
      "location": "Church Hall",
      "slots": { "needed": 20, "filled": 8 },
      "url": "https://…/rsvp/evt_123",
      "cta": { "en": "RSVP", "ru": "Записаться" }
    },
    {
      "id": "need_9",
      "kind": "need",
      "title": "…",
      "quantity": { "needed": 10, "fulfilled": 6, "unit": { "en": "items", "ru": "шт." } },
      "url": "https://…"
    }
  ]
}
```

- `kind` is one of `event`, `volunteer` or `need`.
- Only `open` and `full` items are shown. `closed` and `cancelled` items are dropped.
- `slots` and `quantity` render as progress bars.
- `url: null` renders a disabled button.
- `startsAt` and `endsAt` are ISO 8601 with an offset, and are displayed in `site.timezone`.
- Text fields accept plain strings or localized objects.
- `isSample: true`, as in the bundled `content/integrations/orthodoxconnect.sample.json`, adds a visible "Sample data" banner and a "Sample" badge on every card. The live API must send `false` or omit it.

### 9.3 Getting live data in

- **At build time:** `ORTHODOXCONNECT_FEED_URL=https://api…/parishes/<id>/feed npm run build`.
  - The build fetches the feed and validates it against the schema.
  - If the request or validation fails, it logs a warning and falls back to the sample feed. A failed API call never breaks the build.
- **In the builder:** store the feed under `content.orthodoxconnect` before rendering, or pass `feedOverride` to `loadContent()`.
- **In the browser:** rendered cards carry stable hooks for a script that refreshes them live (e.g. slot counts):
  - `data-oc-feed` on the list;
  - `data-oc-id` and `data-oc-kind` on each card;
  - `data-oc-join` on the join button.

## 10. Wiring into a builder or editor

The template is designed to be the rendering layer of a builder. A suggested mapping:

| Builder concern | Template piece |
|---|---|
| Database tables / collections | One per content file. Arrays of objects with `id` (people, events, news, documents, services.upcoming…) become rows. |
| Editor forms | Generate from `schemas/*.schema.json`: `title` and `description` for labels and help, `enum` for selects, `format: date`/`time`/`email`/`uri` for inputs, `$ref: common#/$defs/localized` for a tabbed field (one tab per locale). |
| Rich text | Fields typed `markdown` (`common#/$defs/markdown`). |
| Page builder | `pages/<id>.json` → `sections[]`. Section types and their props come from the `section-*` definitions, and `meta.title`/`meta.description` in the registry give palette labels. |
| Pickers | Fields that reference ids (`person`, `document`, `gallery`, `funds`, `groups`, `page`) should be dropdowns over the matching collection. |
| Validation | `import { validateContentFile, checkReferences } from './scripts/validate.mjs'`. Run it on save; the error strings are human-readable paths. |
| Theming UI | `theme/tokens.json` with `schemas/tokens.schema.json`. |
| Locks and review | Show `needsReview` notes to editors. Offer a "lock Russian" toggle that sets `ru_locked`. |
| Writing files | `formatJson(value)` from `src/lib/json-format.mjs` gives stable, diff-friendly output. |

**Rendering options:**

1. **Full static build per parish (simplest):** export a parish's data to a folder and run `CONTENT_DIR=… PUBLIC_DIR=… OUT_DIR=… SITE_URL=… BASE_PATH=… node src/build.mjs`. `build()` is also exported for in-process use and returns `{ content, out }`.
2. **Live preview of one section or page** inside the editor:

   ```js
   import { loadContent } from './src/lib/content.mjs';
   import { createContext } from './src/lib/context.mjs';
   import { renderSection } from './src/components/registry.mjs';
   import { renderPage } from './src/components/layout.mjs';

   const content = loadContent();                      // or build the same object from your DB
   const page = content.index.pages.home;
   const ctx = createContext({ content, locale: 'ru', page, siteUrl: content.site.url });
   const sectionHtml = String(renderSection(page.sections[1], ctx));
   const pageHtml = renderPage(ctx, { cssHref: '/assets/site.css', jsHref: '/assets/site.js' });
   ```

   Components are pure and synchronous, so re-rendering on each keystroke is cheap. Every section's outer element carries `data-section-type` and its `id`, so the editor can map a click in the preview back to the data.
3. **Porting the components to another stack:** the components are small template functions with no runtime dependencies, so they translate directly into JSX, Liquid or another template language. The CSS and tokens can be reused unchanged.

## 11. Setting up another parish

1. Copy `content/` to a new folder, e.g. `parishes/st-nicholas/content/`, and `public/` to `parishes/st-nicholas/public/`.
2. In `site.json`, set:
   - `id`, `url`, `name`, `shortName`, `location`, `jurisdiction`, `timezone`;
   - `contact` (address, phone, email, `mapEmbedUrl`, `directionsUrl`);
   - `social`, `livestreamUrl`;
   - `logo` (files in `public/logo/`);
   - `seo` (site name, description, default image);
   - `locales` and `sourceLocale`;
   - `integrations.orthodoxconnect` (`parishId`, `joinUrl`).
3. Copy `theme/tokens.json`, change the palette and fonts, and point `site.theme.tokens` at the copy.
4. Replace `people`, `services`, `events`, `news`, `ministries`, `giving`, `documents`, `links` and `galleries`. Delete what you don't need, but keep each file with an empty array.
5. Edit `navigation.json` and the pages. Remove pages you don't need and their menu entries. Reuse section ids so anchors stay meaningful.
6. Empty `redirects.json`, or fill it with that parish's old URLs.
7. For PayPal, set `giving.paypal.business` to the parish treasurer's PayPal address.
8. Build and check:

   ```bash
   CONTENT_DIR=parishes/st-nicholas/content PUBLIC_DIR=parishes/st-nicholas/public \
   OUT_DIR=dist/st-nicholas node scripts/validate.mjs && \
   CONTENT_DIR=parishes/st-nicholas/content PUBLIC_DIR=parishes/st-nicholas/public \
   OUT_DIR=dist/st-nicholas node src/build.mjs && \
   OUT_DIR=dist/st-nicholas CONTENT_DIR=parishes/st-nicholas/content node scripts/check-links.mjs
   ```

   `validate` reports every broken reference, missing image and missing source-language text.
9. Seed the translation state for that parish: `I18N_DIR=parishes/st-nicholas/i18n CONTENT_DIR=… npm run translate -- --seed`.

## 12. Deploying

`dist/` is a plain static site, so any web server, object storage bucket or CDN can serve it.

- Set `SITE_URL` to the public origin, and `BASE_PATH` if the site lives under a sub-path.
- Serve `404.html` for unknown paths. It is the English "page not found" page, with the full header (including the language switch) and links to the main pages.
- `index.html` at the root picks the language. For SEO it carries `hreflang` alternates and a canonical link to `/en/`.
- **Old URLs:** `redirects.json` writes a small forwarding page at every old `.html` address, which works on any static host. If your server supports real redirects, generate 301s from the same file and drop the stubs.
- **Legacy uploads:** some large files (old schedules, choir scores, newsletters) still link to `https://www.allrussiansaintsburlingame.org/files/...` on the parish's current site instead of being copied into the repo. **If the new site replaces the old one on that domain, keep serving the old `/files/` folder** (copy it into `public/files/` or proxy it), or move the files and update the `url`s in `documents.json`. `npm run check-links:external` reports any that break.
- Cache `assets/site.css` and `assets/site.js` aggressively. Their URLs carry a content hash (`?v=`), and HTML should be revalidated.
- Third-party requests are limited to:
  - YouTube thumbnails (`i.ytimg.com`), plus the player once a visitor clicks;
  - the Google Maps embed on the contact page;
  - the PayPal form post.

## 13. Quality checks

`npm test` (also run in CI) does the following:

- **Validation:** every content file must match its schema, and every reference must resolve.
- **Build:** all pages in all locales.
- **Link check:**
  - every internal `href`/`src`/`srcset`/`poster`, every `#anchor`, `og:image`, CSS `url()`;
  - `alt` on every image, `hreflang` pairs, the language-switch targets and every sitemap URL;
  - same-origin links to paths the build does not produce (e.g. `/files/` on the live site) are treated as external.
- **Translation status:** missing, outdated and needs-review counts.

`npm run check-links:external` also requests every external URL (8 parallel workers). Social networks that block bots and 403/429 responses are reported as warnings, not failures.
