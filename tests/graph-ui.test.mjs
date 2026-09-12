import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const componentPath = path.join(
  process.cwd(),
  'docs/.vitepress/theme/components/KnowledgeGraph.vue'
);

function source() {
  return fs.readFileSync(componentPath, 'utf8');
}

test('Knowledge Graph uses labels on demand instead of rendering every node label', () => {
  const text = source();

  assert.match(text, /function shouldShowLabel\(node\)/);
  assert.match(text, /v-if="shouldShowLabel\(node\)"/);
  assert.match(text, /importantConceptIds/);
  assert.match(text, /hoveredNodeId/);
});

test('Knowledge Graph exposes global and focus exploration modes', () => {
  const text = source();

  assert.match(text, /全域地圖/);
  assert.match(text, /聚焦模式/);
  assert.match(text, /focusNodeIds/);
  assert.match(text, /if \(isMobile\.value\) focusMode\.value = true/);
});

test('Knowledge Graph supports pan, wheel zoom, pinch zoom, and Fit controls', () => {
  const text = source();

  assert.match(text, /@pointerdown="handlePointerDown"/);
  assert.match(text, /@pointermove="handlePointerMove"/);
  assert.match(text, /@wheel\.prevent="handleWheel"/);
  assert.match(text, /pointDistance\(left, right\)/);
  assert.match(text, /aria-label="顯示全部節點"/);
  assert.match(text, /touch-action: none/);
});

test('Knowledge Graph keeps technical layout diagnostics behind an information disclosure', () => {
  const text = source();

  assert.match(text, /<details class="graph-layout-details">/);
  assert.match(text, /Stress：/);
  assert.match(text, /原始 cosine 距離/);
  assert.match(text, /graph-neighbor__bar/);
});

test('Knowledge Graph mobile layout no longer forces the old 720px-wide horizontal canvas', () => {
  const text = source();

  assert.doesNotMatch(text, /min-width:\s*720px/);
  assert.match(text, /\.knowledge-graph \{ aspect-ratio: 1 \/ 1; \}/);
});
