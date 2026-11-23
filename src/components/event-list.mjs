/**
 * event-list — parish events from content/events.json.
 *
 * Props: eyebrow, title, intro, ministry (filter by ministry id),
 *        limit, variant ("panel" | "plain"), actions
 */
import { html, attrs, cx } from '../lib/html.mjs';
import { sectionHead, actions, icon, withSpares, spareHidden } from './_primitives.mjs';

export const meta = {
  type: 'event-list',
  title: 'Event list',
  description: 'Dated events with a calendar tile, time, location and description; past events hide automatically.',
  dataSources: ['events.json']
};

function dateTile(e, ctx) {
  if (!e.date) return html`<div class="date-tile date-tile--tbd"><span class="date-tile__day">${ctx.t('events.tbd')}</span></div>`;
  return html`<div class="date-tile" aria-hidden="true">
    <span class="date-tile__month">${ctx.formatDate(e.date, 'monthShort')}</span>
    <span class="date-tile__day">${ctx.formatDate(e.date, 'day')}</span>
  </div>`;
}

function when(e, ctx) {
  if (!e.date) return ctx.t('events.dateTbd');
  let out = ctx.formatDate(e.date, 'weekdayLong');
  if (e.endDate) out += ` – ${ctx.formatDate(e.endDate, 'long')}`;
  if (e.time) out += ` · ${ctx.formatTime(e.time)}`;
  return out;
}

export function render(p, ctx) {
  let list = ctx.content.events.events.filter((e) => !p.ministry || e.ministry === p.ministry);
  list = list.sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
  list = withSpares(list, p.limit);
  return html`<div class="${cx('event-list', `event-list--${p.variant || 'plain'}`)}">
    ${sectionHead(p, ctx)}
    <ol${attrs({ class: 'events', 'data-hide-past': true, 'data-limit': p.limit })}>
      ${list.map(
        (e, i) => html`<li${attrs({ class: 'event', id: `event-${e.id}`, 'data-date': e.endDate || e.date, hidden: spareHidden(i, p.limit) })}>
          ${dateTile(e, ctx)}
          <div class="event__body">
            <p class="event__when">${icon('calendar', 'event__icon')}<span>${when(e, ctx)}</span></p>
            <h3 class="event__title">${ctx.l(e.title)}</h3>
            ${e.location ? html`<p class="event__where">${icon('pin', 'event__icon')}<span>${ctx.l(e.location)}</span></p>` : ''}
            ${e.description ? html`<div class="event__text prose prose--small">${ctx.md(e.description)}</div>` : ''}
            ${e.link ? html`<p class="event__link"><a class="text-link" href="${ctx.href(e.link)}">${ctx.l(e.link.label)}${icon('arrow', 'text-link__icon')}</a></p>` : ''}
          </div>
        </li>`
      )}
    </ol>
    <p class="events__empty" hidden>${ctx.t('events.none')}</p>
    ${actions(p.actions, ctx)}
  </div>`;
}
