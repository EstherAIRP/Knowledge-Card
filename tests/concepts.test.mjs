import test from 'node:test';
import assert from 'node:assert/strict';
import { buildConceptIndex, normalizeConceptToken, validateConceptIndex } from '../scripts/lib/concepts.mjs';

function card(id, categories, tags) {
  return {
    data: {
      id,
      classification: {
        categories: { ai: categories, user: null },
        tags: { ai: tags, user: null }
      }
    }
  };
}

const config = {
  extraction: {
    include_categories: true,
    include_shared_tags: true,
    minimum_tag_support: 2,
    concept_relation_min_support: 2,
    concept_relation_top_k: 8
  },
  promoted_concepts: [
    {
      id: 'agent-memory',
      label: 'Agent Memory',
      type: 'architecture',
      description: 'memory',
      match: { categories_any: ['RAG / Memory / Knowledge'], tags_any: ['agent-memory'] }
    }
  ]
};

test('concept token normalization canonicalizes case and punctuation', () => {
  assert.equal(normalizeConceptToken('Claude-Code'), 'claude-code');
  assert.equal(normalizeConceptToken('RAG / Memory / Knowledge'), 'rag-memory-knowledge');
  assert.equal(normalizeConceptToken('AI & ML'), 'ai-and-ml');
});

test('concept builder promotes categories and repeated tags but prunes singleton tags', () => {
  const cards = [
    card('a', ['Agent', 'RAG / Memory / Knowledge'], ['Claude-Code', 'agent-memory', 'only-a']),
    card('b', ['Agent', 'RAG / Memory / Knowledge'], ['claude code', 'agent-memory', 'only-b']),
    card('c', ['General Tools'], ['only-c'])
  ];
  const index = buildConceptIndex(cards, config);
  const ids = new Set(index.concepts.map((concept) => concept.id));

  assert.ok(ids.has('category-agent'));
  assert.ok(ids.has('category-rag-memory-knowledge'));
  assert.ok(ids.has('tag-agent-memory'));
  assert.ok(ids.has('agent-memory'));
  assert.ok(!ids.has('tag-only-a'));
  assert.ok(!ids.has('tag-only-c'));

  const promoted = index.concepts.find((concept) => concept.id === 'agent-memory');
  assert.equal(promoted.card_count, 2);
  assert.ok(index.card_concepts.some((edge) => edge.card_id === 'a' && edge.concept_id === 'agent-memory'));
});

test('concept relations require cross-card support and index validates references', () => {
  const cards = [
    card('a', ['Agent', 'RAG / Memory / Knowledge'], ['agent-memory']),
    card('b', ['Agent', 'RAG / Memory / Knowledge'], ['agent-memory']),
    card('c', ['Agent'], ['other'])
  ];
  const built = buildConceptIndex(cards, config);
  const index = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    input_hash: 'test',
    ...built
  };
  assert.ok(index.concept_relations.some((edge) => edge.source === 'agent-memory' || edge.target === 'agent-memory'));
  assert.deepEqual(validateConceptIndex(index, new Set(['a', 'b', 'c'])), []);
});
