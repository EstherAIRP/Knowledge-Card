import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { loadCards } from './lib/knowledge.mjs';

const root = process.cwd();
const contentRoot = path.join(root, 'content/knowledge');
const conceptPath = path.join(root, 'data/concepts.json');
const distRoot = path.join(root, 'docs/.vitepress/dist');
const errors = [];

function requireFile(relativePath) {
  const fullPath = path.join(distRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing built file: ${relativePath}`);
    return;
  }

  const stat = fs.statSync(fullPath);
  if (!stat.isFile() || stat.size === 0) {
    errors.push(`Built file is empty or invalid: ${relativePath}`);
  }
}

if (!fs.existsSync(distRoot)) {
  console.error('Site output verification failed: docs/.vitepress/dist does not exist. Run npm run docs:build first.');
  process.exit(1);
}

requireFile('index.html');
requireFile('graph.html');

const cards = loadCards(contentRoot);
for (const card of cards) {
  requireFile(path.join('knowledge', `${card.data.id}.html`));
}

let concepts = [];
if (!fs.existsSync(conceptPath)) {
  errors.push('Missing data/concepts.json before site verification.');
} else {
  try {
    concepts = JSON.parse(fs.readFileSync(conceptPath, 'utf8')).concepts ?? [];
  } catch (error) {
    errors.push(`Cannot parse data/concepts.json: ${error.message}`);
  }
}

for (const concept of concepts) {
  requireFile(path.join('concepts', `${concept.id}.html`));
}

const assetsRoot = path.join(distRoot, 'assets');
if (!fs.existsSync(assetsRoot)) {
  errors.push('Missing built assets directory: assets/');
} else {
  const assets = fs.readdirSync(assetsRoot);
  if (!assets.some((name) => name.endsWith('.js'))) {
    errors.push('No JavaScript bundle found in assets/.');
  }
  if (!assets.some((name) => name.endsWith('.css'))) {
    errors.push('No CSS bundle found in assets/.');
  }
}

if (errors.length) {
  console.error(`Site output verification failed (${errors.length} error${errors.length === 1 ? '' : 's'}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Site output verified: homepage + graph + ${cards.length} Knowledge Card pages + ${concepts.length} Concept pages + JS/CSS assets.`);
