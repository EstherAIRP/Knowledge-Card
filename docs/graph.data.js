import { fileURLToPath } from 'node:url';
import { loadCards } from '../scripts/lib/knowledge.mjs';
import { projectGraph, readRequiredJson } from '../scripts/lib/graph-projection.mjs';

const contentRoot = fileURLToPath(new URL('../content/knowledge/', import.meta.url));
const conceptPath = fileURLToPath(new URL('../data/concepts.json', import.meta.url));
const relationPath = fileURLToPath(new URL('../data/relations.json', import.meta.url));
const layoutPath = fileURLToPath(new URL('../data/graph-layout.json', import.meta.url));

export default {
  watch: ['../content/knowledge/**/*.md', '../data/concepts.json', '../data/relations.json', '../data/graph-layout.json'],
  load() {
    const cards = loadCards(contentRoot);
    const concepts = readRequiredJson(conceptPath, { label: 'data/concepts.json' });
    const relations = readRequiredJson(relationPath, { label: 'data/relations.json' });
    const layout = readRequiredJson(layoutPath, { label: 'data/graph-layout.json' });

    return projectGraph({ cards, concepts, relations, layout });
  }
};
