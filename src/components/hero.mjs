/**
 * hero — full-bleed home page hero with the parish photograph.
 *
 * Props: eyebrow, title, accent (Russian line), text, image, actions,
 *        nextServices: { limit, title } (optional card of the next services)
 */
import { html, attrs } from '../lib/html.mjs';
import { eyebrow, accentUnlessSame, actions, image, withSpares, spareHidden } from './_primitives.mjs';
import { upcomingServices, serviceLabel } from './service-times.mjs';

export const meta = {
  type: 'hero',
  title: 'Hero',
  bare: true,
  description: 'Full-width photograph with parish name, Russian accent line, actions and an optional "next services" card.'
};

function nextServices(p, ctx) {
  if (!p.nextServices) return '';
  const limit = p.nextServices.limit || 3;
  const list = withSpares(upcomingServices(ctx), limit);
  return html`<aside class="hero__next" aria-label="${ctx.l(p.nextServices.title)}">
    <p class="hero__next-title">${ctx.l(p.nextServices.title)}</p>
    <ol class="hero__next-list" data-hide-past data-limit="${limit}">
      ${list.map(
        (e, i) => html`<li${attrs({ 'data-date': e.date, hidden: spareHidden(i, limit) })}><time datetime="${e.date}">${ctx.formatDate(e.date, 'weekdayLong')}</time><span>${e.time ? `${ctx.formatTime(e.time)} · ` : ''}${serviceLabel(e, ctx)}</span></li>`
      )}
    </ol>
    <a class="hero__next-link" href="${ctx.pagePath('services')}">${ctx.t('services.fullSchedule')}</a>
  </aside>`;
}

export function render(p, ctx) {
  return html`<section class="hero" id="${p.id}" data-section-type="hero">
    <div class="hero__media">${image(p.image, ctx, { className: 'hero__img', priority: true, sizes: '100vw' })}</div>
    <div class="container hero__inner">
      <div class="hero__content">
        ${eyebrow(ctx.l(p.eyebrow))}
        <h1 class="hero__title">${ctx.l(p.title)}</h1>
        ${accentUnlessSame(p.accent, ctx.l(p.title), ctx, 'hero__accent accent')}
        ${p.text ? html`<p class="hero__text">${ctx.l(p.text)}</p>` : ''}
        ${actions(p.actions, ctx, { className: 'hero__actions' })}
      </div>
      ${nextServices(p, ctx)}
    </div>
  </section>`;
}
