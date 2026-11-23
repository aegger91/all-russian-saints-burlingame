/**
 * split — two blocks side by side (stacked on mobile). Each block is any
 * other component type rendered without its own section wrapper.
 *
 * Props: columns: [Block, Block], ratio ("1:1" | "3:2" | "2:3" | "7:5" | "5:7"),
 *        align ("start" | "center"), reverseOnMobile (bool)
 */
import { html, cx } from '../lib/html.mjs';

export const meta = {
  type: 'split',
  title: 'Split (two columns)',
  description: 'Places two blocks (any section types) side by side on desktop.'
};

export function render(p, ctx, { renderBlock }) {
  const ratio = (p.ratio || '1:1').replace(':', '-');
  return html`<div class="${cx('split', `split--${ratio}`, `split--align-${p.align || 'start'}`, p.reverseOnMobile && 'split--reverse-mobile')}">
    ${p.columns.map((block) => html`<div class="split__col">${renderBlock(block, ctx)}</div>`)}
  </div>`;
}
