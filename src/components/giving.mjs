/**
 * Giving components — data from content/giving.json.
 *
 * give-block props: eyebrow, title, intro, funds (fund ids; default all),
 *   showNote (bool)
 * dues-table props: eyebrow, title, body (markdown), actions
 *
 * The PayPal forms post exactly the fields the parish's existing buttons use.
 * Swap `giving.provider` handling here to support another processor.
 */
import { html } from '../lib/html.mjs';
import { sectionHead, eyebrow, actions, icon } from './_primitives.mjs';

export const giveMeta = {
  type: 'give-block',
  title: 'Give block',
  description: 'One card per fund with a PayPal donation button.',
  dataSources: ['giving.json']
};

export const duesMeta = {
  type: 'dues-table',
  title: 'Membership dues',
  description: 'Monthly membership dues rates with notes.',
  dataSources: ['giving.json']
};

function paypalForm(fund, ctx) {
  const pp = ctx.content.giving.paypal;
  const fields = {
    cmd: pp.cmd,
    business: pp.business,
    item_name: pp.itemName,
    item_number: fund.itemNumber,
    no_note: pp.noNote,
    currency_code: pp.currency
  };
  return html`<form class="give-card__form" action="${pp.action}" method="post" target="_blank">
    ${Object.entries(fields).map(([name, value]) => html`<input type="hidden" name="${name}" value="${value}">`)}
    <button class="btn btn--accent btn--block" type="submit">${icon('heart', 'btn__icon')}<span>${ctx.l(fund.button)}</span></button>
  </form>`;
}

export function renderGive(p, ctx) {
  const all = ctx.content.giving.funds;
  const funds = p.funds ? p.funds.map((id) => ctx.content.index.funds[id]) : all;
  return html`<div class="give-block">
    ${sectionHead(p, ctx)}
    <div class="card-grid card-grid--${Math.min(funds.length, 3)}">
      ${funds.map(
        (f) => html`<article class="card give-card" id="give-${f.id}">
          ${eyebrow(ctx.l(f.eyebrow))}
          <h3 class="card__title">${ctx.l(f.title)}</h3>
          <p class="card__text">${ctx.l(f.description)}</p>
          ${paypalForm(f, ctx)}
        </article>`
      )}
    </div>
    ${p.showNote !== false ? html`<p class="give-block__note">${ctx.l(ctx.content.giving.note)}</p>` : ''}
  </div>`;
}

export function renderDues(p, ctx) {
  const dues = ctx.content.giving.dues;
  const currency = new Intl.NumberFormat(ctx.locale, { style: 'currency', currency: ctx.content.giving.paypal.currency, maximumFractionDigits: 0 });
  return html`<div class="dues-block">
    ${sectionHead(p, ctx)}
    <dl class="dues">
      ${dues.rates.map(
        (r) => html`<div class="dues__item"><dt class="dues__amount">${currency.format(r.amount)}</dt><dd class="dues__label">${ctx.l(r.label)}</dd></div>`
      )}
    </dl>
    ${p.body ? html`<div class="prose">${ctx.md(p.body)}</div>` : ''}
    ${actions(p.actions, ctx)}
  </div>`;
}
