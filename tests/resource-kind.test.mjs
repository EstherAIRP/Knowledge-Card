import test from 'node:test';
import assert from 'node:assert/strict';
import { compareUserOwnedState, effectiveResourceKind } from '../scripts/lib/knowledge.mjs';

function cardData({ sourceType = 'github', aiKind, userKind, tags = [] } = {}) {
  return {
    source: { type: sourceType },
    resource_kind: aiKind === undefined && userKind === undefined
      ? undefined
      : { ai: aiKind ?? 'project', user: userKind ?? null },
    classification: {
      tags: { ai: tags, user: null }
    }
  };
}

test('explicit user resource kind overrides AI value', () => {
  assert.equal(effectiveResourceKind(cardData({ aiKind: 'project', userKind: 'skill' })), 'skill');
});

test('explicit AI resource kind is used when no user override exists', () => {
  assert.equal(effectiveResourceKind(cardData({ aiKind: 'skill' })), 'skill');
});

test('legacy GitHub cards with explicit Agent Skill tags are inferred as skill', () => {
  assert.equal(effectiveResourceKind(cardData({ tags: ['Agent', 'agent-skill'] })), 'skill');
  assert.equal(effectiveResourceKind(cardData({ tags: ['agent-skills'] })), 'skill');
});

test('SKILL.md alone does not make a legacy GitHub card a skill', () => {
  assert.equal(effectiveResourceKind(cardData({ tags: ['SKILL.md'] })), 'project');
});

test('legacy GitHub cards without skill signals default to project', () => {
  assert.equal(effectiveResourceKind(cardData({ tags: ['agent', 'typescript'] })), 'project');
});

test('non-GitHub cards without explicit resource kind remain unclassified', () => {
  assert.equal(effectiveResourceKind(cardData({ sourceType: 'article', tags: ['agent-skill'] })), null);
});

test('adding resource_kind with user null preserves legacy ownership', () => {
  const body = '## 使用者備註\n\n沒有備註。\n\n## 更新紀錄\n';
  const shared = {
    id: 'example',
    created_at: '2026-08-01',
    classification: {
      categories: { ai: ['Agent'], user: null },
      tags: { ai: ['agent-skill'], user: null }
    },
    relevance: { user: {} },
    actions: { user: null },
    status: { user: null }
  };

  const before = { data: { ...shared }, body };
  const after = {
    data: {
      ...shared,
      resource_kind: { ai: 'skill', user: null }
    },
    body
  };

  assert.deepEqual(compareUserOwnedState(before, after), []);
});
