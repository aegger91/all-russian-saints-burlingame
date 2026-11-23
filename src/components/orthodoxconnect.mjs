/**
 * OrthodoxConnect integration points (placeholders until the API is live).
 *
 * orthodoxconnect-feed props: eyebrow, title, intro, kinds (["event" | "volunteer" | "need"]),
 *   limit, actions
 *   Data: content.orthodoxconnect — a feed matching
 *   schemas/orthodoxconnect-feed.schema.json, loaded from
 *   site.integrations.orthodoxconnect.sampleFeed or, at build time, from
 *   the ORTHODOXCONNECT_FEED_URL environment variable. When the feed has
 *   isSample: true every card and the section carry a visible "Sample" label.
 * orthodoxconnect-cta props: eyebrow, title, text, buttonLabel
 *   Data: site.integrations.orthodoxconnect.joinUrl — when empty, a
 *   "coming soon" label is shown instead of a link.
 */
import { html, cx } from '../lib/html.mjs';
import { sectionHead, eyebrow, icon, actions } from './_primitives.mjs';

export const feedMeta = {
  type: 'orthodoxconnect-feed',
  title: 'OrthodoxConnect feed',
  description: 'Events, volunteer opportunities and needs published from the OrthodoxConnect app.',
  dataSources: ['integrations/orthodoxconnect.sample.json', 'env ORTHODOXCONNECT_FEED_URL']
};

export const ctaMeta = {
  type: 'orthodoxconnect-cta',
  title: 'Join on OrthodoxConnect',
  description: 'Invitation to join the parish on the OrthodoxConnect app.',
  dataSources: ['site.json → integrations.orthodoxconnect']
};

const KIND_ICON = { event: 'calendar', volunteer: 'users', need: 'heart' };

function when(item, ctx) {
  if (!item.startsAt) return '';
  const tz = ctx.site.timezone;
  const start = new Date(item.startsAt);
  const day = new Intl.DateTimeFormat(ctx.locale, { weekday: 'long', month: 'long', day: 'numeric', timeZone: tz }).format(start);
  const time = new Intl.DateTimeFormat(ctx.locale, { hour: 'numeric', minute: '2-digit', timeZone: tz }).format(start);
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} · ${time}`;
}

function progress(item, ctx) {
  const p = item.slots || item.quantity;
  if (!p || !p.needed) return '';
  const done = p.filled ?? p.fulfilled ?? 0;
  const pct = Math.min(100, Math.round((done / p.needed) * 100));
  const label = item.slots ? ctx.t('oc.slots', { filled: done, needed: p.needed }) : ctx.t('oc.quantity', { filled: done, needed: p.needed, unit: ctx.l(p.unit) || '' });
  return html`<div class="oc-progress"><div class="oc-progress__bar"><span style="width:${pct}%"></span></div><p class="oc-progress__label">${label}</p></div>`;
}

export function renderFeed(p, ctx) {
  const feed = ctx.content.orthodoxconnect;
  if (!feed) return '';
  const shown = new Set(['open', 'full']);
  let items = feed.items.filter((i) => shown.has(i.status || 'open') && (!p.kinds || p.kinds.includes(i.kind)));
  if (p.limit) items = items.slice(0, p.limit);
  const sample = feed.isSample;
  return html`<div class="${cx('oc-feed', sample && 'oc-feed--sample')}" data-oc-feed data-sample="${sample ? 'true' : 'false'}">
    ${sectionHead(p, ctx)}
    ${sample ? html`<p class="oc-sample-banner" role="note"><span class="badge badge--sample">${ctx.t('oc.sampleBadge')}</span><span>${ctx.t('oc.sampleNotice')}</span></p>` : ''}
    <ul class="card-grid card-grid--3 oc-feed__items">
      ${items.map(
        (item) => html`<li class="card oc-card oc-card--${item.kind}" data-oc-id="${item.id}" data-oc-kind="${item.kind}">
          <div class="oc-card__top">
            <span class="oc-kind">${icon(KIND_ICON[item.kind], 'oc-kind__icon')}${ctx.t(`oc.kind.${item.kind}`)}</span>
            ${sample ? html`<span class="badge badge--sample">${ctx.t('oc.sampleBadge')}</span>` : ''}
          </div>
          <h3 class="card__title">${ctx.l(item.title)}</h3>
          ${item.startsAt ? html`<p class="oc-card__meta">${icon('clock', 'oc-card__icon')}<time datetime="${item.startsAt}">${when(item, ctx)}</time></p>` : ''}
          ${item.location ? html`<p class="oc-card__meta">${icon('pin', 'oc-card__icon')}<span>${ctx.l(item.location)}</span></p>` : ''}
          ${item.summary ? html`<p class="card__text">${ctx.l(item.summary)}</p>` : ''}
          ${progress(item, ctx)}
          <div class="oc-card__cta">
            ${item.url
              ? html`<a class="btn btn--secondary btn--sm" href="${item.url}" target="_blank" rel="noopener"><span>${ctx.l(item.cta) || ctx.t(`oc.cta.${item.kind}`)}</span>${icon('external', 'btn__icon')}</a>`
              : html`<span class="btn btn--secondary btn--sm is-disabled" aria-disabled="true">${ctx.l(item.cta) || ctx.t(`oc.cta.${item.kind}`)}</span>`}
          </div>
        </li>`
      )}
    </ul>
    ${actions(p.actions, ctx)}
  </div>`;
}

export function renderCta(p, ctx) {
  const cfg = ctx.site.integrations?.orthodoxconnect || {};
  return html`<div class="oc-cta">
    <div class="oc-cta__mark" aria-hidden="true">${icon('cross', 'oc-cta__cross')}</div>
    <div class="oc-cta__text">
      ${eyebrow(ctx.l(p.eyebrow))}
      <h2 class="oc-cta__title">${ctx.l(p.title)}</h2>
      ${p.text ? html`<div class="oc-cta__body">${ctx.md(p.text)}</div>` : ''}
    </div>
    <div class="oc-cta__action">
      ${cfg.joinUrl
        ? html`<a class="btn btn--accent btn--lg" href="${cfg.joinUrl}" target="_blank" rel="noopener" data-oc-join><span>${ctx.l(p.buttonLabel) || ctx.t('oc.join')}</span>${icon('external', 'btn__icon')}</a>`
        : html`<span class="btn btn--light btn--lg is-disabled" aria-disabled="true" data-oc-join>${ctx.l(p.buttonLabel) || ctx.t('oc.join')}</span><p class="oc-cta__soon">${ctx.t('oc.comingSoon')}</p>`}
    </div>
  </div>`;
}
