/**
 * contact-map — address, phone, email, social links and an embedded map.
 *
 * Props: eyebrow, title, intro, body (markdown), showMap (default true),
 *        actions (defaults to Directions + 360° tour from site.contact)
 * Data:  site.contact, site.social
 */
import { html } from '../lib/html.mjs';
import { sectionHead, actions, icon, phoneHref } from './_primitives.mjs';

export const meta = {
  type: 'contact-map',
  title: 'Contact & map',
  description: 'Parish address, phone, email and social links beside an embedded map.',
  dataSources: ['site.json']
};

export function addressLines(ctx) {
  const a = ctx.site.contact.address;
  return [a.street, `${a.city}, ${a.region} ${a.postalCode}`];
}

export function render(p, ctx) {
  const c = ctx.site.contact;
  const defaultActions = [
    c.directionsUrl && { label: ctx.content.ui.strings['contact.directions'], href: c.directionsUrl, style: 'primary' },
    c.virtualTourUrl && { label: ctx.content.ui.strings['contact.tour'], href: c.virtualTourUrl, style: 'secondary' }
  ].filter(Boolean);
  return html`<div class="contact-map">
    <div class="contact-map__info">
      ${sectionHead(p, ctx)}
      <ul class="contact-list">
        <li>${icon('pin', 'contact-list__icon')}<span><span class="contact-list__label">${ctx.t('contact.address')}</span><address>${addressLines(ctx).map((l, i) => html`${i ? html`<br>` : ''}${l}`)}</address></span></li>
        ${c.phone ? html`<li>${icon('phone', 'contact-list__icon')}<span><span class="contact-list__label">${ctx.t('contact.phone')}</span><a href="${phoneHref(c.phone)}">${c.phone.display}</a></span></li>` : ''}
        ${c.email ? html`<li>${icon('mail', 'contact-list__icon')}<span><span class="contact-list__label">${ctx.t('contact.email')}</span><a href="mailto:${c.email}">${c.email}</a></span></li>` : ''}
      </ul>
      ${p.body ? html`<div class="prose prose--small">${ctx.md(p.body)}</div>` : ''}
      ${actions(p.actions || defaultActions, ctx)}
      <ul class="social-links">
        ${ctx.site.social.map((s) => html`<li><a class="social-link" href="${s.url}" target="_blank" rel="noopener">${icon(s.icon, 'social-link__icon')}<span>${ctx.l(s.label)}</span></a></li>`)}
      </ul>
    </div>
    ${p.showMap !== false && c.mapEmbedUrl
      ? html`<div class="contact-map__map"><iframe src="${c.mapEmbedUrl}" title="${ctx.t('contact.mapTitle')}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>`
      : ''}
  </div>`;
}
