// theme/tokens.json -> CSS custom properties on :root.
//
//   color.navy          -> --color-navy
//   semantic.brand      -> --brand          (references like "{color.navy}"
//                                            become var(--color-navy))
//   font-size.lg        -> --font-size-lg
//   layout.container    -> --layout-container
const UNPREFIXED = new Set(['semantic']);
const SKIP = new Set(['$schema', 'meta']);

const varName = (group, key) => (UNPREFIXED.has(group) ? `--${key}` : `--${group}-${key}`);

function resolve(value) {
  return String(value).replace(/\{([\w-]+)\.([\w-]+)\}/g, (_, group, key) => `var(${varName(group, key)})`);
}

export function tokensToCss(tokens) {
  const lines = [];
  for (const [group, values] of Object.entries(tokens)) {
    if (SKIP.has(group) || typeof values !== 'object') continue;
    for (const [key, value] of Object.entries(values)) lines.push(`  ${varName(group, key)}: ${resolve(value)};`);
  }
  return `:root {\n${lines.join('\n')}\n}\n`;
}
