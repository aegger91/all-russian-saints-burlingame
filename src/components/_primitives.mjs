// Small building blocks shared by all components.
import { html, raw, attrs, cx } from '../lib/html.mjs';

// Inline SVG sprite, emitted once per page by the layout.
// The Russian Orthodox cross: the slanted footrest is higher on the
// viewer's left (the right hand of Christ, toward the penitent thief).
export const SPRITE = raw(`<svg width="0" height="0" class="sprite" aria-hidden="true" focusable="false"><defs>
<symbol id="i-cross" viewBox="0 0 24 36"><g fill="currentColor"><rect x="10.7" y="0" width="2.6" height="36"/><rect x="7.2" y="5" width="9.6" height="2.2"/><rect x="2" y="11.2" width="20" height="2.6"/><rect x="5.6" y="25.2" width="12.8" height="2.2" transform="rotate(24 12 26.3)"/></g></symbol>
<symbol id="i-arch" viewBox="0 0 120 28"><path d="M1 27V19C1 13 23 12.3 43 8.6 51.5 7 57 4.2 60 1 63 4.2 68.5 7 77 8.6 97 12.3 119 13 119 19V27" fill="none" stroke="currentColor" stroke-width="1.2"/></symbol>
<symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-external" viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-doc" viewBox="0 0 24 24"><path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7zM14 3v4h4M9 13h6M9 17h6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-audio" viewBox="0 0 24 24"><path d="M9 18V6l10-2v12M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM19 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-phone" viewBox="0 0 24 24"><path d="M6.6 3.5 9 3l1.6 4-2 1.3a11 11 0 0 0 7.1 7.1l1.3-2 4 1.6-.5 2.4a2 2 0 0 1-2 1.6A16.6 16.6 0 0 1 5 5.5a2 2 0 0 1 1.6-2z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></symbol>
<symbol id="i-mail" viewBox="0 0 24 24"><path d="M3.5 6.5h17v11h-17zM4 7l8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></symbol>
<symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21s-6.5-6.2-6.5-11.3a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="9.7" r="2.3" fill="none" stroke="currentColor" stroke-width="1.5"/></symbol>
<symbol id="i-play" viewBox="0 0 24 24"><path d="M9 7.5v9l7.5-4.5z" fill="currentColor"/></symbol>
<symbol id="i-chevron" viewBox="0 0 24 24"><path d="m7 10 5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></symbol>
<symbol id="i-youtube" viewBox="0 0 24 24"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z" fill="currentColor"/></symbol>
<symbol id="i-facebook" viewBox="0 0 24 24"><path d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4A20 20 0 0 0 14.3 4c-2.2 0-3.8 1.4-3.8 3.9v2.6H8v3h2.5V21z" fill="currentColor"/></symbol>
<symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
<symbol id="i-close" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
<symbol id="i-heart" viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></symbol>
<symbol id="i-users" viewBox="0 0 24 24"><path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM20 19v-1.5a3.5 3.5 0 0 0-2.6-3.4M15.5 4.2a3.5 3.5 0 0 1 0 6.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></symbol>
<symbol id="i-calendar" viewBox="0 0 24 24"><path d="M4.5 6.5h15v13h-15zM4.5 10.5h15M8.5 4v4M15.5 4v4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></symbol>
</defs></svg>`);

export const icon = (name, className = 'icon') => html`<svg class="${className}" aria-hidden="true" focusable="false"><use href="#i-${name}"></use></svg>`;

export const cross = (className = 'cross') => icon('cross', className);

export function eyebrow(text) {
  if (!text) return '';
  return html`<p class="eyebrow">${cross('eyebrow__cross')}<span>${text}</span></p>`;
}

// Russian/Slavonic accent line (Ponomar face). Plain strings are Russian.
export function accent(value, ctx, className = 'accent') {
  if (!value) return '';
  const isPlain = typeof value === 'string';
  const text = isPlain ? value : ctx.l(value);
  if (!text) return '';
  const lang = isPlain ? 'ru' : ctx.lx(value).lang;
  return html`<p class="${className}"${attrs({ lang: lang !== ctx.locale ? lang : null })}>${text}</p>`;
}

// An accent line that only repeats the heading (e.g. on the Russian page) is dropped.
export const sameText = (a, b) => !!a && !!b && a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();

export function accentUnlessSame(value, title, ctx, className) {
  const text = typeof value === 'string' ? value : ctx.l(value);
  return sameText(text, title) ? '' : accent(value, ctx, className);
}

export function sectionHead(props, ctx, { align = 'start', level = 2, className } = {}) {
  const { eyebrow: eb, title, accent: ac, intro } = props;
  if (!eb && !title && !ac && !intro) return '';
  const Tag = `h${level}`;
  const titleText = ctx.l(title);
  return html`<header class="${cx('section-head', `section-head--${align}`, className)}">
    ${eyebrow(ctx.l(eb))}
    ${titleText ? raw(`<${Tag} class="section-head__title">`) : ''}${titleText}${titleText ? raw(`</${Tag}>`) : ''}
    ${ac ? accentUnlessSame(ac, titleText, ctx, 'section-head__accent accent') : ''}
    ${intro ? html`<div class="section-head__intro">${ctx.md(intro)}</div>` : ''}
  </header>`;
}

const BUTTON_STYLES = { primary: 'btn--primary', secondary: 'btn--secondary', accent: 'btn--accent', light: 'btn--light', ghost: 'btn--ghost', link: 'btn--link' };

export function button(action, ctx, { className, size } = {}) {
  if (!action) return '';
  const url = ctx.href(action);
  const external = ctx.isExternal(url);
  const style = BUTTON_STYLES[action.style || 'primary'] || BUTTON_STYLES.primary;
  return html`<a${attrs({
    class: cx('btn', style, size && `btn--${size}`, className),
    href: url,
    target: external ? '_blank' : null,
    rel: external ? 'noopener' : null,
    'data-kind': action.document ? 'pdf' : null
  })}><span>${ctx.l(action.label)}</span>${external ? icon('external', 'btn__icon') : action.style === 'link' ? icon('arrow', 'btn__icon') : ''}</a>`;
}

export function actions(list, ctx, { className, size } = {}) {
  if (!list || !list.length) return '';
  return html`<div class="${cx('actions', className)}">${list.map((a) => button(a, ctx, { size }))}</div>`;
}

// Image object: { src, alt, caption, position, width, height }
export function image(img, ctx, { className, loading = 'lazy', sizes, priority = false } = {}) {
  if (!img || !img.src) return '';
  const size = ctx.imageSize(img.src) || {};
  return html`<img${attrs({
    class: className,
    src: ctx.asset(img.src),
    alt: ctx.l(img.alt) || '',
    width: img.width || size.width,
    height: img.height || size.height,
    loading: priority ? null : loading,
    decoding: priority ? null : 'async',
    fetchpriority: priority ? 'high' : null,
    srcset: img.srcset,
    sizes: img.srcset ? sizes : null,
    style: img.position ? `object-position:${img.position}` : null
  })}>`;
}

export function figure(img, ctx, { className, frame = 'plain', ...rest } = {}) {
  if (!img || !img.src) return '';
  const caption = ctx.l(img.caption);
  return html`<figure class="${cx('figure', `figure--${img.frame || frame}`, className)}">
    <div class="figure__media">${image(img, ctx, rest)}</div>
    ${caption ? html`<figcaption class="figure__caption">${caption}</figcaption>` : ''}
  </figure>`;
}

export function linkTo(link, ctx, content, { className } = {}) {
  const url = ctx.href(link);
  const external = ctx.isExternal(url);
  return html`<a${attrs({ class: className, href: url, target: external ? '_blank' : null, rel: external ? 'noopener' : null })}>${content}</a>`;
}

export const phoneHref = (phone) => (phone?.e164 ? `tel:${phone.e164}` : null);

// Dated lists with a limit render a few spare rows (hidden) so the client
// script can top the list back up as dates pass, without a rebuild.
export const SPARE_ROWS = 6;
export const withSpares = (list, limit) => (limit ? list.slice(0, limit + SPARE_ROWS) : list);
export const spareHidden = (index, limit) => (limit && index >= limit ? true : null);
