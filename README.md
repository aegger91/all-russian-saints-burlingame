# Orthodox parish website template

This is a bilingual (English/Russian) static website template for Orthodox parishes. It is built and demonstrated with the content of the **Church of All Russian Saints, Burlingame (ROCOR)**.

How it is put together:

- All content is structured JSON in `content/`, with a JSON Schema for each content type in `schemas/`.
- Sections are reusable components, themed from one design tokens file.
- Each page is built in both languages, at `/en/...` and `/ru/...`.
- There is a placeholder integration for the OrthodoxConnect app.

It does not depend on any framework, CMS or hosting vendor.

| Folder | Contents |
|---|---|
| `content/` | All site content as JSON. Every file names its schema in `$schema`. `pages/<id>.json` holds an ordered list of sections. |
| `schemas/` | JSON Schema for every content type, the design tokens and the OrthodoxConnect feed contract. |
| `theme/tokens.json` | Colors, type, spacing, radii and layout. Each value becomes a CSS variable (`color.navy` → `--color-navy`). |
| `src/components/` | One render function per section type, listed in `registry.mjs`. |
| `scripts/` | `validate`, `check-links`, `translate` and the dev server. |

## Customizing

| What | Where |
|---|---|
| Colors and fonts | `theme/tokens.json`. Colors live in `color`/`semantic`, font stacks in `font`, and the web-font files in `fontFaces` (or `fontImports` for hosted fonts). Point `site.theme.tokens` at another tokens file to switch themes. |
| Logo | `site.logo.src` (plus `alt`) is the only required field. Header, footer, favicon and structured data all fall back to it. |
| Sections per page | `content/layout.json`. Use `order` to set the section order and `disabled` to switch sections off, without editing the page files. |

## Build and run

Requires Node 20 or later.

```bash
npm ci
npm run dev     # http://localhost:4321, rebuilds on change
npm run build   # validate content and write the static site to dist/
npm test        # build + link check in both languages + cross check + translation status
```

**Deploy:** upload `dist/` to any static host or web server.

- Set `SITE_URL=https://your-domain` when building so canonical, hreflang, Open Graph and sitemap URLs are absolute.
- Set `BASE_PATH=/sub/path` if the site does not live at the domain root.
- Serve `404.html` for unknown paths.

There is no server-side code. The PayPal buttons post directly to PayPal, and the videos and map are standard YouTube and Google Maps embeds.

**Old URLs keep working.** Every page of the old site (`/ourparish.html`, `/donate.html` and so on) gets a small forwarding page that opens the new page in the visitor's language. The list is in `content/redirects.json`, and the mapping is the table below. A server that supports real redirects can turn the same list into 301s.

**Legacy files.** Large PDFs (older schedules, choir scores, newsletters, the school calendar) are linked at their current addresses, `https://www.allrussiansaintsburlingame.org/files/...`, instead of being copied into this repo. If the new site replaces the old one on the same domain, keep the old `/files/` folder online, or move the files and update `content/documents.json`.

Every cross on the site is one shared SVG symbol, the Russian Orthodox eight-pointed cross: `CROSS_PATH` in `src/components/_primitives.mjs`, used through `cross()`. `npm run check-crosses` fails if a page uses the ☦ text glyph or if any cross in the pages or in `public/` SVGs has its footrest the wrong way round (its left end must be higher).

Pictograms are Orthodox only (church, candle, chalice, censer, bell, Gospel, prayer rope, icon frame, cross), drawn in the same 1.5px line style as the utility icons (menu, arrows, mail, phone, pin, calendar, social). A card can show one via `"icon"`; the full list is the `iconName` enum in `schemas/common.schema.json`.

## Translation (optional)

The Russian text in this repository is complete:

- The parish's own Russian texts are used as written, and marked `ru_locked`.
- All other text was translated by hand, using Orthodox liturgical terminology.

When editors add English text later, the optional script can produce a first Russian draft.

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
- The full rules are in the header comment of `scripts/translate.mjs`.

## Menu mapping (old site → new site)

Every item of the old site's menu is still reachable. Paths are shown for English; the Russian site has the same paths under `/ru/`.

| Old menu item | Old URL | New location |
|---|---|---|
| About Us › Our Parish | `/ourparish.html` | Our Parish › Our Parish — `/en/parish/` |
| About Us › Clergy | `/clergy.html` | Our Parish › Clergy & Parish Council — `/en/clergy/` |
| About Us › Archpriest Stefan Bio | `/archprieststefanbio.html` | `/en/clergy/#biography` |
| About Us › Parish Council Members | `/parishcouncilmembers.html` | `/en/clergy/#council` |
| About Us › Parish History | `/parishhistory.html` | Our Parish › Parish History — `/en/history/` |
| About Us › Parish Membership | `/parishmembership.html` | Our Parish › Parish Membership — `/en/parish/#membership` (dues: `/en/give/#dues`) |
| About Us › Stewardship | `/stewardship.html` | Our Parish › Stewardship — `/en/parish/#stewardship` (also `/en/give/#stewardship`) |
| About Us › About Orthodoxy | `/aboutorthodoxy.html` | Our Parish › About Orthodoxy — `/en/orthodoxy/` |
| About Us › Parish By-Laws | `/parishbylaws.html` | Our Parish › Parish By-Laws — `/en/parish/#bylaws` |
| Schedule | `/schedule.html` | Services — `/en/services/` (monthly PDFs: `#monthly-schedules`; older schedules: `#schedules`) |
| Choir › Choir History | `/choirhistory.html` | Community › Choir — `/en/choir/#history` |
| Choir › Choir Members | `/choirmembers.html` | `/en/choir/#members` |
| Choir › Call for Singers | `/callforsingers.html` | `/en/choir/#call-for-singers` |
| Choir › Conductor | `/conductor.html` | `/en/choir/#conductor` |
| Choir › Contact Information | `/contactinformation.html` | `/en/choir/#conductor` (conductor's contacts) |
| Choir › Choir Concerts | `/choirconcerts.html` | `/en/choir/#concerts` |
| Choir › Workshops | `/workshops.html` | `/en/choir/#workshops` |
| Choir › Other Links | `/otherlinks.html` | `/en/choir/#other-links` |
| Choir › Music Library | `/musiclibrary.html` | `/en/choir/#library` |
| Sisterhood › About Sisterhood | `/aboutsisterhood.html` | Community › Sisterhood — `/en/sisterhood/#about` |
| Sisterhood › Sisterhood Schedule | `/sisterhoodschedule.html` | `/en/sisterhood/#events` (hall rental: `#hall`) |
| Russian School | `/russianschool1.html` | Community › Russian School — `/en/school/` |
| Russian School › About Russian School | `/aboutrussianschool.html` | `/en/school/#about` (goals: `#goals`) |
| Russian School › Russian School News | `/russianschoolnews.html` | `/en/school/#registration` |
| Russian School › Calendar 2024–2025 | `/russianschoolcalendar20242025.html` | `/en/school/#registration` (current calendar PDF) |
| Russian School › Teacher Contact Information | `/teachercontactinformation.html` | `/en/school/#teachers` |
| Russian School › 2022 Akt and White Ball | `/russianschool2022aktandwhiteball.html` | `/en/school/#akt` |
| Russian School › Yolka January 8, 2023 | `/russianschoolyolkajanuary82023.html` | `/en/school/#yolka` |
| Newsletter › Current Newsletter | `/currentnewsletter.html` | Newsletter — `/en/newsletter/#current` |
| Newsletter › Newsletter Archives | `/newsletterarchives.html` | `/en/newsletter/#archive` |
| Newsletter › Index to Theological Questions | `/indextotheologicalquestions.html` | `/en/newsletter/#indexes` |
| Newsletter › Index to Biographies | `/indextobiographies.html` | `/en/newsletter/#indexes` |
| Newsletter › Subscribe to Newsletter | `/subscribetonewsletter.html` | `/en/newsletter/#subscribe` |
| Livestream | YouTube channel | Top bar "Livestream" link, `/en/services/#livestream`, footer |
| Donate | `/donate.html` | Header "Give" button — `/en/give/` (PayPal buttons and dues) |
| Contact Us | `/contactus.html` | Contact — `/en/contact/` |
| (Facebook) | facebook.com page | Footer and `/en/contact/#visit` |

New on the site: News (`/en/news/`), Upcoming Services on the home page, and the OrthodoxConnect sample feed and join invitation (home page, `#join-orthodoxconnect`).

## Content to confirm with the parish

Nothing was invented. Where the old site contradicts itself, the template keeps the most-used value and marks the item with a `needsReview` note in the JSON. Search for `needsReview` to find them all.

**Schedule**

- **Sunday Liturgy time:** the Our Parish page says 9:30am, but every Sunday in the current Upcoming Services list says 9:00am. The standing weekly schedule is hidden until this is confirmed.
- **"Friday, December 3":** the old site lists this Liturgy under that date. In 2026, Friday falls on December 4, the date of the feast, so it is listed as Friday, December 4.
- **Concert date:** the 2015 choir concert is dated "Sunday, October 15, 2015", but that date was a Thursday.
- **Russian School class days:** the school page says Tuesdays and Saturdays, but the school's information letter says Tuesdays only.

**Contact details**

- **Clergy emails:**
  - Fr Stefan: the old site uses @netscape.net in some places and @netscape.com in others (stefanvpavlenko / stefanpavlenko).
  - Deacon Alexei: the email shown (alexeibaranoff@gmail.com) differs from the one the link opens (alex@blackdiamondpaving.com).
- **Phone numbers:**

  | Person | Values on the old site |
  |---|---|
  | Luba Gauschieldt | (415) 706-1605 / (650) 591-1605 |
  | Matushka Tatiana | (650) 430-9806 / (650) 438-9806 |
  | Dimitry Bobroff | (408) 267-6918 / (408) 257-6918 |

- **Email:** Natalya Lytneva — yahoo.com / icloud.com.

**Dated or outdated text**

- **First Hierarch:** About Orthodoxy (text from 2019) names Metropolitan Hilarion; the news page names Metropolitan Nicholas.
- **Choir:** the choir pages still describe Andrei Roudenko as conductor, under a notice that Irina Shachneva directs the choir since 2022.
- Several pages carry text written for past years. It was kept as written, with its dates.

**Missing material**

- There are no biographies or photos for the deacon and the parish council; those cards show names and contacts only.
- **Removed video:** the YouTube film about St. John of Shanghai linked from the news page is no longer available on YouTube. The news item keeps its photo and text; ask the parish for a current link.
- The Russian spellings of some names and titles should be checked by the parish.

**Changes made for the new site**

- Obvious typos in the parish's Russian texts were corrected.
- The St. Herman's West youth conference (a diocesan event) is no longer tagged with a "youth" ministry, because the parish has no youth ministry listed.
- **PayPal:** buttons, payee (coarstreasurer@gmail.com), funds and dues are unchanged. The old platform's IPN `notify_url` and `custom` fields were dropped, so the treasurer should confirm nothing relied on them.

**Logo and naming**

- The logo files are labeled "sample, not yet approved" in `public/logo/README.txt`.
- The Russian line of the logo reads «Храм Всех Святых…», while the official name in `content/site.json` uses «Церковь Всех Святых…». The parish's own texts use both. Confirm which the parish prefers for the name.
