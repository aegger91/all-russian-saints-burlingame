// Section registry: maps a section `type` (as used in content/pages/*.json)
// to its component. Add a component here and a matching definition in
// schemas/page.schema.json to make it available to pages.
import { html, attrs, cx } from '../lib/html.mjs';
import * as hero from './hero.mjs';
import * as pageHeader from './page-header.mjs';
import * as richText from './rich-text.mjs';
import * as split from './split.mjs';
import * as serviceTimes from './service-times.mjs';
import * as people from './people.mjs';
import * as events from './event-list.mjs';
import * as news from './news.mjs';
import * as media from './media.mjs';
import * as giving from './giving.mjs';
import * as documents from './documents.mjs';
import * as contact from './contact.mjs';
import * as blocks from './blocks.mjs';
import * as oc from './orthodoxconnect.mjs';

export const registry = {
  hero: { meta: hero.meta, render: hero.render },
  'page-header': { meta: pageHeader.meta, render: pageHeader.render },
  'rich-text': { meta: richText.meta, render: richText.render },
  split: { meta: split.meta, render: split.render },
  'service-times': { meta: serviceTimes.meta, render: serviceTimes.render },
  'person-profile': { meta: people.profileMeta, render: people.renderProfile },
  'people-list': { meta: people.listMeta, render: people.renderList },
  'event-list': { meta: events.meta, render: events.render },
  'news-list': { meta: news.meta, render: news.render },
  gallery: { meta: media.galleryMeta, render: media.renderGallery },
  'video-list': { meta: media.videoMeta, render: media.renderVideos },
  'give-block': { meta: giving.giveMeta, render: giving.renderGive },
  'dues-table': { meta: giving.duesMeta, render: giving.renderDues },
  'document-list': { meta: documents.meta, render: documents.render },
  'contact-map': { meta: contact.meta, render: contact.render },
  'cta-band': { meta: blocks.metas['cta-band'], render: blocks.renderCta },
  'card-grid': { meta: blocks.metas['card-grid'], render: blocks.renderCards },
  'link-list': { meta: blocks.metas['link-list'], render: blocks.renderLinks },
  quote: { meta: blocks.metas.quote, render: blocks.renderQuote },
  notice: { meta: blocks.metas.notice, render: blocks.renderNotice },
  prayer: { meta: blocks.metas.prayer, render: blocks.renderPrayer },
  'fact-list': { meta: blocks.metas['fact-list'], render: blocks.renderFacts },
  stack: { meta: blocks.metas.stack, render: blocks.renderStack },
  image: { meta: blocks.metas.image, render: blocks.renderImage },
  'orthodoxconnect-feed': { meta: oc.feedMeta, render: oc.renderFeed },
  'orthodoxconnect-cta': { meta: oc.ctaMeta, render: oc.renderCta }
};

const visible = (s, ctx) => !s.hidden && (!s.locales || s.locales.includes(ctx.locale));

function component(type) {
  const entry = registry[type];
  if (!entry) throw new Error(`Unknown section type "${type}"`);
  return entry;
}

// A block is a section rendered inside another section (e.g. a split column).
export function renderBlock(block, ctx) {
  if (!visible(block, ctx)) return '';
  const { render } = component(block.type);
  const inner = render(block, ctx, { renderBlock });
  if (!String(inner).trim()) return '';
  return html`<div${attrs({ class: cx('block', `block--${block.type}`), id: block.id, 'data-section-type': block.type })}>${inner}</div>`;
}

export function renderSection(section, ctx) {
  if (!visible(section, ctx)) return '';
  const { meta, render } = component(section.type);
  const inner = render(section, ctx, { renderBlock });
  if (meta.bare || !String(inner).trim()) return inner;
  return html`<section${attrs({
    id: section.id,
    class: cx(
      'section',
      `section--${section.type}`,
      `section--bg-${section.background || 'default'}`,
      section.spacing && section.spacing !== 'default' && `section--space-${section.spacing}`,
      section.divider && 'section--divider'
    ),
    'data-section-type': section.type
  })}><div class="${cx('container', section.width && section.width !== 'default' && `container--${section.width}`)}">${inner}</div></section>`;
}
