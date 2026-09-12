import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cardColor,
  cardColorKey,
  categoricalColor,
  colorLegend,
  relevanceColor
} from '../docs/.vitepress/theme/lib/graph-color.mjs';

const cards = [
  {
    kind: 'card',
    categories: ['Agent'],
    actions: ['TRY'],
    relevance: { overall: 5 }
  },
  {
    kind: 'card',
    categories: ['RAG / Memory / Knowledge'],
    actions: ['WATCH'],
    relevance: { overall: 4 }
  }
];

test('categorical graph colors are deterministic across calls', () => {
  assert.equal(categoricalColor('Agent'), categoricalColor('Agent'));
  assert.equal(cardColor(cards[0], 'category'), categoricalColor('Agent'));
  assert.equal(cardColorKey(cards[0], 'action'), 'TRY');
});

test('relevance colors are fixed to the 1-5 scale', () => {
  assert.equal(cardColor(cards[0], 'relevance'), relevanceColor(5));
  assert.equal(relevanceColor(0), relevanceColor(1));
  assert.equal(relevanceColor(9), relevanceColor(5));
});

test('color legend derives stable labels from visible graph metadata', () => {
  const legend = colorLegend(cards, 'category');
  assert.deepEqual(
    legend.map((item) => item.label),
    ['Agent', 'RAG / Memory / Knowledge']
  );
  assert.equal(colorLegend(cards, 'relevance').length, 5);
  assert.deepEqual(colorLegend(cards, 'none'), []);
});
