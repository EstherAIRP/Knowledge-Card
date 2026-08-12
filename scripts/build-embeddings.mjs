import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { loadCards } from './lib/knowledge.mjs';
import { buildEmbeddingText, embeddingContentHash } from './lib/semantic-relations.mjs';
import {
  createLocalTransformerEmbeddings,
  createOpenAICompatibleEmbeddings
} from './lib/model-clients.mjs';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const contentRoot = path.join(repoRoot, 'content', 'knowledge');
const configPath = path.join(repoRoot, 'config', 'relation-config.yaml');
const outputPath = path.join(repoRoot, 'data', 'embeddings.json');
const fullRebuild = process.argv.includes('--full');

function readConfig() {
  if (!fs.existsSync(configPath)) throw new Error('Missing config/relation-config.yaml.');
  const config = parseYaml(fs.readFileSync(configPath, 'utf8')) ?? {};
  if (config.schema_version !== 1) throw new Error('relation-config schema_version must equal 1.');
  return config;
}

function readExisting() {
  if (!fs.existsSync(outputPath)) return { schema_version: 1, entries: [] };
  try {
    return JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  } catch {
    return { schema_version: 1, entries: [] };
  }
}

function calculateInputHash(entries, provider, model) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify({
      provider,
      model,
      entries: entries.map((entry) => [entry.card_id, entry.content_hash]).sort((a, b) => a[0].localeCompare(b[0]))
    }))
    .digest('hex');
}

async function createVectors(texts, semanticConfig) {
  const provider = semanticConfig.provider ?? 'local-transformers';
  if (provider === 'local-transformers') {
    return createLocalTransformerEmbeddings(texts, { model: semanticConfig.model });
  }

  if (provider === 'openai-compatible') {
    const apiConfig = semanticConfig.openai_compatible ?? {};
    const apiKeyEnv = apiConfig.api_key_env ?? 'OPENAI_API_KEY';
    const apiKey = process.env[apiKeyEnv];
    if (!apiKey) throw new Error(`Embedding provider requires environment variable ${apiKeyEnv}.`);
    return createOpenAICompatibleEmbeddings(texts, {
      baseUrl: apiConfig.base_url,
      model: apiConfig.model,
      apiKey,
      timeoutMs: 45000,
      retries: 2
    });
  }

  throw new Error(`Unsupported semantic provider: ${provider}`);
}

const config = readConfig();
const semantic = config.semantic ?? {};
if (semantic.enabled === false) {
  console.log('Semantic embeddings are disabled by config.');
  process.exit(0);
}

const provider = semantic.provider ?? 'local-transformers';
const model = provider === 'openai-compatible'
  ? semantic.openai_compatible?.model
  : semantic.model;
if (!model) throw new Error('Semantic embedding model is not configured.');

const cards = loadCards(contentRoot).sort((a, b) => a.data.id.localeCompare(b.data.id));
const existing = readExisting();
const existingMap = new Map((existing.entries ?? []).map((entry) => [entry.card_id, entry]));
const inputs = cards.map((card) => {
  const text = buildEmbeddingText(card);
  return {
    card_id: card.data.id,
    text,
    content_hash: embeddingContentHash(text, { provider, model })
  };
});

const entries = [];
const stale = [];
for (const input of inputs) {
  const cached = existingMap.get(input.card_id);
  const reusable = !fullRebuild && cached?.content_hash === input.content_hash &&
    cached?.provider === provider && cached?.model === model && Array.isArray(cached?.embedding);
  if (reusable) {
    entries.push(cached);
  } else {
    stale.push(input);
  }
}

const batchSize = Math.max(1, Number(semantic.batch_size ?? 16));
for (let start = 0; start < stale.length; start += batchSize) {
  const batch = stale.slice(start, start + batchSize);
  const vectors = await createVectors(batch.map((item) => item.text), semantic);
  for (let index = 0; index < batch.length; index += 1) {
    const vector = vectors[index];
    if (!Array.isArray(vector) || vector.length === 0 || vector.some((value) => !Number.isFinite(Number(value)))) {
      throw new Error(`Invalid embedding returned for ${batch[index].card_id}.`);
    }
    entries.push({
      card_id: batch[index].card_id,
      content_hash: batch[index].content_hash,
      provider,
      model,
      dimensions: vector.length,
      embedding: vector.map((value) => Number(value))
    });
  }
  console.log(`Embedded ${Math.min(start + batch.length, stale.length)} / ${stale.length} changed cards.`);
}

entries.sort((a, b) => a.card_id.localeCompare(b.card_id));
const index = {
  schema_version: 1,
  generated_at: stale.length || fullRebuild ? new Date().toISOString() : existing.generated_at ?? new Date().toISOString(),
  provider,
  model,
  card_count: cards.length,
  input_hash: calculateInputHash(entries, provider, model),
  entries
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
const serialized = `${JSON.stringify(index, null, 2)}\n`;
const oldSerialized = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
if (oldSerialized === serialized) {
  console.log(`Embedding index unchanged (${entries.length} cards).`);
} else {
  fs.writeFileSync(outputPath, serialized, 'utf8');
  console.log(`Embedding index written: ${entries.length} cards, ${stale.length} regenerated.`);
}
