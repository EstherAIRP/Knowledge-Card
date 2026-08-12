import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { loadCards } from './lib/knowledge.mjs';
import { normalizeConceptToken, validateConceptIndex } from './lib/concepts.mjs';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const contentRoot = path.join(repoRoot, 'content', 'knowledge');
const configPath = path.join(repoRoot, 'config', 'concept-config.yaml');
const conceptPath = path.join(repoRoot, 'data', 'concepts.json');
const errors = [];

const cards = loadCards(contentRoot);
const cardIds = new Set(cards.map((card) => card.data.id));

if (!fs.existsSync(configPath)) {
  errors.push('config/concept-config.yaml does not exist.');
} else {
  try {
    const config = parseYaml(fs.readFileSync(configPath, 'utf8')) ?? {};
    if (config.schema_version !== 1) errors.push('concept-config schema_version must equal 1.');
    const extraction = config.extraction ?? {};
    for (const [key, minimum] of [
      ['minimum_tag_support', 2],
      ['concept_relation_min_support', 1],
      ['concept_relation_top_k', 1]
    ]) {
      const value = Number(extraction[key]);
      if (!Number.isInteger(value) || value < minimum) errors.push(`extraction.${key} must be an integer >= ${minimum}.`);
    }

    const promotedIds = new Set();
    for (const concept of config.promoted_concepts ?? []) {
      const id = normalizeConceptToken(concept?.id);
      if (!id) errors.push('promoted concept requires a valid id.');
      if (promotedIds.has(id)) errors.push(`duplicate promoted concept id: ${id}`);
      promotedIds.add(id);
      if (!concept?.label || typeof concept.label !== 'string') errors.push(`promoted concept ${id || '(unknown)'} requires label.`);
      if (!concept?.description || typeof concept.description !== 'string') errors.push(`promoted concept ${id || '(unknown)'} requires description.`);
      const rules = concept?.match ?? {};
      if (!(Array.isArray(rules.categories_any) && rules.categories_any.length) && !(Array.isArray(rules.tags_any) && rules.tags_any.length)) {
        errors.push(`promoted concept ${id || '(unknown)'} requires categories_any or tags_any.`);
      }
    }
  } catch (error) {
    errors.push(`config/concept-config.yaml is invalid YAML: ${error.message}`);
  }
}

if (!fs.existsSync(conceptPath)) {
  errors.push('data/concepts.json does not exist. Run npm run concepts:build first.');
} else {
  try {
    const index = JSON.parse(fs.readFileSync(conceptPath, 'utf8'));
    errors.push(...validateConceptIndex(index, cardIds));
    if (index.stats?.card_count !== cards.length) errors.push('concept index stats.card_count does not match current cards.');
    if (index.stats?.concept_count !== index.concepts?.length) errors.push('concept index stats.concept_count mismatch.');
    if (index.stats?.card_concept_edge_count !== index.card_concepts?.length) errors.push('concept index stats.card_concept_edge_count mismatch.');
    if (index.stats?.concept_relation_edge_count !== index.concept_relations?.length) errors.push('concept index stats.concept_relation_edge_count mismatch.');
  } catch (error) {
    errors.push(`data/concepts.json is invalid JSON: ${error.message}`);
  }
}

if (errors.length) {
  console.error('Concept validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Concept validation passed for ${cards.length} cards.`);
