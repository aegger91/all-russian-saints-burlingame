# Orthodox parish website template (blank)

This is a bilingual (English/Russian) static website template for Orthodox parishes. It is filled with **sample content** for a fictional parish, "St. Example Orthodox Church" (Храм святого Примера). Every name, address, phone number, date and image in it is a placeholder.

How it is put together:

- All content is structured JSON in `content/`, with a JSON Schema for each content type in `schemas/`.
- Sections are reusable components, themed from one design tokens file.
- Each page is built in both languages, at `/en/...` and `/ru/...`.
- There is a placeholder integration for the OrthodoxConnect app, with clearly labeled sample data.

It does not depend on any framework, CMS or hosting vendor.

| Folder | Contents |
|---|---|
| `content/` | All site content as JSON. Every file names its schema in `$schema`. `pages/<id>.json` holds an ordered list of sections. |
| `schemas/` | JSON Schema for every content type, the design tokens and the OrthodoxConnect feed contract. |
| `theme/` | `tokens.json` (the default theme) and `examples/burgundy.json` (an alternate theme). Each value becomes a CSS variable (`semantic.brand` → `--brand`). |
| `public/` | Logo, images, documents and fonts, copied to the site as they are. |
| `src/components/` | One render function per section type, listed in `registry.mjs`. |
| `scripts/` | `validate`, `check-links`, `translate` and the dev server. |

## Customizing

| What | Where |
|---|---|
| Colors and fonts | A tokens file. Colors live in `color` (the palette) and `semantic` (what the components use), font stacks in `font`, self-hosted web fonts in `fontFaces` and hosted fonts in `fontImports`. Set `site.theme.tokens` in `content/site.json` to the file to use, e.g. `"theme/examples/burgundy.json"`. |
| Logo | `site.logo.src` (plus `alt`) is the only required field. The header, footer, favicon and structured data all fall back to it. Optional variants: `header`, `footer`, `favicon`, `faviconPng`, `appleTouchIcon`, `square`. |
| Sections per page | `content/layout.json`. For each page, `order` sets the order of the sections and `disabled` switches sections off, by section id. The page files stay untouched. Unknown ids fail validation. |
| Menus and footer | `content/navigation.json`. |

## Replacing the sample content

1. `content/site.json`: name, address, phone, email, social links, livestream, logo, SEO text, and `mapEmbedUrl` (a Google Maps embed URL). Until a map URL is set, the contact page shows a styled map placeholder.
2. `public/logo/` and `public/assets/img/`: your logo and photos. Then update the paths and `alt` texts in the JSON.
3. `content/people.json`, `services.json`, `events.json`, `news.json`, `ministries.json`, `galleries.json`, `documents.json` (with the PDFs in `public/assets/docs/`) and `links.json`.
4. `content/giving.json`: set `paypal.business` to the parish PayPal account, plus the funds and dues. The sample payee `donations@example.org` is not a real account.
5. `content/pages/*.json`: page texts. Search for "sample" and "образец" to find what is left.
6. `content/redirects.json`: old addresses that should keep working (`{ "from": "/donate.html", "page": "give" }`). Each one becomes a small page that forwards to the new page in the visitor's language.
7. Run `npm test`.

Dated items (services, events) hide automatically once their date has passed, so the sample schedule empties over time.

## Build and run

Requires Node 20 or later.

```bash
npm ci
npm run dev     # http://localhost:4321, rebuilds on change
npm run build   # validate content and write the static site to dist/
npm test        # build + link check in both languages + translation status
```

**Deploy:** upload `dist/` to any static host or web server.

- Set `SITE_URL=https://your-domain` when building so canonical, hreflang, Open Graph and sitemap URLs are absolute.
- Set `BASE_PATH=/sub/path` if the site does not live at the domain root.
- Serve `404.html` for unknown paths.

There is no server-side code. The PayPal buttons post directly to PayPal, and videos and maps are standard YouTube and Google Maps embeds.

`node scripts/check-links.mjs --external` also requests every external link. The placeholder `example.com/.net/.org` links are skipped.

## Translation (optional)

The sample content is complete in both languages. When editors add English text later, the optional script can produce a first Russian draft.

```bash
export DEEPL_API_KEY=...             # preferred; or:
export GOOGLE_TRANSLATE_API_KEY=...
npm run translate -- --dry-run       # see what would be translated
npm run translate                    # fill in missing Russian text
npm run translate:check              # status report (no key needed)
```

- Keys are read only from the environment. Never commit them.
- With no key, the build still succeeds and untranslated text is shown in English.
- The script never overwrites text a person wrote or edited, or anything marked `"ru_locked": true`.
- When the English source of human-written Russian text changes, the script flags it for review instead of rewriting it.
- After replacing the sample content by hand in both languages, run `node scripts/translate.mjs --seed` to record it as the reviewed baseline.
- The full rules are in the header comment of `scripts/translate.mjs`.
