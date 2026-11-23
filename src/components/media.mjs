/**
 * Media components.
 *
 * gallery props: eyebrow, title, intro, gallery (id in galleries.json),
 *   limit, columns (2 | 3 | 4)
 * video-list props: eyebrow, title, intro, layout ("list" | "grid"),
 *   videos: [{ id, youtubeId, title, date, description, descriptionLang }]
 *
 * Videos render as a lightweight facade; the YouTube player (privacy-enhanced
 * youtube-nocookie.com) loads only after a click.
 */
import { html, cx } from '../lib/html.mjs';
import { sectionHead, icon, image } from './_primitives.mjs';

export const galleryMeta = {
  type: 'gallery',
  title: 'Photo gallery',
  description: 'Responsive photo grid with an accessible lightbox.',
  dataSources: ['galleries.json']
};

export const videoMeta = {
  type: 'video-list',
  title: 'Video list',
  description: 'YouTube videos as click-to-load facades, optionally with dated descriptions.'
};

export function galleryGrid(galleryId, ctx, { limit, columns = 4 } = {}) {
  const gallery = ctx.content.index.galleries[galleryId];
  if (!gallery) throw new Error(`Unknown gallery "${galleryId}"`);
  const images = limit ? gallery.images.slice(0, limit) : gallery.images;
  const fallbackAlt = gallery.title;
  return html`<ul class="${cx('gallery', `gallery--${columns}`)}" data-gallery="${gallery.id}">
    ${images.map(
      (img, i) => html`<li class="gallery__item"><a class="gallery__link" href="${ctx.asset(img.src)}" data-lightbox aria-label="${ctx.t('gallery.open', { n: i + 1, total: images.length })}">${image({ ...img, alt: img.alt || fallbackAlt }, ctx, { className: 'gallery__img', sizes: '(min-width: 900px) 25vw, 50vw' })}</a></li>`
    )}
  </ul>`;
}

export function renderGallery(p, ctx) {
  return html`<div class="gallery-block">${sectionHead(p, ctx)}${galleryGrid(p.gallery, ctx, { limit: p.limit, columns: p.columns })}</div>`;
}

export function videoFacade(v, ctx) {
  const url = `https://www.youtube.com/watch?v=${v.youtubeId}`;
  const title = ctx.l(v.title) || ctx.t('video.watch');
  return html`<div class="video" data-youtube="${v.youtubeId}">
    <a class="video__link" href="${url}" target="_blank" rel="noopener">
      <span class="video__play">${icon('play', 'video__play-icon')}</span>
      <span class="video__text"><span class="video__title">${title}</span><span class="video__meta">${icon('youtube', 'video__yt')}${ctx.t('video.playsFromYoutube')}</span></span>
    </a>
  </div>`;
}

export function renderVideos(p, ctx) {
  const layout = p.layout || 'list';
  return html`<div class="${cx('video-list', `video-list--${layout}`)}">
    ${sectionHead(p, ctx)}
    <div class="video-list__items">
      ${p.videos.map(
        (v) => html`<article class="video-item"${v.id ? html` id="${v.id}"` : ''}>
          ${v.date ? html`<p class="video-item__date"><time datetime="${v.date}">${ctx.formatDate(v.date, 'full')}</time></p>` : ''}
          ${v.heading ? html`<h3 class="video-item__title">${ctx.l(v.heading)}</h3>` : ''}
          ${v.description ? html`<div class="prose prose--small">${ctx.md(v.description, { lang: v.descriptionLang })}</div>` : ''}
          ${v.youtubeId ? videoFacade(v, ctx) : v.status ? html`<p class="video-item__status">${ctx.l(v.status)}</p>` : ''}
        </article>`
      )}
    </div>
  </div>`;
}
