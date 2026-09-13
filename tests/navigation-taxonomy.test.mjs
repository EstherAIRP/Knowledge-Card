import test from 'node:test';
import assert from 'node:assert/strict';
import {
  compareUserOwnedState,
  effectiveNavigationCategories,
  effectiveResourceKind
} from '../scripts/lib/knowledge.mjs';

function cardData({
  navigationAi,
  navigationUser,
  semanticCategories = ['Agent'],
  sourceType = 'github',
  aiKind = 'project',
  userKind = null
} = {}) {
  return {
    source: { type: sourceType },
    resource_kind: { ai: aiKind, user: userKind },
    navigation: navigationAi
      ? { categories: { ai: navigationAi, user: navigationUser ?? null } }
      : undefined,
    classification: {
      categories: { ai: semanticCategories, user: null },
      tags: { ai: [], user: null }
    }
  };
}

test('human navigation uses navigation categories without replacing semantic categories', () => {
  const data = cardData({
    navigationAi: ['Video Creation', 'Automation / Productivity'],
    semanticCategories: ['Agent', 'Image Generation']
  });
  assert.deepEqual(effectiveNavigationCategories(data), ['Video Creation', 'Automation / Productivity']);
  assert.deepEqual(data.classification.categories.ai, ['Agent', 'Image Generation']);
});

test('human navigation user override wins over AI navigation categories', () => {
  const data = cardData({
    navigationAi: ['Agent / Harness'],
    navigationUser: ['Memory / RAG / Knowledge']
  });
  assert.deepEqual(effectiveNavigationCategories(data), ['Memory / RAG / Knowledge']);
});

test('legacy cards fall back to semantic categories for human navigation', () => {
  const data = cardData({ navigationAi: undefined, semanticCategories: ['LLM', 'Agent'] });
  assert.deepEqual(effectiveNavigationCategories(data), ['LLM', 'Agent']);
});

test('resource kind works for non-GitHub resources when explicitly classified', () => {
  assert.equal(effectiveResourceKind(cardData({
    sourceType: 'article',
    aiKind: 'tutorial'
  })), 'tutorial');
});

test('adding AI navigation with user null preserves user-owned state', () => {
  const body = '## 使用者備註\n\n保留。\n\n## 更新紀錄\n';
  const shared = {
    id: 'example',
    created_at: '2026-08-01',
    resource_kind: { ai: 'project', user: null },
    classification: {
      categories: { ai: ['Agent'], user: null },
      tags: { ai: [], user: null }
    },
    relevance: { user: {} },
    actions: { user: null },
    status: { user: null }
  };

  const before = { data: { ...shared }, body };
  const after = {
    data: {
      ...shared,
      navigation: {
        categories: { ai: ['Agent / Harness'], user: null }
      }
    },
    body
  };

  assert.deepEqual(compareUserOwnedState(before, after), []);
});
