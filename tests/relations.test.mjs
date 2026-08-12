import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyRelationOverrides,
  buildGeneratedRelations,
  scoreCardPair,
  validateRelationIndex,
  validateRelationOverrides
} from '../scripts/lib/relations.mjs';
import {
  buildSemanticCandidates,
  combineTaxonomySemantic,
  cosineSimilarity,
  materializeClassifiedRelation,
  normalizeSemanticSimilarity,
  validateClassifierOutput
} from '../scripts/lib/semantic-relations.mjs';

function card(id, { categories = [], tags = [], relevance = {}, actions = [], title = id, summary = '' } = {}) {
  return {
    data: {
      id,
      title,
      summary,
      classification: {
        categories: { ai: categories, user: null },
        tags: { ai: tags, user: null }
      },
      relevance: {
        ai: {
          overall: 3,
          ai_rd: 1,
          aoi_ai: 1,
          llm_agent: 1,
          sillytavern_ai_rpg: 1,
          image_gen: 1,
          ...relevance
        },
        user: {}
      },
      actions: { ai: actions, user: null }
    },
    body: `# ${title}\n\n## 一句話介紹\n\n${summary}\n\n## 核心概念\n\n${summary}\n`
  };
}

test('relation scoring rewards shared categories, tags, relevance, and actions', () => {
  const left = card('a', {
    categories: ['Agent', 'RAG / Memory / Knowledge'],
    tags: ['memory', 'local-first'],
    relevance: { llm_agent: 5 },
    actions: ['LEARN', 'REFERENCE']
  });
  const right = card('b', {
    categories: ['Agent', 'RAG / Memory / Knowledge'],
    tags: ['memory', 'context'],
    relevance: { llm_agent: 4 },
    actions: ['LEARN']
  });

  const relation = scoreCardPair(left, right);
  assert.ok(relation.score >= 0.58);
  assert.equal(relation.type, 'similar_to');
  assert.ok(relation.signals.includes('category:Agent'));
  assert.ok(relation.signals.includes('tag:memory'));
  assert.ok(relation.signals.includes('relevance:llm_agent'));
});

test('generated relation builder excludes weak pairs and respects top-k degree caps', () => {
  const cards = [
    card('a', { categories: ['Agent'], tags: ['memory'], relevance: { llm_agent: 5 } }),
    card('b', { categories: ['Agent'], tags: ['memory'], relevance: { llm_agent: 5 } }),
    card('c', { categories: ['Agent'], tags: ['memory'], relevance: { llm_agent: 5 } }),
    card('d', { categories: ['Image Generation'], tags: ['diffusion'], relevance: { image_gen: 5 } })
  ];

  const relations = buildGeneratedRelations(cards, {
    minScore: 0.2,
    similarToMinScore: 0.5,
    topK: 1,
    weights: { categories: 0.45, tags: 0.30, relevance: 0.20, actions: 0.05 }
  });

  assert.equal(relations.length, 1);
  assert.ok(!relations.some((edge) => edge.source === 'd' || edge.target === 'd'));
});

test('blocked overrides remove generated edges while pinned overrides can add one', () => {
  const generated = [
    { source: 'a', target: 'b', type: 'similar_to', direction: 'undirected', score: 0.5, signals: ['category:Agent'] }
  ];
  const effective = applyRelationOverrides(generated, {
    blocked: [{ source: 'a', target: 'b' }],
    pinned: [{ source: 'a', target: 'c', type: 'similar_to', direction: 'undirected', score: 1 }]
  });

  assert.equal(effective.length, 1);
  assert.equal(effective[0].target, 'c');
  assert.equal(effective[0].pinned, true);
});

test('relation index validation catches invalid references, duplicate pairs, and self references', () => {
  const errors = validateRelationIndex({
    schema_version: 1,
    edges: [
      { source: 'a', target: 'b', type: 'related', score: 0.5, signals: [] },
      { source: 'b', target: 'a', type: 'similar_to', score: 0.8, signals: [] },
      { source: 'a', target: 'a', type: 'related', score: 0.4, signals: [] },
      { source: 'a', target: 'missing', type: 'unknown', score: 2, signals: 'bad' }
    ]
  }, new Set(['a', 'b']));

  assert.ok(errors.some((message) => message.includes('duplicates relation pair')));
  assert.ok(errors.some((message) => message.includes('self-reference')));
  assert.ok(errors.some((message) => message.includes('does not exist')));
  assert.ok(errors.some((message) => message.includes('unsupported type')));
  assert.ok(errors.some((message) => message.includes('between 0 and 1')));
});

test('semantic helpers normalize cosine similarity and combine it with taxonomy score', () => {
  assert.equal(cosineSimilarity([1, 0], [1, 0]), 1);
  assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
  assert.equal(normalizeSemanticSimilarity(0.825, {
    semantic: { normalization_floor: 0.70, normalization_ceiling: 0.95 }
  }), 0.5);
  assert.equal(combineTaxonomySemantic(0.5, 0.75, {
    scoring: { taxonomy_weight: 0.4, semantic_weight: 0.6 }
  }), 0.65);
});

test('semantic candidate builder can discover a semantically strong pair', () => {
  const cards = [
    card('a', { categories: ['Agent'], tags: ['memory'] }),
    card('b', { categories: ['Agent'], tags: ['context'] }),
    card('c', { categories: ['Image Generation'], tags: ['diffusion'] })
  ];
  const embeddingIndex = {
    entries: [
      { card_id: 'a', embedding: [1, 0] },
      { card_id: 'b', embedding: [0.98, 0.2] },
      { card_id: 'c', embedding: [0, 1] }
    ]
  };
  const config = {
    candidate: { min_taxonomy_score: 0.01, top_k: 4 },
    semantic: { min_score: 0.3, normalization_floor: 0, normalization_ceiling: 1 },
    scoring: { taxonomy_weight: 0.4, semantic_weight: 0.6, min_combined_score: 0.3 }
  };

  const candidates = buildSemanticCandidates(cards, embeddingIndex, config);
  assert.ok(candidates.some((candidate) => candidate.source === 'a' && candidate.target === 'b'));
  assert.ok(!candidates.some((candidate) => candidate.source === 'a' && candidate.target === 'c'));
});

test('classifier contract validates directional relations and materializes score breakdown', () => {
  const invalid = validateClassifierOutput({
    related: true,
    type: 'depends_on',
    direction: 'undirected',
    confidence: 0.9,
    reason: 'direction missing'
  });
  assert.ok(invalid.some((message) => message.includes('direction must be directional')));

  const candidate = {
    source: 'a',
    target: 'b',
    taxonomy_score: 0.4,
    semantic_score: 0.8,
    semantic_raw_score: 0.9,
    combined_score: 0.64,
    signals: ['category:Agent']
  };
  const edge = materializeClassifiedRelation(candidate, {
    related: true,
    type: 'extends',
    direction: 'source_to_target',
    confidence: 0.9,
    reason: 'A 在 B 的能力上增加一層功能。',
    classifier: 'llm'
  }, { scoring: { llm_weight: 0.35 } });

  assert.equal(edge.type, 'extends');
  assert.equal(edge.direction, 'source_to_target');
  assert.equal(edge.scores.semantic, 0.8);
  assert.equal(edge.scores.llm, 0.9);
  assert.ok(edge.score > candidate.combined_score);
});

test('manual directional overrides require an explicit direction', () => {
  const errors = validateRelationOverrides({
    pinned: [{ source: 'a', target: 'b', type: 'depends_on' }],
    blocked: [],
    overrides: []
  }, new Set(['a', 'b']));
  assert.ok(errors.some((message) => message.includes('direction must be directional')));
});
