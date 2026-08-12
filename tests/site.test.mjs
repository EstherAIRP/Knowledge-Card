import test from 'node:test';
import assert from 'node:assert/strict';
import knowledgeData from '../docs/knowledge.data.js';
import graphData from '../docs/graph.data.js';
import conceptRoutes from '../docs/concepts/[id].paths.js';
import knowledgeRoutes from '../docs/knowledge/[id].paths.js';

test('website data loader projects real Knowledge Cards', () => {
  const cards = knowledgeData.load();
  assert.ok(cards.length >= 1);

  const personalModel = cards.find((card) => card.id === 'github-intuition-lab-personal-model');
  assert.ok(personalModel);
  assert.equal(personalModel.route, '/knowledge/github-intuition-lab-personal-model');
  assert.equal(personalModel.relevance.overall, 5);
  assert.ok(personalModel.categories.includes('Agent'));
  assert.ok(personalModel.actions.includes('TRY'));
  assert.ok(personalModel.tags.includes('mcp'));
});

test('dynamic route loader emits one route per Knowledge Card', () => {
  const cards = knowledgeData.load();
  const routes = knowledgeRoutes.paths();
  assert.equal(routes.length, cards.length);

  const route = routes.find((item) => item.params.id === 'github-intuition-lab-personal-model');
  assert.ok(route);
  assert.equal(route.params.card.title, 'Personal Model');
  assert.equal(route.params.card.cardPath, 'content/knowledge/2026/github-intuition-lab-personal-model.md');
  assert.ok(Array.isArray(route.params.card.related));
  assert.ok(Array.isArray(route.params.card.concepts));
  assert.match(route.content, /^# Personal Model/m);
  assert.match(route.content, /^## 與你的相關性/m);
});

test('website routes project Phase 2 relation semantics', () => {
  const routes = knowledgeRoutes.paths();
  const relation = routes
    .flatMap((route) => route.params.card.related ?? [])
    .find((item) => item.scores?.semantic !== null && item.scores?.semantic !== undefined);

  assert.ok(relation, 'expected at least one semantic relation');
  assert.ok([
    'similar_to',
    'alternative_to',
    'complements',
    'integrates_with',
    'depends_on',
    'extends',
    'contrasts_with'
  ].includes(relation.type));
  assert.ok(['undirected', 'source_to_target', 'target_to_source'].includes(relation.direction));
  assert.equal(typeof relation.reason, 'string');
  assert.ok(relation.reason.length > 0);
  assert.equal(typeof relation.scores.taxonomy, 'number');
  assert.equal(typeof relation.scores.semantic, 'number');
  assert.ok(['llm', 'heuristic-fallback'].includes(relation.classifier));
});

test('Knowledge Card routes project Phase 3 Concept neighborhoods', () => {
  const routes = knowledgeRoutes.paths();
  const route = routes.find((item) => item.params.id === 'github-intuition-lab-personal-model');
  assert.ok(route);
  assert.ok(route.params.card.concepts.length > 0, 'expected Personal Model to have Concept mappings');

  const concept = route.params.card.concepts.find((item) => item.id === 'agent-memory');
  assert.ok(concept, 'expected promoted Agent Memory Concept');
  assert.equal(concept.route, '/concepts/agent-memory');
  assert.ok(concept.strength > 0 && concept.strength <= 1);
  assert.ok(Array.isArray(concept.evidence));
  assert.ok(concept.evidence.length > 0);
});

test('dynamic Concept routes expose supporting Cards and Concept neighborhood', () => {
  const routes = conceptRoutes.paths();
  assert.ok(routes.length > 0);

  const route = routes.find((item) => item.params.id === 'agent-memory');
  assert.ok(route, 'expected Agent Memory Concept route');
  assert.equal(route.params.concept.label, 'Agent Memory');
  assert.ok(route.params.concept.cards.some((card) => card.id === 'github-intuition-lab-personal-model'));
  assert.ok(Array.isArray(route.params.concept.related));
  assert.match(route.content, /^# Agent Memory/m);
});

test('graph data loader unifies Card, Concept, and relation edge families', () => {
  const graph = graphData.load();
  assert.ok(graph.nodes.some((node) => node.kind === 'card'));
  assert.ok(graph.nodes.some((node) => node.kind === 'concept'));
  assert.ok(graph.edges.some((edge) => edge.kind === 'card-concept'));
  assert.ok(graph.edges.some((edge) => edge.kind === 'concept-concept'));
  assert.ok(graph.edges.some((edge) => edge.kind === 'card-card'));
  assert.equal(graph.stats.cards, knowledgeData.load().length);
  assert.ok(graph.stats.concepts > 0);
});
