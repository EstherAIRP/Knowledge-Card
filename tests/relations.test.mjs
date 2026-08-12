import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyRelationOverrides,
  buildGeneratedRelations,
  scoreCardPair,
  validateRelationIndex
} from '../scripts/lib/relations.mjs';

function card(id, { categories = [], tags = [], relevance = {}, actions = [] } = {}) {
  return {
    data: {
      id,
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
    }
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
    { source: 'a', target: 'b', type: 'related', score: 0.5, signals: ['category:Agent'] }
  ];
  const effective = applyRelationOverrides(generated, {
    blocked: [{ source: 'a', target: 'b' }],
    pinned: [{ source: 'a', target: 'c', type: 'similar_to', score: 1 }]
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
