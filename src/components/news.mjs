/**
 * news-list — items from content/news.json.
 *
 * Props: eyebrow, title, intro, variant ("cards" | "full"), limit,
 *        featuredOnly (bool), actions
 * Cards link to the full article on the news page (#item-id).
 */
import { html, cx } from '../lib/html.mjs';
import { sectionHead, actions, image, figure, icon, accent } from './_primitives.mjs';
import { galleryGrid, videoFacade } from './media.mjs';

export const meta = {
  type: 'news-list',
  title: 'News list',
  description: 'News cards (image, date, title, summary) or full articles with galleries, videos and links.',
  dataSources: ['news.json', 'galleries.json']
};

const dateText = (item, ctx) => (item.dateLabel ? ctx.l(item.dateLabel) : item.date ? ctx.formatDate(item.date, 'long') : '');

function cardImage(item, ctx) {
  if (item.image) return item.image;
  if (item.gallery) return ctx.content.index.galleries[item.gallery]?.images[0];
  return null;
}

function card(item, ctx) {
  const img = cardImage(item, ctx);
  const date = dateText(item, ctx);
  return html`<article class="card news-card">
    <a class="news-card__link" href="${ctx.pagePath('news', { anchor: item.id })}">
      ${img ? html`<div class="news-card__media">${image({ ...img, alt: '' }, ctx, { sizes: '(min-width: 900px) 33vw, 100vw' })}</div>` : ''}
      <div class="news-card__body">
        ${date ? html`<p class="news-card__date">${date}</p>` : ''}
        <h3 class="news-card__title">${ctx.l(item.title)}</h3>
        ${item.summary ? html`<p class="news-card__summary">${ctx.l(item.summary)}</p>` : ''}
        <span class="text-link">${ctx.t('news.readMore')}${icon('arrow', 'text-link__icon')}</span>
      </div>
    </a>
  </article>`;
}

function article(item, ctx) {
  const date = dateText(item, ctx);
  return html`<article class="news-article" id="${item.id}">
    <header class="news-article__head">
      ${date ? html`<p class="news-article__date">${date}</p>` : ''}
      <h2 class="news-article__title">${ctx.l(item.title)}</h2>
      ${accent(item.accent, ctx, 'news-article__accent accent')}
    </header>
    <div class="news-article__body">
      ${item.body ? html`<div class="prose">${ctx.md(item.body)}</div>` : ''}
      ${item.links?.length
        ? html`<ul class="link-rows">${item.links.map((l) => {
            const url = ctx.href(l);
            const ext = ctx.isExternal(url);
            return html`<li><a class="link-row" href="${url}"${ext ? html` target="_blank" rel="noopener"` : ''}><span>${ctx.l(l.label)}</span>${icon(ext ? 'external' : 'arrow', 'link-row__icon')}</a></li>`;
          })}</ul>`
        : ''}
      ${item.videos?.length ? html`<div class="news-article__videos">${item.videos.map((v) => videoFacade(v, ctx))}</div>` : ''}
      ${item.figures?.length ? html`<div class="figure-row">${item.figures.map((f) => figure(f, ctx))}</div>` : ''}
      ${item.image && !item.gallery ? figure(item.image, ctx, { className: 'news-article__figure' }) : ''}
      ${item.gallery ? galleryGrid(item.gallery, ctx, { columns: 4 }) : ''}
    </div>
  </article>`;
}

export function render(p, ctx) {
  let items = [...ctx.content.news.items];
  if (p.featuredOnly) items = items.filter((i) => i.featured);
  if (p.limit) items = items.slice(0, p.limit);
  if (p.variant === 'full') {
    return html`<div class="news-full">${sectionHead(p, ctx)}${items.map((i) => article(i, ctx))}</div>`;
  }
  return html`<div class="news-list">
    ${sectionHead(p, ctx)}
    <div class="${cx('card-grid', `card-grid--${p.columns || 3}`)}">${items.map((i) => card(i, ctx))}</div>
    ${actions(p.actions, ctx, { className: 'section-actions' })}
  </div>`;
}
