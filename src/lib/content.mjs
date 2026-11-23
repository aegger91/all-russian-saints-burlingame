// Loads every content file into one object and builds id indexes.
// The content folder is the only thing a builder/editor needs to write to.
import fs from 'node:fs';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
export const CONTENT_DIR = path.resolve(ROOT, process.env.CONTENT_DIR || 'content');
export const PUBLIC_DIR = path.resolve(ROOT, process.env.PUBLIC_DIR || 'public');
export const SCHEMA_DIR = path.join(ROOT, 'schemas');
export const THEME_DIR = path.join(ROOT, 'theme');

// Tokens file for this site: site.theme.tokens (relative to the project root),
// so every parish can carry its own theme.
export function themeFile(site) {
  return path.resolve(ROOT, site?.theme?.tokens || path.join(THEME_DIR, 'tokens.json'));
}

export function readJson(file) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  delete data.$schema;
  return data;
}

const byId = (list = []) => Object.fromEntries(list.map((item) => [item.id, item]));

const childBlocks = (s) => [s.columns, s.blocks].filter(Array.isArray).flat();

// content/layout.json: per-page section switches and order, so a builder (or
// an editor) can turn sections on and off and reorder them without touching
// the page files. Unknown ids are collected for the validator.
function applyLayout(pages, layout) {
  const problems = [];
  for (const [pageId, cfg] of Object.entries(layout?.pages || {})) {
    const page = pages.find((p) => p.id === pageId);
    if (!page) {
      problems.push(`unknown page "${pageId}"`);
      continue;
    }
    if (cfg.order) {
      const rank = new Map(cfg.order.map((id, i) => [id, i]));
      for (const id of cfg.order) if (!page.sections.some((s) => s.id === id)) problems.push(`${pageId}: order lists unknown section "${id}"`);
      page.sections = page.sections
        .map((s, i) => ({ s, i, r: rank.has(s.id) ? rank.get(s.id) : cfg.order.length + i }))
        .sort((a, b) => a.r - b.r)
        .map(({ s }) => s);
    }
    const disabled = new Set(cfg.disabled || []);
    const visit = (list) => list.forEach((s) => {
      if (s.id && disabled.has(s.id)) {
        s.hidden = true;
        disabled.delete(s.id);
      }
      visit(childBlocks(s));
    });
    visit(page.sections);
    for (const id of disabled) problems.push(`${pageId}: disabled lists unknown section "${id}"`);
  }
  return problems;
}

export function loadContent({ feedOverride } = {}) {
  const f = (name) => readJson(path.join(CONTENT_DIR, name));
  const site = f('site.json');
  const pagesDir = path.join(CONTENT_DIR, 'pages');
  const pages = fs
    .readdirSync(pagesDir)
    .filter((n) => n.endsWith('.json'))
    .map((n) => readJson(path.join(pagesDir, n)))
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

  const content = {
    site,
    navigation: f('navigation.json'),
    ui: f('ui.json'),
    people: f('people.json'),
    services: f('services.json'),
    events: f('events.json'),
    news: f('news.json'),
    galleries: f('galleries.json'),
    ministries: f('ministries.json'),
    giving: f('giving.json'),
    documents: f('documents.json'),
    links: f('links.json'),
    redirects: fs.existsSync(path.join(CONTENT_DIR, 'redirects.json')) ? f('redirects.json').redirects : [],
    pages
  };
  const layoutFile = path.join(CONTENT_DIR, 'layout.json');
  content.layoutProblems = fs.existsSync(layoutFile) ? applyLayout(pages, f('layout.json')) : [];

  const oc = site.integrations?.orthodoxconnect;
  if (oc?.enabled) {
    content.orthodoxconnect = feedOverride ?? readJson(path.join(CONTENT_DIR, oc.sampleFeed));
  }

  content.index = {
    pages: byId(pages),
    people: byId(content.people.people),
    documents: byId(content.documents.documents),
    documentGroups: byId(content.documents.groups),
    galleries: byId(content.galleries.galleries),
    news: byId(content.news.items),
    serviceTypes: byId(content.services.serviceTypes),
    ministries: byId(content.ministries.ministries),
    funds: byId(content.giving.funds),
    linkGroups: byId(content.links.groups)
  };
  return content;
}

export function listContentFiles(dir = CONTENT_DIR) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listContentFiles(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out.sort();
}
