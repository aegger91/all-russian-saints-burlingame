// Loads every content file into one object and builds id indexes.
// The content folder is the only thing a builder/editor needs to write to.
import fs from 'node:fs';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
export const CONTENT_DIR = path.resolve(ROOT, process.env.CONTENT_DIR || 'content');
export const PUBLIC_DIR = path.resolve(ROOT, process.env.PUBLIC_DIR || 'public');
export const SCHEMA_DIR = path.join(ROOT, 'schemas');
export const THEME_DIR = path.join(ROOT, 'theme');

export function readJson(file) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  delete data.$schema;
  return data;
}

const byId = (list = []) => Object.fromEntries(list.map((item) => [item.id, item]));

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
    pages
  };

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
