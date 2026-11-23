/**
 * service-times — upcoming services from content/services.json.
 *
 * Props: eyebrow, title, intro, limit (number), variant ("panel" | "plain"),
 *        showNotices (bool), showSeason (bool), showStanding (bool), actions (Action[])
 * Data:  services.upcoming[], services.serviceTypes[], services.notices[],
 *        services.season, services.standing (shown only when published)
 *
 * Each row carries data-date so the client script can hide past services
 * without a rebuild.
 */
import { html, attrs, cx } from '../lib/html.mjs';
import { sectionHead, actions, icon, cross, withSpares, spareHidden } from './_primitives.mjs';

export const meta = {
  type: 'service-times',
  title: 'Service times',
  description: 'Upcoming services list (date, time, service, feast) with notices and actions.',
  dataSources: ['services.json']
};

export function upcomingServices(ctx, limit) {
  const list = [...ctx.content.services.upcoming].sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
  return limit ? list.slice(0, limit) : list;
}

export function serviceLabel(entry, ctx) {
  if (entry.title) return ctx.l(entry.title);
  const type = ctx.content.index.serviceTypes[entry.serviceType];
  return type ? ctx.l(type.name) : '';
}

export function serviceRow(entry, ctx, { compact = false, hidden = null } = {}) {
  const time = entry.time ? ctx.formatTime(entry.time) : '';
  const label = serviceLabel(entry, ctx);
  const note = ctx.l(entry.note);
  return html`<li${attrs({ class: cx('service-list__item', entry.noService && 'is-none'), 'data-date': entry.date, hidden })}>
    <time class="service-list__date" datetime="${entry.date}${entry.time ? `T${entry.time}` : ''}">${ctx.formatDate(entry.date, 'weekdayLong')}</time>
    <div class="service-list__body">
      <p class="service-list__service">${time ? html`<span class="service-list__time">${time}</span>` : ''}<span>${label}</span></p>
      ${note && !compact ? html`<p class="service-list__note">${note}</p>` : ''}
    </div>
  </li>`;
}

export function seasonNotice(ctx) {
  const season = ctx.content.services.season;
  if (!season || season.published === false) return '';
  const title = ctx.l(season.title);
  const showAccent = season.accent && season.accent.toLowerCase() !== title.toLowerCase();
  return html`<div class="notice notice--season"${attrs({ 'data-until': season.end })}>
    <p class="notice__title">${cross('notice__cross')}<span>${title}</span>${showAccent ? html`<span class="accent-inline" lang="ru">${season.accent}</span>` : ''}</p>
    <p class="notice__text">${ctx.l(season.text)}</p>
  </div>`;
}

export function standingTimes(ctx) {
  const standing = ctx.content.services.standing;
  if (!standing || standing.published === false) return '';
  return html`<dl class="standing-times">${standing.items.map((i) => html`<div class="standing-times__row"><dt>${ctx.l(i.label)}</dt><dd>${ctx.l(i.text)}</dd></div>`)}</dl>`;
}

export function render(p, ctx) {
  const list = withSpares(upcomingServices(ctx), p.limit);
  const notices = p.showNotices ? ctx.content.services.notices.filter((n) => n.published !== false) : [];
  return html`<div class="${cx('service-times', `service-times--${p.variant || 'panel'}`)}">
    ${sectionHead(p, ctx, { level: p.headingLevel || 2 })}
    ${p.showStanding ? standingTimes(ctx) : ''}
    ${p.showSeason ? seasonNotice(ctx) : ''}
    ${notices.map((n) => html`<p class="notice notice--alert">${icon('clock', 'notice__icon')}<span>${ctx.l(n.text)}</span></p>`)}
    <ol${attrs({ class: 'service-list', 'data-hide-past': true, 'data-limit': p.limit })}>${list.map((e, i) => serviceRow(e, ctx, { hidden: spareHidden(i, p.limit) }))}</ol>
    <p class="service-list__empty" hidden>${ctx.t('services.allPast')}</p>
    ${actions(p.actions, ctx, { className: 'service-times__actions' })}
  </div>`;
}
