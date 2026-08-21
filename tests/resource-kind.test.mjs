import test from 'node:test';
import assert from 'node:assert/strict';
import { effectiveResourceKind } from '../scripts/lib/knowledge.mjs';

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

test('legacy GitHub cards with Agent Skill tags are inferred as skill', () => {
  assert.equal(effectiveResourceKind(cardData({ tags: ['Agent', 'agent-skill'] })), 'skill');
  assert.equal(effectiveResourceKind(cardData({ tags: ['SKILL.md'] })), 'skill');
});

test('legacy GitHub cards without skill signals default to project', () => {
  assert.equal(effectiveResourceKind(cardData({ tags: ['agent', 'typescript'] })), 'project');
});

test('non-GitHub cards without explicit resource kind remain unclassified', () => {
  assert.equal(effectiveResourceKind(cardData({ sourceType: 'article', tags: ['agent-skill'] })), null);
});
