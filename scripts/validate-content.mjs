import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { parse as parseYaml } from 'yaml';
import {
  REQUIRED_SECTIONS,
  canonicalizeSource,
  loadCards
} from './lib/knowledge.mjs';

const root = process.cwd();
const schemaPath = path.join(root, 'schema/knowledge-card.schema.json');
const taxonomyPath = path.join(root, 'config/taxonomy.yaml');
const contentRoot = path.join(root, 'content/knowledge');

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const taxonomy = parseYaml(fs.readFileSync(taxonomyPath, 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validateSchema = ajv.compile(schema);

const errors = [];
const warnings = [];

function sameArray(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((value, i) => value === b[i]);
}

function validateContractDrift() {
  const schemaCategories = schema.$defs?.category?.enum;
  const schemaActions = schema.$defs?.action?.enum;
  const schemaStatuses = schema.$defs?.status?.enum;
  const schemaSourceTypes = schema.properties?.source?.properties?.type?.enum;
  const schemaRelevance = schema.$defs?.fullRelevance?.required;

  if (!sameArray(schemaCategories, taxonomy.categories)) {
    errors.push('CONTRACT: schema categories differ from config/taxonomy.yaml.');
  }
  if (!sameArray(schemaActions, Object.keys(taxonomy.actions || {}))) {
    errors.push('CONTRACT: schema actions differ from config/taxonomy.yaml.');
  }
  if (!sameArray(schemaStatuses, taxonomy.statuses)) {
    errors.push('CONTRACT: schema statuses differ from config/taxonomy.yaml.');
  }
  if (!sameArray(schemaSourceTypes, taxonomy.source_types)) {
    errors.push('CONTRACT: schema source types differ from config/taxonomy.yaml.');
  }
  if (!sameArray(schemaRelevance, Object.keys(taxonomy.relevance_dimensions || {}))) {
    errors.push('CONTRACT: schema relevance dimensions differ from config/taxonomy.yaml.');
  }
}

function validateBody(card) {
  let previous = -1;
  for (const heading of REQUIRED_SECTIONS) {
    const match = new RegExp(`^## ${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm').exec(card.body);
    if (!match) {
      errors.push(`${card.filePath}: missing required section "## ${heading}".`);
      continue;
    }
    if (match.index <= previous) {
      errors.push(`${card.filePath}: section "## ${heading}" is out of canonical order.`);
    }
    previous = match.index;
  }

  const h1 = /^#\s+(.+)$/m.exec(card.body)?.[1]?.trim();
  if (!h1) {
    errors.push(`${card.filePath}: missing H1 title.`);
  } else if (h1 !== card.data.title) {
    errors.push(`${card.filePath}: H1 title does not match frontmatter title.`);
  }
}

function validateSource(card) {
  try {
    const resolved = canonicalizeSource(card.data.canonical_url);
    if (resolved.canonicalUrl !== card.data.canonical_url) {
      errors.push(`${card.filePath}: canonical_url is not normalized; expected ${resolved.canonicalUrl}.`);
    }
    if (resolved.identity !== card.data.source.identity) {
      errors.push(`${card.filePath}: source.identity does not match canonical_url; expected ${resolved.identity}.`);
    }
    if (card.data.source.type === 'github' && resolved.sourceType !== 'github') {
      errors.push(`${card.filePath}: source.type is github but canonical_url is not a GitHub repository URL.`);
    }
  } catch (error) {
    errors.push(`${card.filePath}: canonical source resolution failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function validateDates(card) {
  const created = card.data.created_at;
  const updated = card.data.updated_at;
  const checked = card.data.last_checked_at;
  if (updated < created) {
    errors.push(`${card.filePath}: updated_at must be >= created_at.`);
  }
  if (checked < created) {
    warnings.push(`${card.filePath}: last_checked_at is earlier than created_at.`);
  }
}

validateContractDrift();

let cards = [];
try {
  cards = loadCards(contentRoot);
} catch (error) {
  errors.push(`CONTENT_PARSE: ${error instanceof Error ? error.message : String(error)}`);
}

const seen = {
  id: new Map(),
  identity: new Map(),
  canonical: new Map()
};

for (const card of cards) {
  const valid = validateSchema(card.data);
  if (!valid) {
    for (const issue of validateSchema.errors || []) {
      errors.push(`${card.filePath}${issue.instancePath || '/'}: ${issue.message}`);
    }
  }

  validateBody(card);
  validateSource(card);
  validateDates(card);

  const uniqueValues = [
    ['id', card.data.id],
    ['identity', card.data?.source?.identity],
    ['canonical', card.data.canonical_url]
  ];
  for (const [kind, value] of uniqueValues) {
    if (!value) continue;
    if (seen[kind].has(value)) {
      errors.push(`${card.filePath}: duplicate ${kind} "${value}" also used by ${seen[kind].get(value)}.`);
    } else {
      seen[kind].set(value, card.filePath);
    }
  }
}

if (warnings.length) {
  console.warn(`Warnings (${warnings.length}):`);
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (errors.length) {
  console.error(`Validation failed (${errors.length} error${errors.length === 1 ? '' : 's'}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Validation passed: ${cards.length} Knowledge Card${cards.length === 1 ? '' : 's'}, no duplicate IDs/source identities/canonical URLs.`);
