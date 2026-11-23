// Page shell: <head> (SEO, Open Graph, hreflang, JSON-LD), utility bar,
// header with navigation and language switch, on-page sub-navigation,
// footer. Data: site.json, navigation.json, ui.json.
import { html, raw, attrs, cx } from '../lib/html.mjs';
import { SPRITE, icon, cross, phoneHref } from './_primitives.mjs';
import { renderSection } from './registry.mjs';
import { addressLines } from './contact.mjs';

function pageUrls(ctx) {
  return Object.fromEntries(ctx.localeCodes.map((code) => [code, ctx.pagePath(ctx.page.id, { locale: code })]));
}

function langSwitch(ctx, className) {
  const urls = pageUrls(ctx);
  return html`<div class="${cx('lang-switch', className)}" role="group" aria-label="${ctx.t('a11y.language')}">
    ${ctx.site.locales.map(
      (l) => html`<a${attrs({
        class: 'lang-switch__link',
        href: urls[l.code],
        hreflang: l.code,
        lang: l.code,
        'aria-current': l.code === ctx.locale ? 'true' : null,
        'data-lang': l.code,
        title: l.name
      })}>${l.label}</a>`
    )}
  </div>`;
}

function isCurrent(item, ctx) {
  if (item.page === ctx.page.id && !item.anchor) return true;
  return (item.children || []).some((c) => c.page === ctx.page.id);
}

function navItem(item, ctx) {
  const current = isCurrent(item, ctx);
  if (item.children?.length) {
    return html`<li class="${cx('nav__item', 'nav__item--parent', current && 'is-current')}">
      <button class="nav__link nav__toggle" type="button" aria-expanded="false" aria-controls="nav-${item.id}">
        <span>${ctx.l(item.label)}</span>${icon('chevron', 'nav__chevron')}
      </button>
      <ul class="nav__dropdown" id="nav-${item.id}">
        ${item.children.map(
          (c) => html`<li><a${attrs({ class: 'nav__sublink', href: ctx.href(c), 'aria-current': c.page === ctx.page.id && !c.anchor ? 'page' : null })}>${ctx.l(c.label)}</a></li>`
        )}
      </ul>
    </li>`;
  }
  return html`<li class="${cx('nav__item', current && 'is-current')}"><a${attrs({ class: 'nav__link', href: ctx.href(item), 'aria-current': current ? 'page' : null })}>${ctx.l(item.label)}</a></li>`;
}

function topbar(ctx) {
  const tb = ctx.content.navigation.topbar;
  if (!tb || tb.enabled === false) return '';
  const c = ctx.site.contact;
  return html`<div class="topbar">
    <div class="container topbar__inner">
      <p class="topbar__info">
        ${tb.showAddress ? html`<span class="topbar__item">${icon('pin', 'topbar__icon')}${addressLines(ctx).join(', ')}</span>` : ''}
        ${tb.showPhone && c.phone ? html`<a class="topbar__item" href="${phoneHref(c.phone)}">${icon('phone', 'topbar__icon')}${c.phone.display}</a>` : ''}
      </p>
      <ul class="topbar__links">
        ${tb.links.map((l) => {
          const url = ctx.href(l);
          const ext = ctx.isExternal(url);
          return html`<li><a class="topbar__item" href="${url}"${ext ? html` target="_blank" rel="noopener"` : ''}>${l.icon ? icon(l.icon, 'topbar__icon') : ''}<span>${ctx.l(l.label)}</span></a></li>`;
        })}
      </ul>
    </div>
  </div>`;
}

function header(ctx) {
  const nav = ctx.content.navigation.header;
  const logo = ctx.logo.header;
  return html`<header class="site-header" data-header>
    <div class="container site-header__inner">
      <a class="brand" href="${ctx.pagePath('home')}">
        <img class="brand__logo" src="${ctx.asset(logo.src)}" alt="${ctx.l(logo.alt)}" width="${logo.width}" height="${logo.height}">
      </a>
      <nav class="nav" id="site-nav" aria-label="${ctx.t('a11y.mainNav')}" data-nav>
        <ul class="nav__list">${nav.items.map((i) => navItem(i, ctx))}</ul>
        <div class="nav__mobile-extra">
          ${nav.actions.map((a) => html`<a class="btn btn--${a.style || 'primary'} btn--block" href="${ctx.href(a)}">${ctx.l(a.label)}</a>`)}
          ${langSwitch(ctx, 'lang-switch--mobile')}
        </div>
      </nav>
      <div class="site-header__tools">
        ${langSwitch(ctx, 'lang-switch--header')}
        ${nav.actions.map((a) => html`<a class="btn btn--${a.style || 'primary'} site-header__action" href="${ctx.href(a)}">${a.icon ? icon(a.icon, 'btn__icon') : ''}<span>${ctx.l(a.label)}</span></a>`)}
        <button class="burger" type="button" aria-expanded="false" aria-controls="site-nav" data-burger>
          ${icon('menu', 'burger__open')}${icon('close', 'burger__close')}<span class="visually-hidden">${ctx.t('a11y.menu')}</span>
        </button>
      </div>
    </div>
  </header>`;
}

function pageNav(ctx) {
  if (!ctx.page.subnav) return '';
  const items = [];
  const collect = (s) => {
    if (s.hidden || (s.locales && !s.locales.includes(ctx.locale))) return;
    if (s.navLabel && s.id) items.push({ id: s.id, label: ctx.l(s.navLabel) });
    if (Array.isArray(s.columns)) s.columns.forEach(collect);
    if (Array.isArray(s.blocks)) s.blocks.forEach(collect);
  };
  ctx.page.sections.forEach(collect);
  if (items.length < 2) return '';
  return html`<nav class="page-nav" aria-label="${ctx.t('a11y.onThisPage')}" data-page-nav>
    <div class="container"><ul class="page-nav__list">${items.map((i) => html`<li><a class="page-nav__link" href="#${i.id}">${i.label}</a></li>`)}</ul></div>
  </nav>`;
}

function footer(ctx) {
  const f = ctx.content.navigation.footer;
  const logo = ctx.logo.footer;
  const c = ctx.site.contact;
  const year = new Date().getFullYear();
  return html`<footer class="site-footer">
    <div class="container">
      <div class="site-footer__brand">
        <a href="${ctx.pagePath('home')}" class="${cx('site-footer__logo-link', ctx.logo.footerTile && 'site-footer__logo-link--tile')}"><img class="site-footer__logo" src="${ctx.asset(logo.src)}" alt="${ctx.l(logo.alt)}" width="${logo.width}" height="${logo.height}" loading="lazy"></a>
        <div class="site-footer__intro">
          <p class="site-footer__about">${ctx.l(f.about)}</p>
          <p class="site-footer__slavonic" lang="ru">${ctx.site.name.ru}</p>
        </div>
      </div>
      <div class="site-footer__top">
        <div class="site-footer__visit">
          <h2 class="site-footer__title">${ctx.t('footer.visit')}</h2>
          <address class="site-footer__address">${addressLines(ctx).map((l, i) => html`${i ? html`<br>` : ''}${l}`)}</address>
          <ul class="site-footer__contact">
            ${c.phone ? html`<li><a href="${phoneHref(c.phone)}">${icon('phone', 'site-footer__icon')}${c.phone.display}</a></li>` : ''}
            ${c.email ? html`<li><a href="mailto:${c.email}">${icon('mail', 'site-footer__icon')}${c.email}</a></li>` : ''}
            <li><a href="${ctx.pagePath('contact', { anchor: 'visit' })}">${icon('pin', 'site-footer__icon')}${ctx.t('footer.mapDirections')}</a></li>
          </ul>
        </div>
        ${f.columns.map(
          (col) => html`<div class="site-footer__col">
            <h2 class="site-footer__title">${ctx.l(col.title)}</h2>
            <ul class="site-footer__links">${col.links.map((l) => {
              const url = ctx.href(l);
              const ext = ctx.isExternal(url);
              return html`<li><a href="${url}"${ext ? html` target="_blank" rel="noopener"` : ''}>${l.icon ? icon(l.icon, 'site-footer__icon') : ''}${ctx.l(l.label)}</a></li>`;
            })}</ul>
          </div>`
        )}
      </div>
      <div class="site-footer__bottom">
        <p>${cross('site-footer__cross')}<span>© ${year} ${ctx.l(ctx.site.name)}. ${ctx.l(f.legal)}</span></p>
        ${langSwitch(ctx, 'lang-switch--footer')}
      </div>
    </div>
  </footer>`;
}

function jsonLd(ctx) {
  const s = ctx.site;
  const a = s.contact.address;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Church',
    name: ctx.l(s.name),
    alternateName: s.name.ru && ctx.locale !== 'ru' ? s.name.ru : s.name.en,
    url: ctx.absoluteUrl(ctx.pagePath('home')),
    logo: ctx.absoluteUrl(ctx.asset(ctx.logo.square)),
    telephone: s.contact.phone?.e164,
    email: s.contact.email,
    address: { '@type': 'PostalAddress', streetAddress: a.street, addressLocality: a.city, addressRegion: a.region, postalCode: a.postalCode, addressCountry: a.country },
    geo: s.contact.geo ? { '@type': 'GeoCoordinates', latitude: s.contact.geo.lat, longitude: s.contact.geo.lng } : undefined,
    sameAs: s.social.map((x) => x.url),
    parentOrganization: s.jurisdiction ? { '@type': 'Organization', name: ctx.l(s.jurisdiction.name), url: s.jurisdiction.url } : undefined
  };
  return raw(`<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`);
}

function head(ctx, assets) {
  const { cssHref, jsHref } = assets;
  const { site, page } = ctx;
  const seo = page.seo || {};
  const siteName = ctx.l(site.seo.siteName);
  const pageTitle = ctx.l(seo.title) || ctx.l(page.title);
  const title = page.id === 'home' ? ctx.l(site.seo.title) : `${pageTitle} · ${siteName}`;
  const description = ctx.l(seo.description) || ctx.l(site.seo.description);
  const urls = pageUrls(ctx);
  const canonical = ctx.absoluteUrl(urls[ctx.locale]);
  const ogImage = ctx.absoluteUrl(ctx.asset(seo.image || site.seo.image));
  const fontsPreload = assets.preloadFonts || [];
  return html`<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
${page.noindex ? html`<meta name="robots" content="noindex">\n` : ''}<link rel="canonical" href="${canonical}">
${ctx.localeCodes.map((code) => html`<link rel="alternate" hreflang="${code}" href="${ctx.absoluteUrl(urls[code])}">\n`)}<link rel="alternate" hreflang="x-default" href="${ctx.absoluteUrl(urls[ctx.sourceLocale])}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${siteName}">
<meta property="og:title" content="${page.id === 'home' ? title : pageTitle}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImage}">
<meta property="og:locale" content="${ctx.localeInfo.ogLocale}">
${ctx.site.locales.filter((l) => l.code !== ctx.locale).map((l) => html`<meta property="og:locale:alternate" content="${l.ogLocale}">\n`)}<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="${site.theme?.themeColor || '#174372'}">
<link rel="icon" href="${ctx.asset(ctx.logo.favicon)}"${/\.svg$/i.test(ctx.logo.favicon) ? html` type="image/svg+xml"` : ''}>
${ctx.logo.faviconPng ? html`<link rel="icon" href="${ctx.asset(ctx.logo.faviconPng)}" type="image/png" sizes="32x32">\n` : ''}${ctx.logo.appleTouchIcon ? html`<link rel="apple-touch-icon" href="${ctx.asset(ctx.logo.appleTouchIcon)}">\n` : ''}${fontsPreload.map((f) => html`<link rel="preload" href="${ctx.asset(f)}" as="font" type="font/woff2" crossorigin>\n`)}<link rel="stylesheet" href="${cssHref}">
<script src="${jsHref}" defer></script>
${jsonLd(ctx)}
</head>`;
}

export function renderPage(ctx, assets) {
  const { page } = ctx;
  return `<!doctype html>
<html lang="${ctx.locale}" data-page="${page.id}" data-timezone="${ctx.site.timezone}">
${head(ctx, assets)}
<body class="page-${page.id}">
${html`<a class="skip-link" href="#main">${ctx.t('a11y.skip')}</a>
${SPRITE}
${topbar(ctx)}
${header(ctx)}
<main id="main" tabindex="-1">
${page.sections.slice(0, 1).map((s) => renderSection(s, ctx))}
${pageNav(ctx)}
${page.sections.slice(1).map((s) => renderSection(s, ctx))}
</main>
${footer(ctx)}
<div class="lightbox" data-lightbox-root hidden role="dialog" aria-modal="true" aria-label="${ctx.t('gallery.viewer')}">
  <button class="lightbox__btn lightbox__close" type="button" data-lb-close aria-label="${ctx.t('gallery.close')}">${icon('close')}</button>
  <button class="lightbox__btn lightbox__prev" type="button" data-lb-prev aria-label="${ctx.t('gallery.prev')}">${icon('chevron')}</button>
  <figure class="lightbox__figure"><img alt="" data-lb-img><figcaption data-lb-caption></figcaption></figure>
  <button class="lightbox__btn lightbox__next" type="button" data-lb-next aria-label="${ctx.t('gallery.next')}">${icon('chevron')}</button>
</div>`.toString()}
</body>
</html>
`;
}
