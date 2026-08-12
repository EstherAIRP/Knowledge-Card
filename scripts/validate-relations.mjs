import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { loadCards } from './lib/knowledge.mjs';
import { validateRelationIndex, validateRelationOverrides } from './lib/relations.mjs';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const contentRoot = path.join(repoRoot, 'content', 'knowledge');
const relationPath = path.join(repoRoot, 'data', 'relations.json');
const overridePath = path.join(repoRoot, 'config', 'relation-overrides.yaml');

const cards = loadCards(contentRoot);
const cardIds = new Set(cards.map((card) => card.data.id));
const errors = [];

if (!fs.existsSync(relationPath)) {
  errors.push('data/relations.json does not exist. Run npm run relations:build first.');
} else {
  try {
    const index = JSON.parse(fs.readFileSync(relationPath, 'utf8'));
    errors.push(...validateRelationIndex(index, cardIds));
  } catch (error) {
    errors.push(`data/relations.json is invalid JSON: ${error.message}`);
  }
}

if (fs.existsSync(overridePath)) {
  try {
    const overrides = parseYaml(fs.readFileSync(overridePath, 'utf8')) ?? {};
    errors.push(...validateRelationOverrides(overrides, cardIds));
  } catch (error) {
    errors.push(`config/relation-overrides.yaml is invalid YAML: ${error.message}`);
  }
}

if (errors.length) {
  console.error('Relation validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Relation validation passed for ${cards.length} cards.`);
