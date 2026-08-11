import test from 'node:test';
import assert from 'node:assert/strict';
import knowledgeData from '../docs/knowledge.data.js';
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
  assert.match(route.content, /^# Personal Model/m);
  assert.match(route.content, /^## 與你的相關性/m);
});
