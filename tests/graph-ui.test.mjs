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
  assert.match(text, /focusMode\.value = isMobile\.value/);
  assert.match(text, /ResizeObserver/);
  assert.match(text, /filtersDocked/);
  assert.match(text, /inspectorDocked/);
});

test('Knowledge Graph supports pan, wheel zoom, pinch zoom, and Fit controls', () => {
  const text = source();

  assert.match(text, /@pointerdown="handlePointerDown"/);
  assert.match(text, /@pointermove="handlePointerMove"/);
  assert.match(text, /@wheel\.prevent="handleWheel"/);
  assert.match(text, /pointDistance\(left, right\)/);
  assert.match(text, /aria-label="顯示全部視角"/);
  assert.match(text, /touch-action: none/);
});

test('Knowledge Graph keeps technical layout diagnostics behind an information disclosure', () => {
  const text = source();

  assert.match(text, /<details class="graph-layout-details">/);
  assert.match(text, /Stress：/);
  assert.match(text, /原始餘弦距離/);
  assert.match(text, /graph-neighbor__bar/);
});

test('Knowledge Graph uses an adaptive-height canvas instead of a fixed aspect-ratio canvas', () => {
  const text = source();

  assert.doesNotMatch(text, /min-width:\s*720px/);
  assert.match(text, /height:\s*clamp\(480px/);
  assert.doesNotMatch(text, /aspect-ratio:\s*1000\s*\/\s*720/);
  assert.doesNotMatch(text, /@media \(max-width: 980px\)/);
});


test('Knowledge Graph exposes metadata filters, color modes, and filter result fitting', () => {
  const text = source();

  assert.match(text, /GraphFilterPanel/);
  assert.match(text, /matchingCardIdSet/);
  assert.match(text, /colorBy/);
  assert.match(text, /Fit Results|fitFilterResults/);
  assert.match(text, /displayMode/);
  assert.match(text, /graph-filter-chips/);
});

test('Knowledge Graph supports relation and semantic-distance filtering without recomputing layout', () => {
  const text = source();

  assert.match(text, /filters\.relationTypes/);
  assert.match(text, /semanticMaxDistance/);
  assert.match(text, /semanticTopN/);
  assert.match(text, /graph\.semantic/);
  assert.doesNotMatch(text, /classicalMds\(/);
});

test('Knowledge Graph provides a mobile filter drawer and stable color legend', () => {
  const text = source();

  assert.match(text, /graph-filter-backdrop/);
  assert.match(text, /mobile/);
  assert.match(text, /graphColorLegend/);
  assert.match(text, /graph-relation-legend/);
});


test('Knowledge Graph keeps search, filter count, and result fitting on one result model', () => {
  const text = source();

  assert.match(text, /matchingGraphResults/);
  assert.match(text, /resultFitNodes/);
  assert.match(text, /符合條件/);
  assert.match(text, /沒有符合條件的結果/);
  assert.match(text, /清除搜尋/);
  assert.match(text, /重設篩選/);
});

test('Knowledge Graph compensates label size and hides colliding lower-priority labels', () => {
  const text = source();

  assert.match(text, /labelFontSize/);
  assert.match(text, /labelNodeIds/);
  assert.match(text, /occupied\.some/);
  assert.match(text, /class="graph-node-interactive"/);
});

test('Knowledge Graph page uses the page layout and leaves the filter panel collapsed initially', () => {
  const page = fs.readFileSync(path.join(process.cwd(), 'docs/graph.md'), 'utf8');
  const text = source();

  assert.match(page, /layout:\s*page/);
  assert.match(text, /filterPanelOpen\.value = false/);
  assert.match(text, /graph-inspector--drawer/);
});


test('Knowledge Graph avoids SVG anchors that break VitePress prefetch', () => {
  const text = source();

  assert.match(text, /class="graph-node-interactive"/);
  assert.match(text, /useRouter/);
  assert.match(text, /router\.go\(withBase\(node\.route\)\)/);
  assert.doesNotMatch(text, /:href="withBase\(node\.route\)"/);
});


test('Knowledge Graph preserves node click targets while using pointer capture', () => {
  const text = source();

  assert.match(text, /const nodeTarget = event\.target\?\.closest\?\.\('\.graph-node'\) \?\? null/);
  assert.match(text, /pointers\.size === 1 && !nodeTarget/);
  assert.match(text, /for \(const pointerId of pointers\.keys\(\)\)/);
});
