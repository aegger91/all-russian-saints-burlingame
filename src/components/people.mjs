/**
 * People components — data from content/people.json.
 *
 * A person has default contact details; each role can override name, email,
 * phone and add a note, because the parish lists different details in
 * different places (see README "Content to confirm").
 *
 * person-profile props: person (id), group (role group), body (markdown),
 *   quote, media (Image override), more ({ title, body }), actions
 * people-list props: eyebrow, title, intro, group (role group),
 *   people ([{ person, group }] explicit order), variant ("directory" | "cards"),
 *   showEmail (default true), showPhone (default true), columns (1 | 2 | 3)
 */
import { html, cx } from '../lib/html.mjs';
import { sectionHead, eyebrow, figure, icon, actions, phoneHref } from './_primitives.mjs';
import { more } from './rich-text.mjs';

export const profileMeta = {
  type: 'person-profile',
  title: 'Person profile (clergy card)',
  description: 'Portrait in an arch frame with role, name, contacts, text, quote and optional collapsible biography.',
  dataSources: ['people.json']
};

export const listMeta = {
  type: 'people-list',
  title: 'People list',
  description: 'Clergy/council/contacts/teachers as a two-column directory or as cards.',
  dataSources: ['people.json']
};

export function resolveRole(personId, group, ctx) {
  const person = ctx.content.index.people[personId];
  if (!person) throw new Error(`Unknown person "${personId}"`);
  const role = (person.roles || []).find((r) => r.group === group) || {};
  return {
    person,
    role,
    name: ctx.l(role.name || person.name),
    title: ctx.l(role.title),
    email: role.email === null ? null : role.email || person.email,
    phone: role.phone === null ? null : role.phone || person.phone,
    note: role.note
  };
}

function contactLines(r, ctx, { showEmail = true, showPhone = true } = {}) {
  const lines = [];
  if (showEmail && r.email) lines.push(html`<li>${icon('mail', 'contact-lines__icon')}<a href="mailto:${r.email}">${r.email}</a></li>`);
  if (showPhone && r.phone) lines.push(html`<li>${icon('phone', 'contact-lines__icon')}<a href="${phoneHref(r.phone)}">${r.phone.display}</a></li>`);
  return lines.length ? html`<ul class="contact-lines">${lines}</ul>` : '';
}

export function renderProfile(p, ctx) {
  const r = resolveRole(p.person, p.group || 'clergy', ctx);
  const photo = p.media || r.person.photo;
  return html`<div class="person-profile">
    ${photo ? html`<div class="person-profile__media">${figure(photo, ctx, { frame: 'arch' })}</div>` : ''}
    <div class="person-profile__body">
      ${eyebrow(r.title)}
      <h2 class="person-profile__name">${r.name}</h2>
      ${contactLines(r, ctx)}
      ${p.body ? html`<div class="prose">${ctx.md(p.body)}</div>` : ''}
      ${p.quote ? html`<blockquote class="pull-quote"><p>${ctx.l(p.quote.text)}</p>${p.quote.cite ? html`<cite>${ctx.l(p.quote.cite)}</cite>` : ''}</blockquote>` : ''}
      ${more(p, ctx)}
      ${actions(p.actions, ctx)}
    </div>
  </div>`;
}

function entries(p, ctx) {
  if (p.people) return p.people.map((e) => resolveRole(e.person, e.group || p.group, ctx));
  return ctx.content.people.people
    .filter((person) => (person.roles || []).some((r) => r.group === p.group))
    .map((person) => resolveRole(person.id, p.group, ctx))
    .sort((a, b) => (a.role.order ?? 99) - (b.role.order ?? 99));
}

export function renderList(p, ctx) {
  const list = entries(p, ctx);
  const opts = { showEmail: p.showEmail !== false, showPhone: p.showPhone !== false };
  if (p.variant === 'cards') {
    return html`<div class="people-list">
      ${sectionHead(p, ctx)}
      <div class="${cx('card-grid', `card-grid--${p.columns || 2}`)}">
        ${list.map(
          (r) => html`<article class="card person-card">
            ${eyebrow(r.title)}
            <h3 class="card__title">${r.name}</h3>
            ${r.note ? html`<div class="card__text prose prose--small">${ctx.md(r.note)}</div>` : ''}
            ${contactLines(r, ctx, opts)}
            ${r.role.link ? html`<p class="card__link"><a class="text-link" href="${ctx.href(r.role.link)}">${ctx.l(r.role.link.label)}${icon('arrow', 'text-link__icon')}</a></p>` : ''}
          </article>`
        )}
      </div>
    </div>`;
  }
  return html`<div class="people-list">
    ${sectionHead(p, ctx)}
    <ul class="${cx('directory', `directory--${p.columns || 2}`)}">
      ${list.map(
        (r) => html`<li class="directory__item">
          <div class="directory__who">
            ${r.title ? html`<p class="directory__role">${r.title}</p>` : ''}
            <p class="directory__name">${r.name}</p>
            ${r.note ? html`<p class="directory__note">${ctx.md(r.note, { inline: true })}</p>` : ''}
            ${opts.showEmail && r.email ? html`<a class="directory__email" href="mailto:${r.email}">${r.email}</a>` : ''}
          </div>
          ${opts.showPhone && r.phone ? html`<a class="directory__phone" href="${phoneHref(r.phone)}">${r.phone.display}</a>` : ''}
        </li>`
      )}
    </ul>
  </div>`;
}
