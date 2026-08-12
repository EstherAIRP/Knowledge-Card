import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { loadCards } from './lib/knowledge.mjs';
import { validateRelationIndex, validateRelationOverrides } from './lib/relations.mjs';
import { PHASE2_RELATION_TYPE_SET, validateClassifierOutput } from './lib/semantic-relations.mjs';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const contentRoot = path.join(repoRoot, 'content', 'knowledge');
const relationPath = path.join(repoRoot, 'data', 'relations.json');
const overridePath = path.join(repoRoot, 'config', 'relation-overrides.yaml');
const configPath = path.join(repoRoot, 'config', 'relation-config.yaml');

function validateUnitInterval(value, label, errors) {
  if (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 1) {
    errors.push(`${label} must be between 0 and 1.`);
  }
}

function validateConfig(config, errors) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    errors.push('relation config must be an object.');
    return;
  }
  if (config.schema_version !== 1) errors.push('relation-config schema_version must equal 1.');
  validateUnitInterval(config.candidate?.min_taxonomy_score ?? 0, 'candidate.min_taxonomy_score', errors);
  validateUnitInterval(config.semantic?.min_score ?? 0, 'semantic.min_score', errors);
  validateUnitInterval(config.scoring?.taxonomy_weight ?? 0, 'scoring.taxonomy_weight', errors);
  validateUnitInterval(config.scoring?.semantic_weight ?? 0, 'scoring.semantic_weight', errors);
  validateUnitInterval(config.scoring?.llm_weight ?? 0, 'scoring.llm_weight', errors);
  validateUnitInterval(config.scoring?.min_combined_score ?? 0, 'scoring.min_combined_score', errors);

  if (!Number.isInteger(Number(config.candidate?.top_k)) || Number(config.candidate?.top_k) < 1) {
    errors.push('candidate.top_k must be a positive integer.');
  }
  if (!Number.isInteger(Number(config.classifier?.max_candidates_per_card)) || Number(config.classifier?.max_candidates_per_card) < 1) {
    errors.push('classifier.max_candidates_per_card must be a positive integer.');
  }

  const allowed = config.relations?.allowed_types;
  if (!Array.isArray(allowed) || allowed.length === 0) {
    errors.push('relations.allowed_types must be a non-empty array.');
  } else {
    for (const type of allowed) {
      if (!PHASE2_RELATION_TYPE_SET.has(type)) errors.push(`relations.allowed_types contains unsupported Phase 2 type: ${type}`);
    }
  }
}

const cards = loadCards(contentRoot);
const cardIds = new Set(cards.map((card) => card.data.id));
const errors = [];

if (!fs.existsSync(relationPath)) {
  errors.push('data/relations.json does not exist. Run npm run relations:build first.');
} else {
  try {
    const index = JSON.parse(fs.readFileSync(relationPath, 'utf8'));
    errors.push(...validateRelationIndex(index, cardIds));
    if (index.schema_version >= 2) {
      if (!index.pipeline || typeof index.pipeline !== 'object') errors.push('Phase 2 relation index requires pipeline metadata.');
      if (!index.classifications || typeof index.classifications !== 'object' || Array.isArray(index.classifications)) {
        errors.push('Phase 2 relation index requires classifications object.');
      } else {
        for (const [key, classification] of Object.entries(index.classifications)) {
          if (!classification?.candidate_hash || typeof classification.candidate_hash !== 'string') {
            errors.push(`classification ${key} requires candidate_hash.`);
          }
          errors.push(...validateClassifierOutput(classification).map((message) => `classification ${key}: ${message}`));
        }
      }
    }
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

if (!fs.existsSync(configPath)) {
  errors.push('config/relation-config.yaml does not exist.');
} else {
  try {
    validateConfig(parseYaml(fs.readFileSync(configPath, 'utf8')) ?? {}, errors);
  } catch (error) {
    errors.push(`config/relation-config.yaml is invalid YAML: ${error.message}`);
  }
}

if (errors.length) {
  console.error('Relation validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Relation validation passed for ${cards.length} cards.`);
