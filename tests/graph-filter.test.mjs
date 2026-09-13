import assert from 'node:assert/strict';
import test from 'node:test';
import {
  activeFilterCount,
  buildCardRelationTypes,
  cardMatchesFilters,
  collectGraphFacets,
  matchingCardIds,
  matchingGraphResults,
  nodeMatchesGraphSearch,
  semanticAllowedCardIds
} from '../docs/.vitepress/theme/lib/graph-filter.mjs';

const nodes = [
  {
    id: 'card:a',
    entityId: 'a',
    kind: 'card',
    categories: ['Agent', 'LLM'],
    actions: ['TRY'],
    tags: ['mcp', 'memory'],
    sourceType: 'github',
    resourceKind: 'project',
    relevance: { overall: 5 }
  },
  {
    id: 'card:b',
    entityId: 'b',
    kind: 'card',
    categories: ['Agent'],
    actions: ['WATCH'],
    tags: ['memory'],
    sourceType: 'article',
    resourceKind: null,
    relevance: { overall: 4 }
  },
  {
    id: 'card:c',
    entityId: 'c',
    kind: 'card',
    categories: ['Image Generation'],
    actions: ['REFERENCE'],
    tags: ['diffusion'],
    sourceType: 'github',
    resourceKind: 'skill',
    relevance: { overall: 3 }
  }
];

const edges = [
  { kind: 'card-card', source: 'card:a', target: 'card:b', type: 'similar_to' },
  { kind: 'card-card', source: 'card:b', target: 'card:c', type: 'contrasts_with' }
];

const semantic = {
  distancesByCard: {
    a: [
      { cardId: 'b', similarity: 0.85, distance: 0.15 },
      { cardId: 'c', similarity: 0.55, distance: 0.45 }
    ]
  }
};

test('graph filters use OR within a group and AND across groups', () => {
  const relationTypesByCard = buildCardRelationTypes(edges);
  const filters = {
    categories: ['Agent', 'RAG / Memory / Knowledge'],
    actions: ['TRY'],
    tags: [],
    sourceTypes: ['github'],
    resourceKinds: [],
    relationTypes: ['similar_to'],
    minimumRelevance: 4
  };

  assert.equal(cardMatchesFilters(nodes[0], filters, { relationTypesByCard }), true);
  assert.equal(cardMatchesFilters(nodes[1], filters, { relationTypesByCard }), false);
  assert.equal(cardMatchesFilters(nodes[2], filters, { relationTypesByCard }), false);
});

test('semantic distance filters work against the full compact distance index', () => {
  assert.deepEqual(
    [...semanticAllowedCardIds({
      selectedCardId: 'a',
      semantic,
      mode: 'distance',
      maxDistance: 0.2
    })],
    ['a', 'b']
  );

  assert.deepEqual(
    [...semanticAllowedCardIds({
      selectedCardId: 'a',
      semantic,
      mode: 'top',
      topN: 1
    })],
    ['a', 'b']
  );
});

test('matchingCardIds composes metadata, relation, and semantic filters', () => {
  const ids = matchingCardIds({
    nodes,
    edges,
    semantic,
    selectedCardId: 'a',
    filters: {
      categories: ['Agent'],
      actions: [],
      tags: ['memory'],
      sourceTypes: [],
      resourceKinds: [],
      relationTypes: ['similar_to'],
      minimumRelevance: 4,
      semanticEnabled: true,
      semanticMode: 'distance',
      semanticMaxDistance: 0.2
    }
  });

  assert.deepEqual([...ids].sort(), ['a', 'b']);
});

test('collectGraphFacets derives values and tag counts from projected cards', () => {
  const facets = collectGraphFacets(nodes);
  assert.deepEqual(facets.actions, ['REFERENCE', 'TRY', 'WATCH']);
  assert.ok(facets.categories.includes('Agent'));
  assert.deepEqual(facets.tags[0], { value: 'memory', count: 2 });
  assert.deepEqual(facets.resourceKinds, ['project', 'skill']);
});

test('activeFilterCount counts active filter groups instead of selected values', () => {
  assert.equal(activeFilterCount({
    categories: ['Agent', 'LLM'],
    actions: ['TRY'],
    tags: [],
    sourceTypes: [],
    resourceKinds: [],
    relationTypes: ['similar_to'],
    minimumRelevance: 4,
    semanticEnabled: true
  }), 5);
});


test('graph search and metadata filters share one card result set', () => {
  const results = matchingGraphResults({
    nodes: [
      ...nodes,
      { id: 'concept:memory', kind: 'concept', label: 'Memory', description: 'Agent memory' }
    ],
    edges: [
      ...edges,
      { kind: 'card-concept', source: 'card:a', target: 'concept:memory' },
      { kind: 'card-concept', source: 'card:b', target: 'concept:memory' }
    ],
    semantic,
    selectedCardId: null,
    query: 'memory',
    filters: {
      categories: ['Agent'],
      actions: [],
      tags: [],
      sourceTypes: [],
      resourceKinds: [],
      relationTypes: [],
      minimumRelevance: 1,
      semanticEnabled: false
    }
  });

  assert.deepEqual([...results.cardIds].sort(), ['a', 'b']);
  assert.equal(results.directNodeIds.has('concept:memory'), true);
  assert.equal(results.contextConceptNodeIds.has('concept:memory'), true);
});

test('concept search keeps directly connected cards but still respects active filters', () => {
  const results = matchingGraphResults({
    nodes: [
      ...nodes,
      { id: 'concept:vision', kind: 'concept', label: 'Computer Vision', description: 'vision' }
    ],
    edges: [
      ...edges,
      { kind: 'card-concept', source: 'card:a', target: 'concept:vision' },
      { kind: 'card-concept', source: 'card:c', target: 'concept:vision' }
    ],
    semantic,
    selectedCardId: null,
    query: 'Computer Vision',
    filters: {
      categories: ['Agent'],
      actions: [],
      tags: [],
      sourceTypes: [],
      resourceKinds: [],
      relationTypes: [],
      minimumRelevance: 1,
      semanticEnabled: false
    }
  });

  assert.deepEqual([...results.cardIds], ['a']);
  assert.equal(nodeMatchesGraphSearch({ label: 'Computer Vision', kind: 'concept' }, 'vision'), true);
});
