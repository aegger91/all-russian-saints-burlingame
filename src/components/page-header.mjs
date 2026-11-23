/**
 * page-header — title block at the top of every inner page.
 *
 * Props: eyebrow, title, accent (Russian line), lede, image (shown in an
 *        onion-arch frame), breadcrumbs (bool, default true)
 */
import { html } from '../lib/html.mjs';
import { eyebrow, accentUnlessSame, image } from './_primitives.mjs';

export const meta = {
  type: 'page-header',
  title: 'Page header',
  bare: true,
  description: 'Breadcrumb, eyebrow, H1, Russian accent line and lede, with an arch-framed photograph.'
};

export function render(p, ctx) {
  const crumbs = p.breadcrumbs !== false;
  return html`<section class="page-header${p.image ? '' : ' page-header--plain'}" id="${p.id}" data-section-type="page-header">
    <div class="container page-header__inner">
      <div class="page-header__content">
        ${crumbs
          ? html`<nav class="breadcrumbs" aria-label="${ctx.t('a11y.breadcrumbs')}"><ol>
              <li><a href="${ctx.pagePath('home')}">${ctx.t('nav.home')}</a></li>
              <li aria-current="page">${ctx.l(ctx.page.navTitle || ctx.page.title)}</li>
            </ol></nav>`
          : ''}
        ${eyebrow(ctx.l(p.eyebrow))}
        <h1 class="page-header__title">${ctx.l(p.title)}</h1>
        ${accentUnlessSame(p.accent, ctx.l(p.title), ctx, 'page-header__accent accent')}
        ${p.lede ? html`<p class="page-header__lede">${ctx.l(p.lede)}</p>` : ''}
      </div>
      ${p.image ? html`<div class="page-header__media arch-frame">${image(p.image, ctx, { priority: true, sizes: '(min-width: 900px) 40vw, 100vw' })}</div>` : ''}
    </div>
  </section>`;
}
