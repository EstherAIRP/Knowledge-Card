<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { withBase } from 'vitepress';
import { data as graph } from '../../../graph.data.js';
import GraphFilterPanel from './GraphFilterPanel.vue';
import {
  activeFilterCount as countActiveFilters,
  collectGraphFacets,
  matchingCardIds as computeMatchingCardIds
} from '../lib/graph-filter.mjs';
import {
  cardColor,
  colorLegend
} from '../lib/graph-color.mjs';
import {
  fitNodesToViewport,
  fitViewportToNodes,
  midpoint,
  pointDistance,
  zoomAroundPoint
} from '../lib/graph-viewport.mjs';

const query = ref('');
const showCardRelations = ref(false);
const selectedKind = ref('ALL');
const selectedCardId = ref(null);
const hoveredNodeId = ref(null);
const focusMode = ref(false);
const isMobile = ref(false);
const filterPanelOpen = ref(false);
const tagSearch = ref('');
const colorBy = ref('category');
const graphSvg = ref(null);
const viewport = ref({ x: 0, y: 0, scale: 1 });

const filters = reactive({
  categories: [],
  actions: [],
  tags: [],
  sourceTypes: [],
  resourceKinds: [],
  relationTypes: [],
  minimumRelevance: 1,
  semanticEnabled: false,
  semanticMode: 'top',
  semanticTopN: 6,
  semanticMaxDistance: 0.3,
  displayMode: 'dim'
});

const width = 1000;
const desktopHeight = 720;
const mobileHeight = 1000;
const inspectorNeighborLimit = 6;
const pointers = new Map();
let dragState = null;
let pinchState = null;
let resizeMedia = null;

const canvasHeight = computed(() => isMobile.value ? mobileHeight : desktopHeight);

const positionedNodes = computed(() => fitNodesToViewport(graph.nodes, {
  width,
  height: canvasHeight.value,
  padding: isMobile.value ? 96 : 78
}).nodes);

const nodeMap = computed(() => new Map(positionedNodes.value.map((node) => [node.id, node])));
const selectedCardNode = computed(() =>
  positionedNodes.value.find((node) => node.kind === 'card' && node.entityId === selectedCardId.value) ?? null
);
const selectedNeighbors = computed(() =>
  selectedCardId.value
    ? (graph.semantic?.neighborsByCard?.[selectedCardId.value] ?? []).slice(0, inspectorNeighborLimit)
    : []
);
const selectedNeighborIds = computed(() => new Set(selectedNeighbors.value.map((item) => item.cardId)));

const allFacets = computed(() => collectGraphFacets(graph.nodes));
const filterFacets = computed(() => {
  const search = tagSearch.value.trim().toLocaleLowerCase('zh-TW');
  const selectedTags = new Set(filters.tags);
  const tags = allFacets.value.tags
    .filter((item) =>
      selectedTags.has(item.value) ||
      !search ||
      item.value.toLocaleLowerCase('zh-TW').includes(search)
    )
    .slice(0, 50);

  return {
    ...allFacets.value,
    tags
  };
});

const relationTypes = computed(() => [...new Set(
  graph.edges
    .filter((edge) => edge.kind === 'card-card')
    .map((edge) => edge.type)
    .filter(Boolean)
)].sort((a, b) => a.localeCompare(b)));

const activeFilters = computed(() => countActiveFilters(filters));
const filterActive = computed(() => activeFilters.value > 0);

const matchingCardIdSet = computed(() => computeMatchingCardIds({
  nodes: positionedNodes.value,
  edges: graph.edges,
  semantic: graph.semantic,
  selectedCardId: selectedCardId.value,
  filters
}));

const matchingConceptNodeIds = computed(() => {
  if (!filterActive.value) {
    return new Set(positionedNodes.value.filter((node) => node.kind === 'concept').map((node) => node.id));
  }

  const ids = new Set();
  for (const edge of graph.edges) {
    if (edge.kind !== 'card-concept') continue;
    const cardId = edge.source?.startsWith('card:')
      ? edge.source.slice(5)
      : edge.target?.startsWith('card:')
        ? edge.target.slice(5)
        : null;
    const conceptId = edge.source?.startsWith('concept:')
      ? edge.source
      : edge.target?.startsWith('concept:')
        ? edge.target
        : null;

    if (cardId && conceptId && matchingCardIdSet.value.has(cardId)) ids.add(conceptId);
  }
  return ids;
});

const selectedRelatedConceptIds = computed(() => {
  if (!selectedCardId.value) return new Set();
  const selectedNodeId = `card:${selectedCardId.value}`;
  const ids = new Set();
  for (const edge of graph.edges) {
    if (edge.kind !== 'card-concept') continue;
    if (edge.source === selectedNodeId && edge.target.startsWith('concept:')) ids.add(edge.target);
    if (edge.target === selectedNodeId && edge.source.startsWith('concept:')) ids.add(edge.source);
  }
  return ids;
});

const focusNeighborIds = computed(() => {
  if (!selectedCardId.value) return new Set();

  if (filters.semanticEnabled) {
    return new Set([...matchingCardIdSet.value].filter((cardId) => cardId !== selectedCardId.value));
  }

  return selectedNeighborIds.value;
});

const focusNodeIds = computed(() => {
  const ids = new Set();
  if (!selectedCardId.value) return ids;
  ids.add(`card:${selectedCardId.value}`);
  for (const cardId of focusNeighborIds.value) ids.add(`card:${cardId}`);
  for (const conceptId of selectedRelatedConceptIds.value) ids.add(conceptId);
  return ids;
});

const importantConceptIds = computed(() => new Set(
  positionedNodes.value
    .filter((node) => node.kind === 'concept')
    .sort((left, right) => right.degree - left.degree || left.label.localeCompare(right.label, 'zh-TW'))
    .slice(0, isMobile.value ? 4 : 7)
    .map((node) => node.id)
));

const needle = computed(() => query.value.trim().toLocaleLowerCase('zh-TW'));
const matchingSearchIds = computed(() => {
  if (!needle.value) return new Set();
  return new Set(positionedNodes.value
    .filter((node) =>
      `${node.label} ${node.description ?? ''} ${node.conceptType ?? ''} ${(node.tags ?? []).join(' ')}`
        .toLocaleLowerCase('zh-TW')
        .includes(needle.value)
    )
    .map((node) => node.id));
});

function nodeMatchesFilter(node) {
  if (!filterActive.value) return true;
  if (node.kind === 'card') return matchingCardIdSet.value.has(node.entityId);
  if (node.kind === 'concept') return matchingConceptNodeIds.value.has(node.id);
  return true;
}

const visibleNodes = computed(() => positionedNodes.value.filter((node) => {
  const selectedNodeId = selectedCardId.value ? `card:${selectedCardId.value}` : null;
  const selected = node.id === selectedNodeId;

  if (focusMode.value && selectedCardId.value && !focusNodeIds.value.has(node.id)) return false;

  if (
    selectedKind.value !== 'ALL' &&
    node.kind !== selectedKind.value &&
    !selected
  ) {
    return false;
  }

  if (needle.value && !matchingSearchIds.value.has(node.id) && !selected) return false;

  if (
    filterActive.value &&
    filters.displayMode === 'hide' &&
    !nodeMatchesFilter(node) &&
    !selected
  ) {
    return false;
  }

  return true;
}));

const visibleNodeIds = computed(() => new Set(visibleNodes.value.map((node) => node.id)));

const visibleEdges = computed(() => {
  const selectedNodeId = selectedCardId.value ? `card:${selectedCardId.value}` : null;
  const relationFilterActive = filters.relationTypes.length > 0;

  return graph.edges.filter((edge) => {
    if (!visibleNodeIds.value.has(edge.source) || !visibleNodeIds.value.has(edge.target)) return false;

    if (
      edge.kind === 'card-card' &&
      relationFilterActive &&
      !filters.relationTypes.includes(edge.type)
    ) {
      return false;
    }

    if (focusMode.value && selectedNodeId) {
      if (edge.kind === 'concept-concept') return false;
      return edge.source === selectedNodeId || edge.target === selectedNodeId;
    }

    if (selectedNodeId) {
      if (edge.kind === 'card-concept') {
        return edge.source === selectedNodeId || edge.target === selectedNodeId;
      }
      if (edge.kind === 'card-card') {
        return showCardRelations.value ||
          relationFilterActive ||
          edge.source === selectedNodeId ||
          edge.target === selectedNodeId;
      }
      return false;
    }

    if (edge.kind === 'concept-concept') return true;
    if (edge.kind === 'card-card') return showCardRelations.value || relationFilterActive;
    return false;
  });
});

const filteredFitNodes = computed(() => positionedNodes.value.filter((node) => {
  if (!filterActive.value) return true;
  return nodeMatchesFilter(node);
}));

const viewportTransform = computed(() =>
  `translate(${viewport.value.x} ${viewport.value.y}) scale(${viewport.value.scale})`
);

const graphColorLegend = computed(() => colorLegend(graph.nodes, colorBy.value));

const filterChips = computed(() => {
  const chips = [];
  const groups = [
    ['categories', 'Category'],
    ['actions', 'Action'],
    ['tags', 'Tag'],
    ['sourceTypes', 'Source'],
    ['resourceKinds', 'Resource'],
    ['relationTypes', 'Relation']
  ];

  for (const [key, label] of groups) {
    for (const value of filters[key]) {
      chips.push({ key: `${key}:${value}`, field: key, value, label: `${label}: ${value}` });
    }
  }

  if (filters.minimumRelevance > 1) {
    chips.push({
      key: 'minimumRelevance',
      field: 'minimumRelevance',
      value: 1,
      label: `Relevance ≥ ${filters.minimumRelevance}`
    });
  }

  if (filters.semanticEnabled && selectedCardId.value) {
    chips.push({
      key: 'semantic',
      field: 'semanticEnabled',
      value: false,
      label: filters.semanticMode === 'top'
        ? `語意 Top ${filters.semanticTopN}`
        : `語意距離 ≤ ${Number(filters.semanticMaxDistance).toFixed(2)}`
    });
  }

  return chips;
});

function isSelectedNode(node) {
  return node.kind === 'card' && node.entityId === selectedCardId.value;
}

function isNeighborNode(node) {
  return node.kind === 'card' && focusNeighborIds.value.has(node.entityId);
}

function isRelatedConcept(node) {
  return node.kind === 'concept' && selectedRelatedConceptIds.value.has(node.id);
}

function shouldShowLabel(node) {
  if (isSelectedNode(node)) return true;
  if (node.id === hoveredNodeId.value) return true;
  if (needle.value && matchingSearchIds.value.has(node.id)) return true;
  if (selectedCardId.value && (isNeighborNode(node) || isRelatedConcept(node))) return true;
  return !selectedCardId.value && node.kind === 'concept' && importantConceptIds.value.has(node.id);
}

function relationClass(type) {
  return String(type ?? 'unknown').replaceAll('_', '-');
}

function edgeClass(edge) {
  return [
    'graph-edge',
    `graph-edge--${edge.kind}`,
    edge.kind === 'card-card' ? `graph-edge--relation-${relationClass(edge.type)}` : ''
  ].filter(Boolean).join(' ');
}

function nodeClass(node) {
  const selected = isSelectedNode(node);
  const neighbor = isNeighborNode(node);
  const relatedConcept = isRelatedConcept(node);
  const filterDimmed =
    filterActive.value &&
    filters.displayMode === 'dim' &&
    !nodeMatchesFilter(node) &&
    !selected;
  const contextDimmed =
    Boolean(selectedCardId.value) &&
    !selected &&
    !neighbor &&
    !relatedConcept;

  return [
    'graph-node',
    `graph-node--${node.kind}`,
    selected ? 'graph-node--selected' : '',
    neighbor ? 'graph-node--neighbor' : '',
    relatedConcept ? 'graph-node--related-concept' : '',
    filterDimmed ? 'graph-node--filter-dimmed' : '',
    contextDimmed ? 'graph-node--dimmed' : ''
  ].filter(Boolean).join(' ');
}

function nodeStyle(node) {
  if (node.kind !== 'card' || colorBy.value === 'none') return {};
  return { '--node-accent': cardColor(node, colorBy.value) };
}

function nodeRadius(node) {
  if (node.kind === 'concept') return Math.min(17, 8 + node.degree * 0.65);
  return 10;
}

function shortLabel(label) {
  const limit = isMobile.value ? 15 : 20;
  return label.length > limit ? `${label.slice(0, limit - 1)}…` : label;
}

function resetView() {
  viewport.value = { x: 0, y: 0, scale: 1 };
}

function fitNodes(nodes, { maximumScale } = {}) {
  if (!nodes?.length) return;
  viewport.value = fitViewportToNodes(nodes, {
    width,
    height: canvasHeight.value,
    padding: isMobile.value ? 165 : 140,
    minimumScale: 1,
    maximumScale: maximumScale ?? (isMobile.value ? 2.35 : 2.8)
  });
}

function fitFocusedView() {
  if (!selectedCardId.value || !visibleNodes.value.length) {
    resetView();
    return;
  }
  fitNodes(visibleNodes.value);
}

function fitFilterResults() {
  if (!filteredFitNodes.value.length) return;
  fitNodes(filteredFitNodes.value, { maximumScale: isMobile.value ? 2.7 : 3.2 });
  if (isMobile.value) filterPanelOpen.value = false;
}

async function selectCard(cardId) {
  selectedCardId.value = selectedCardId.value === cardId ? null : cardId;

  if (!selectedCardId.value) {
    filters.semanticEnabled = false;
  }

  await nextTick();

  if (focusMode.value && selectedCardId.value) {
    fitFocusedView();
  } else if (!selectedCardId.value) {
    resetView();
  }
}

async function setFocusMode(value) {
  focusMode.value = value;
  selectedKind.value = 'ALL';
  await nextTick();

  if (value && selectedCardId.value) fitFocusedView();
  else resetView();
}

function handleNodeClick(event, node) {
  if (node.kind !== 'card') return;
  event.preventDefault();
  selectCard(node.entityId);
}

function toggleFilter(key, value) {
  const list = filters[key];
  if (!Array.isArray(list)) return;
  const index = list.indexOf(value);
  if (index >= 0) list.splice(index, 1);
  else list.push(value);
}

function updateFilter(key, value) {
  filters[key] = value;
}

function resetFilters() {
  for (const key of ['categories', 'actions', 'tags', 'sourceTypes', 'resourceKinds', 'relationTypes']) {
    filters[key].splice(0);
  }
  filters.minimumRelevance = 1;
  filters.semanticEnabled = false;
  filters.semanticMode = 'top';
  filters.semanticTopN = 6;
  filters.semanticMaxDistance = 0.3;
  filters.displayMode = 'dim';
  tagSearch.value = '';
  resetView();
}

function removeFilterChip(chip) {
  if (Array.isArray(filters[chip.field])) {
    toggleFilter(chip.field, chip.value);
    return;
  }
  filters[chip.field] = chip.value;
}

function formatMetric(value) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(3) : '—';
}

function similarityPercent(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '0%';
  return `${Math.max(0, Math.min(1, numeric)) * 100}%`;
}

function relationLabel(relation) {
  if (!relation) return '無明確關聯';
  return relation.type;
}

function clientToViewBox(clientX, clientY) {
  const svg = graphSvg.value;
  if (!svg) return { x: 0, y: 0 };
  const rect = svg.getBoundingClientRect();
  const viewHeight = canvasHeight.value;
  const scale = Math.min(rect.width / width, rect.height / viewHeight);
  const renderedWidth = width * scale;
  const renderedHeight = viewHeight * scale;
  const offsetX = (rect.width - renderedWidth) / 2;
  const offsetY = (rect.height - renderedHeight) / 2;

  return {
    x: (clientX - rect.left - offsetX) / scale,
    y: (clientY - rect.top - offsetY) / scale
  };
}

function pointerPair() {
  return [...pointers.values()].slice(0, 2);
}

function handlePointerDown(event) {
  const svg = graphSvg.value;
  if (!svg) return;

  const point = clientToViewBox(event.clientX, event.clientY);
  pointers.set(event.pointerId, point);
  try {
    svg.setPointerCapture(event.pointerId);
  } catch {
    // Some browsers do not expose pointer capture for every input source.
  }

  if (pointers.size === 1 && !event.target?.closest?.('.graph-node')) {
    dragState = {
      pointerId: event.pointerId,
      lastPoint: point
    };
  }

  if (pointers.size >= 2) {
    const [left, right] = pointerPair();
    pinchState = {
      distance: Math.max(pointDistance(left, right), 1),
      midpoint: midpoint(left, right),
      viewport: { ...viewport.value }
    };
    dragState = null;
  }
}

function handlePointerMove(event) {
  if (!pointers.has(event.pointerId)) return;
  const point = clientToViewBox(event.clientX, event.clientY);
  pointers.set(event.pointerId, point);

  if (pointers.size >= 2 && pinchState) {
    const [left, right] = pointerPair();
    const currentDistance = Math.max(pointDistance(left, right), 1);
    const currentMidpoint = midpoint(left, right);
    const requestedScale = pinchState.viewport.scale * (currentDistance / pinchState.distance);
    const worldX = (pinchState.midpoint.x - pinchState.viewport.x) / pinchState.viewport.scale;
    const worldY = (pinchState.midpoint.y - pinchState.viewport.y) / pinchState.viewport.scale;
    const zoomed = zoomAroundPoint(
      pinchState.viewport,
      pinchState.midpoint,
      requestedScale
    );

    viewport.value = {
      scale: zoomed.scale,
      x: currentMidpoint.x - worldX * zoomed.scale,
      y: currentMidpoint.y - worldY * zoomed.scale
    };
    return;
  }

  if (dragState?.pointerId === event.pointerId) {
    const dx = point.x - dragState.lastPoint.x;
    const dy = point.y - dragState.lastPoint.y;
    viewport.value = {
      ...viewport.value,
      x: viewport.value.x + dx,
      y: viewport.value.y + dy
    };
    dragState.lastPoint = point;
  }
}

function handlePointerEnd(event) {
  pointers.delete(event.pointerId);
  try {
    graphSvg.value?.releasePointerCapture(event.pointerId);
  } catch {
    // Ignore browsers that already released capture.
  }

  if (pointers.size < 2) pinchState = null;
  if (dragState?.pointerId === event.pointerId) dragState = null;
}

function handleWheel(event) {
  const point = clientToViewBox(event.clientX, event.clientY);
  const factor = event.deltaY < 0 ? 1.12 : 0.89;
  viewport.value = zoomAroundPoint(
    viewport.value,
    point,
    viewport.value.scale * factor
  );
}

function zoomBy(factor) {
  viewport.value = zoomAroundPoint(
    viewport.value,
    { x: width / 2, y: canvasHeight.value / 2 },
    viewport.value.scale * factor
  );
}

function handleDoubleClick(event) {
  if (event.target?.closest?.('.graph-node')) return;
  resetView();
}

function syncResponsiveMode() {
  const nextMobile = window.matchMedia('(max-width: 760px)').matches;
  const changed = nextMobile !== isMobile.value;
  isMobile.value = nextMobile;

  if (changed) {
    if (nextMobile) {
      focusMode.value = true;
      filterPanelOpen.value = false;
    } else {
      filterPanelOpen.value = true;
    }

    nextTick(() => {
      if (focusMode.value && selectedCardId.value) fitFocusedView();
      else resetView();
    });
  }
}

onMounted(() => {
  resizeMedia = window.matchMedia('(max-width: 760px)');
  isMobile.value = resizeMedia.matches;
  focusMode.value = isMobile.value;
  filterPanelOpen.value = !isMobile.value;
  resizeMedia.addEventListener?.('change', syncResponsiveMode);
});

onBeforeUnmount(() => {
  resizeMedia?.removeEventListener?.('change', syncResponsiveMode);
});
</script>

<template>
  <section class="knowledge-graph-shell">
    <header class="graph-hero">
      <div>
        <div class="graph-kicker">SEMANTIC KNOWLEDGE MAP</div>
        <h1>Knowledge Graph</h1>
        <p>距離越近，主題通常越相似。用篩選縮小觀察範圍、用顏色切換閱讀維度；篩選不會重新計算 MDS，因此節點的語意位置保持穩定。</p>
      </div>
      <div class="graph-stats">
        <div><strong>{{ graph.stats.cards }}</strong><span>Cards</span></div>
        <div><strong>{{ graph.stats.concepts }}</strong><span>Concepts</span></div>
        <div><strong>{{ graph.stats.cardConceptEdges }}</strong><span>Mappings</span></div>
        <div><strong>{{ graph.stats.cardRelations }}</strong><span>Card Links</span></div>
      </div>
    </header>

    <div class="graph-toolbar">
      <label class="graph-search">
        <span>搜尋</span>
        <input v-model="query" type="search" placeholder="Concept、Card、Tag、技術關鍵字" />
      </label>

      <button
        type="button"
        :class="['graph-filter-trigger', activeFilters ? 'active' : '']"
        @click="filterPanelOpen = !filterPanelOpen"
      >
        篩選
        <strong v-if="activeFilters">{{ activeFilters }}</strong>
      </button>

      <label class="graph-color-select">
        <span>顏色</span>
        <select v-model="colorBy">
          <option value="none">無</option>
          <option value="category">Category</option>
          <option value="action">Action</option>
          <option value="relevance">Relevance</option>
        </select>
      </label>

      <div class="graph-view-mode" aria-label="圖譜模式">
        <button
          type="button"
          :class="{ active: !focusMode }"
          :aria-pressed="!focusMode"
          @click="setFocusMode(false)"
        >
          全域地圖
        </button>
        <button
          type="button"
          :class="{ active: focusMode }"
          :aria-pressed="focusMode"
          @click="setFocusMode(true)"
        >
          聚焦模式
        </button>
      </div>

      <label class="graph-toggle">
        <input v-model="showCardRelations" type="checkbox" />
        <span>全部 Card↔Card</span>
      </label>

      <details class="graph-layout-details">
        <summary>語意地圖 <span aria-hidden="true">ⓘ</span></summary>
        <div>
          <span>投影：{{ graph.layout?.method ?? 'classical-mds' }}</span>
          <span>距離：{{ graph.layout?.metric ?? 'cosine-distance' }}</span>
          <span v-if="graph.layout?.stress !== null && graph.layout?.stress !== undefined">
            Stress：{{ formatMetric(graph.layout.stress) }}
          </span>
          <span v-if="graph.semantic?.embeddingModel">模型：{{ graph.semantic.embeddingModel }}</span>
        </div>
      </details>
    </div>

    <div v-if="filterChips.length" class="graph-filter-chips">
      <button
        v-for="chip in filterChips"
        :key="chip.key"
        type="button"
        :title="'移除 ' + chip.label"
        @click="removeFilterChip(chip)"
      >
        {{ chip.label }} <span>×</span>
      </button>
      <span class="graph-filter-result-count">{{ matchingCardIdSet.size }} / {{ graph.stats.cards }} Cards</span>
    </div>

    <div
      :class="[
        'graph-explorer',
        filterPanelOpen && !isMobile ? 'graph-explorer--filters' : '',
        selectedCardNode ? 'graph-explorer--inspecting' : ''
      ]"
    >
      <GraphFilterPanel
        v-if="filterPanelOpen && !isMobile"
        :facets="filterFacets"
        :relation-types="relationTypes"
        :filters="filters"
        :active-count="activeFilters"
        :result-count="matchingCardIdSet.size"
        :total-count="graph.stats.cards"
        :tag-search="tagSearch"
        :color-by="colorBy"
        :selected-card="Boolean(selectedCardNode)"
        @toggle-filter="toggleFilter"
        @update-filter="updateFilter"
        @update:tag-search="tagSearch = $event"
        @update:color-by="colorBy = $event"
        @reset="resetFilters"
        @fit-results="fitFilterResults"
      />

      <div class="graph-canvas-wrap">
        <div v-if="focusMode && !selectedCardNode" class="graph-focus-hint">
          點選一張 Knowledge Card，查看它的語意鄰域
        </div>

        <div class="graph-zoom-controls" aria-label="圖譜縮放">
          <button type="button" aria-label="放大圖譜" @click="zoomBy(1.22)">＋</button>
          <button type="button" aria-label="縮小圖譜" @click="zoomBy(0.82)">－</button>
          <button type="button" aria-label="顯示全部節點" @click="resetView">Fit</button>
          <button
            v-if="filterActive"
            type="button"
            class="graph-zoom-controls__result"
            aria-label="顯示篩選結果"
            @click="fitFilterResults"
          >
            Result
          </button>
        </div>

        <svg
          ref="graphSvg"
          class="knowledge-graph"
          :viewBox="`0 0 ${width} ${canvasHeight}`"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Knowledge semantic graph"
          @pointerdown="handlePointerDown"
          @pointermove="handlePointerMove"
          @pointerup="handlePointerEnd"
          @pointercancel="handlePointerEnd"
          @wheel.prevent="handleWheel"
          @dblclick="handleDoubleClick"
        >
          <rect class="graph-hit-area" x="0" y="0" :width="width" :height="canvasHeight" />

          <g class="graph-viewport" :transform="viewportTransform">
            <g class="graph-edges">
              <line
                v-for="(edge, index) in visibleEdges"
                :key="`${edge.source}-${edge.target}-${index}`"
                :class="edgeClass(edge)"
                :x1="nodeMap.get(edge.source)?.x"
                :y1="nodeMap.get(edge.source)?.y"
                :x2="nodeMap.get(edge.target)?.x"
                :y2="nodeMap.get(edge.target)?.y"
              />
            </g>

            <g
              v-for="node in visibleNodes"
              :key="node.id"
              :class="nodeClass(node)"
              :style="nodeStyle(node)"
              :transform="`translate(${node.x} ${node.y})`"
              @mouseenter="hoveredNodeId = node.id"
              @mouseleave="hoveredNodeId = null"
            >
              <a :href="withBase(node.route)" @click.stop="handleNodeClick($event, node)">
                <circle
                  v-if="isSelectedNode(node)"
                  class="graph-node-halo graph-node-halo--selected"
                  :r="nodeRadius(node) + 9"
                />
                <circle
                  v-else-if="isNeighborNode(node)"
                  class="graph-node-halo graph-node-halo--neighbor"
                  :r="nodeRadius(node) + 6"
                />
                <circle class="graph-node-core" :r="nodeRadius(node)" />
                <text
                  v-if="shouldShowLabel(node)"
                  class="graph-node-label"
                  :y="node.kind === 'concept' ? nodeRadius(node) + 17 : 25"
                  text-anchor="middle"
                >
                  {{ shortLabel(node.label) }}
                </text>
                <title>{{ node.label }} — {{ node.description }}</title>
              </a>
            </g>
          </g>
        </svg>
      </div>

      <aside v-if="selectedCardNode" class="graph-inspector">
        <div class="graph-inspector__header">
          <div>
            <div class="graph-inspector__eyebrow">已選取 Knowledge Card</div>
            <h2>{{ selectedCardNode.label }}</h2>
          </div>
          <button
            type="button"
            class="graph-inspector__close"
            aria-label="關閉語意鄰居面板"
            @click="selectCard(selectedCardNode.entityId)"
          >
            ×
          </button>
        </div>

        <p class="graph-inspector__description">{{ selectedCardNode.description }}</p>
        <a class="graph-inspector__open" :href="withBase(selectedCardNode.route)">開啟知識卡 →</a>

        <div class="graph-inspector__taxonomy">
          <span v-for="item in selectedCardNode.categories ?? []" :key="'category-' + item">{{ item }}</span>
          <span v-for="item in selectedCardNode.actions ?? []" :key="'action-' + item">{{ item }}</span>
          <span v-if="selectedCardNode.relevance?.overall">Relevance {{ selectedCardNode.relevance.overall }}</span>
        </div>

        <div class="graph-distance-guide">
          <div>
            <strong>地圖位置</strong>
            <span>2D MDS 近似</span>
          </div>
          <div>
            <strong>下方數值</strong>
            <span>原始 cosine 距離</span>
          </div>
        </div>

        <div class="graph-neighbors__title">
          <strong>最近語意鄰居</strong>
          <span>Top {{ selectedNeighbors.length }}</span>
        </div>

        <ol class="graph-neighbors">
          <li v-for="neighbor in selectedNeighbors" :key="neighbor.cardId">
            <div class="graph-neighbor__heading">
              <button type="button" @click="selectCard(neighbor.cardId)">{{ neighbor.label }}</button>
              <a :href="withBase(neighbor.route)" @click.stop>開啟</a>
            </div>

            <div class="graph-neighbor__bar" aria-hidden="true">
              <span :style="{ width: similarityPercent(neighbor.similarity) }"></span>
            </div>

            <div class="graph-neighbor__metrics">
              <span><b>相似度</b> {{ formatMetric(neighbor.similarity) }}</span>
              <span><b>距離</b> {{ formatMetric(neighbor.distance) }}</span>
            </div>

            <div :class="['graph-relation-chip', neighbor.relation ? '' : 'graph-relation-chip--muted']">
              {{ relationLabel(neighbor.relation) }}
            </div>
          </li>
        </ol>

        <p class="graph-inspector__note">
          2D 圖上的距離用來建立空間直覺；需要精確比較時，以這裡的原始 embedding 數值為準。
        </p>
      </aside>
    </div>

    <div v-if="graphColorLegend.length" class="graph-color-legend">
      <strong>顏色：{{ colorBy === 'category' ? 'Category' : colorBy === 'action' ? 'Action' : 'Relevance' }}</strong>
      <div>
        <span v-for="item in graphColorLegend" :key="item.key">
          <i :style="{ background: item.color }"></i>{{ item.label }}
        </span>
      </div>
      <small v-if="colorBy === 'category' || colorBy === 'action'">多值 Card 以第一個有效值作為主色；篩選仍匹配全部值。</small>
    </div>

    <div class="graph-legend">
      <span><i class="legend-dot legend-dot--concept"></i>Concept</span>
      <span><i class="legend-dot legend-dot--card"></i>Knowledge Card</span>
      <span><i class="legend-dot legend-dot--neighbor"></i>最近語意鄰居</span>
      <span v-if="selectedCardNode"><i class="legend-line legend-line--mapping"></i>選取 Card↔Concept</span>
      <span v-if="!selectedCardNode"><i class="legend-line legend-line--concept"></i>Concept↔Concept</span>
    </div>

    <div
      v-if="(showCardRelations || filters.relationTypes.length || selectedCardNode) && relationTypes.length"
      class="graph-relation-legend"
    >
      <strong>Relation</strong>
      <span
        v-for="item in relationTypes"
        :key="item"
        :class="['relation-legend-item', `relation-legend-item--${relationClass(item)}`]"
      >
        <i></i>{{ item }}
      </span>
    </div>

    <div
      v-if="filterPanelOpen && isMobile"
      class="graph-filter-backdrop"
      @click.self="filterPanelOpen = false"
    >
      <GraphFilterPanel
        :facets="filterFacets"
        :relation-types="relationTypes"
        :filters="filters"
        :active-count="activeFilters"
        :result-count="matchingCardIdSet.size"
        :total-count="graph.stats.cards"
        :tag-search="tagSearch"
        :color-by="colorBy"
        :selected-card="Boolean(selectedCardNode)"
        mobile
        @toggle-filter="toggleFilter"
        @update-filter="updateFilter"
        @update:tag-search="tagSearch = $event"
        @update:color-by="colorBy = $event"
        @reset="resetFilters"
        @fit-results="fitFilterResults"
        @close="filterPanelOpen = false"
      />
    </div>
  </section>
</template>

<style scoped>
.knowledge-graph-shell { max-width: 1440px; margin: 0 auto; padding: 36px 24px 80px; }
.graph-hero { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(280px, .8fr); gap: 32px; align-items: end; margin-bottom: 28px; }
.graph-kicker { font-size: 12px; font-weight: 800; letter-spacing: .14em; opacity: .6; }
.graph-hero h1 { margin: 8px 0 10px; font-size: clamp(34px, 6vw, 64px); line-height: .98; letter-spacing: -.035em; }
.graph-hero p { margin: 0; max-width: 800px; line-height: 1.8; opacity: .76; }
.graph-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.graph-stats div { border: 1px solid var(--vp-c-divider); border-radius: 14px; padding: 14px 16px; background: var(--vp-c-bg-soft); }
.graph-stats strong { display: block; font-size: 24px; line-height: 1.1; }
.graph-stats span { display: block; margin-top: 4px; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; opacity: .58; }

.graph-toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: end; margin-bottom: 10px; }
.graph-toolbar label { display: grid; gap: 5px; font-size: 12px; font-weight: 700; }
.graph-toolbar input[type='search'], .graph-toolbar select {
  min-height: 40px; border: 1px solid var(--vp-c-divider); border-radius: 10px; padding: 0 12px;
  background: var(--vp-c-bg); color: var(--vp-c-text-1);
}
.graph-search { flex: 1 1 260px; }
.graph-color-select { flex: 0 0 145px; }
.graph-filter-trigger {
  min-height: 40px; align-self: end; display: inline-flex; align-items: center; gap: 7px;
  border: 1px solid var(--vp-c-divider); border-radius: 10px; padding: 0 12px;
  background: var(--vp-c-bg-soft); color: var(--vp-c-text-1); font: inherit; font-size: 12px; font-weight: 800; cursor: pointer;
}
.graph-filter-trigger.active { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }
.graph-filter-trigger strong {
  min-width: 18px; height: 18px; display: grid; place-items: center; border-radius: 999px;
  background: var(--vp-c-brand-1); color: white; font-size: 9px;
}
.graph-toggle {
  display: flex !important; grid-auto-flow: column; align-items: center; min-height: 40px;
  border: 1px solid var(--vp-c-divider); border-radius: 10px; padding: 0 12px; background: var(--vp-c-bg-soft);
}
.graph-view-mode {
  display: inline-flex; min-height: 40px; padding: 3px; border: 1px solid var(--vp-c-divider);
  border-radius: 11px; background: var(--vp-c-bg-soft);
}
.graph-view-mode button {
  border: 0; border-radius: 8px; padding: 0 12px; background: transparent; color: var(--vp-c-text-2);
  font: inherit; font-size: 12px; font-weight: 800; cursor: pointer;
}
.graph-view-mode button.active { background: var(--vp-c-bg); color: var(--vp-c-brand-1); box-shadow: 0 1px 3px rgba(0, 0, 0, .08); }
.graph-layout-details { position: relative; align-self: end; }
.graph-layout-details summary {
  min-height: 40px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
  border: 1px solid var(--vp-c-divider); border-radius: 10px; padding: 0 12px;
  background: var(--vp-c-bg-soft); font-size: 12px; font-weight: 800; list-style: none;
}
.graph-layout-details summary::-webkit-details-marker { display: none; }
.graph-layout-details > div {
  position: absolute; z-index: 20; right: 0; top: calc(100% + 6px); min-width: 260px;
  display: grid; gap: 6px; border: 1px solid var(--vp-c-divider); border-radius: 12px; padding: 12px;
  background: var(--vp-c-bg); box-shadow: var(--vp-shadow-3); font-size: 11px; line-height: 1.5;
}

.graph-filter-chips { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 12px; }
.graph-filter-chips button {
  border: 1px solid var(--vp-c-brand-1); border-radius: 999px; padding: 5px 8px;
  background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); font: inherit; font-size: 9px; font-weight: 800; cursor: pointer;
}
.graph-filter-chips button span { margin-left: 3px; }
.graph-filter-result-count { margin-left: auto; font-size: 10px; font-weight: 800; opacity: .58; }

.graph-explorer { display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px; align-items: start; }
.graph-explorer--filters { grid-template-columns: 250px minmax(0, 1fr); }
.graph-explorer--inspecting { grid-template-columns: minmax(0, 1fr) 320px; }
.graph-explorer--filters.graph-explorer--inspecting { grid-template-columns: 250px minmax(0, 1fr) 310px; }

.graph-canvas-wrap {
  position: relative; overflow: hidden; border: 1px solid var(--vp-c-divider); border-radius: 20px;
  background: color-mix(in srgb, var(--vp-c-bg-soft) 86%, transparent);
}
.knowledge-graph {
  display: block; width: 100%; height: auto; aspect-ratio: 1000 / 720; user-select: none;
  touch-action: none; cursor: grab;
}
.knowledge-graph:active { cursor: grabbing; }
.graph-hit-area { fill: transparent; }
.graph-focus-hint {
  position: absolute; z-index: 4; top: 12px; left: 50%; transform: translateX(-50%);
  max-width: calc(100% - 170px); border: 1px solid var(--vp-c-divider); border-radius: 999px;
  padding: 7px 12px; background: color-mix(in srgb, var(--vp-c-bg) 92%, transparent);
  font-size: 11px; font-weight: 700; text-align: center; pointer-events: none;
}
.graph-zoom-controls {
  position: absolute; z-index: 5; right: 12px; top: 12px; display: grid; overflow: hidden;
  border: 1px solid var(--vp-c-divider); border-radius: 10px; background: var(--vp-c-bg);
  box-shadow: 0 4px 14px rgba(0, 0, 0, .08);
}
.graph-zoom-controls button {
  min-width: 42px; min-height: 34px; border: 0; border-bottom: 1px solid var(--vp-c-divider);
  background: transparent; color: var(--vp-c-text-1); font: inherit; font-size: 15px; font-weight: 800; cursor: pointer;
}
.graph-zoom-controls button:last-child { border-bottom: 0; }
.graph-zoom-controls button:nth-child(n+3) { font-size: 9px; }
.graph-zoom-controls__result { color: var(--vp-c-brand-1) !important; }

.graph-edge { stroke-width: 1.2; vector-effect: non-scaling-stroke; }
.graph-edge--card-concept { stroke: var(--vp-c-brand-2); opacity: .34; }
.graph-edge--concept-concept { stroke: var(--vp-c-text-2); opacity: .13; stroke-dasharray: 5 7; }
.graph-edge--card-card { opacity: .62; }
.graph-edge--relation-similar-to { stroke: #2563eb; }
.graph-edge--relation-alternative-to { stroke: #d97706; stroke-dasharray: 10 4; }
.graph-edge--relation-complements { stroke: #059669; stroke-dasharray: 6 3; }
.graph-edge--relation-integrates-with { stroke: #7c3aed; }
.graph-edge--relation-depends-on { stroke: #dc2626; stroke-dasharray: 8 4 2 4; }
.graph-edge--relation-extends { stroke: #0891b2; stroke-dasharray: 3 3; }
.graph-edge--relation-contrasts-with { stroke: #be123c; stroke-dasharray: 1 5; stroke-linecap: round; }

.graph-node { transition: opacity .18s ease; }
.graph-node circle { vector-effect: non-scaling-stroke; transition: opacity .18s ease, stroke-width .18s ease; }
.graph-node-core { stroke-width: 2; }
.graph-node a:hover .graph-node-core { stroke-width: 3.5; }
.graph-node-label {
  font-size: 10.5px; font-weight: 800; fill: var(--vp-c-text-1); pointer-events: none;
  paint-order: stroke; stroke: var(--vp-c-bg); stroke-width: 4px; stroke-linejoin: round;
}
.graph-node--concept .graph-node-core { fill: var(--vp-c-brand-1); stroke: var(--vp-c-brand-1); }
.graph-node--card .graph-node-core { fill: var(--vp-c-bg); stroke: var(--node-accent, var(--vp-c-text-2)); }
.graph-node--related-concept .graph-node-core { stroke-width: 3; }
.graph-node-halo { fill: none; vector-effect: non-scaling-stroke; }
.graph-node-halo--selected { stroke: var(--node-accent, var(--vp-c-brand-1)); stroke-width: 4; opacity: .35; }
.graph-node-halo--neighbor { stroke: var(--node-accent, var(--vp-c-brand-1)); stroke-width: 3; opacity: .25; }
.graph-node--neighbor .graph-node-core { stroke: var(--node-accent, var(--vp-c-brand-1)); stroke-width: 3; }
.graph-node--selected { opacity: 1 !important; }
.graph-node--selected .graph-node-core { stroke: var(--node-accent, var(--vp-c-brand-1)); stroke-width: 4; }
.graph-node--filter-dimmed { opacity: .055; }
.graph-node--dimmed { opacity: .1; }
.graph-node--filter-dimmed.graph-node--dimmed { opacity: .035; }

.graph-inspector {
  border: 1px solid var(--vp-c-divider); border-radius: 20px; padding: 18px;
  background: var(--vp-c-bg-soft); position: sticky; top: 82px;
}
.graph-inspector__header { display: flex; gap: 12px; align-items: start; justify-content: space-between; }
.graph-inspector__eyebrow { font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; opacity: .55; }
.graph-inspector h2 { margin: 4px 0 0; font-size: 20px; line-height: 1.3; }
.graph-inspector__close { border: 0; background: transparent; color: var(--vp-c-text-2); font-size: 24px; line-height: 1; cursor: pointer; }
.graph-inspector__description { margin: 12px 0 8px; font-size: 13px; line-height: 1.65; opacity: .75; }
.graph-inspector__open { display: inline-block; margin-bottom: 12px; font-size: 12px; font-weight: 800; }
.graph-inspector__taxonomy { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 14px; }
.graph-inspector__taxonomy span {
  border: 1px solid var(--vp-c-divider); border-radius: 999px; padding: 3px 6px;
  background: var(--vp-c-bg); font-size: 8px; font-weight: 800;
}
.graph-distance-guide { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 15px; }
.graph-distance-guide div {
  border: 1px solid var(--vp-c-divider); border-radius: 10px; padding: 9px; background: var(--vp-c-bg);
}
.graph-distance-guide strong, .graph-distance-guide span { display: block; }
.graph-distance-guide strong { font-size: 10px; }
.graph-distance-guide span { margin-top: 3px; font-size: 9px; opacity: .62; }
.graph-neighbors__title { display: flex; justify-content: space-between; align-items: baseline; margin: 15px 0 8px; font-size: 12px; }
.graph-neighbors__title span { opacity: .55; }
.graph-neighbors { display: grid; gap: 8px; list-style: none; padding: 0; margin: 0; }
.graph-neighbors li { border: 1px solid var(--vp-c-divider); border-radius: 12px; padding: 10px; background: var(--vp-c-bg); }
.graph-neighbor__heading { display: flex; gap: 8px; justify-content: space-between; align-items: start; }
.graph-neighbor__heading button {
  border: 0; padding: 0; background: transparent; color: var(--vp-c-text-1);
  font: inherit; font-size: 12px; font-weight: 800; text-align: left; cursor: pointer;
}
.graph-neighbor__heading a { flex: 0 0 auto; font-size: 10px; }
.graph-neighbor__bar { height: 4px; overflow: hidden; margin-top: 8px; border-radius: 999px; background: var(--vp-c-divider); }
.graph-neighbor__bar span { display: block; height: 100%; border-radius: inherit; background: var(--vp-c-brand-1); }
.graph-neighbor__metrics { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 7px; font-size: 10px; opacity: .72; }
.graph-neighbor__metrics b { font-weight: 800; }
.graph-relation-chip {
  display: inline-flex; margin-top: 7px; border-radius: 999px; padding: 3px 7px;
  background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); font-size: 9px; font-weight: 800;
}
.graph-relation-chip--muted { background: var(--vp-c-bg-soft); color: var(--vp-c-text-3); }
.graph-inspector__note { margin: 14px 0 0; font-size: 10px; line-height: 1.6; opacity: .58; }

.graph-color-legend {
  margin-top: 14px; border: 1px solid var(--vp-c-divider); border-radius: 14px; padding: 11px 13px;
  background: var(--vp-c-bg-soft);
}
.graph-color-legend > strong { display: block; margin-bottom: 7px; font-size: 10px; }
.graph-color-legend > div { display: flex; flex-wrap: wrap; gap: 7px 13px; }
.graph-color-legend span { display: inline-flex; align-items: center; gap: 5px; font-size: 9px; }
.graph-color-legend i { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
.graph-color-legend small { display: block; margin-top: 7px; font-size: 8px; opacity: .52; }

.graph-legend, .graph-relation-legend {
  display: flex; flex-wrap: wrap; gap: 10px 18px; margin-top: 12px; font-size: 11px; opacity: .72;
}
.graph-legend span, .graph-relation-legend span { display: inline-flex; align-items: center; gap: 7px; }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.legend-dot--concept { background: var(--vp-c-brand-1); }
.legend-dot--card { border: 2px solid var(--vp-c-text-2); background: var(--vp-c-bg); }
.legend-dot--neighbor { border: 3px solid var(--vp-c-brand-1); background: var(--vp-c-bg); }
.legend-line { width: 22px; height: 0; border-top: 2px solid; display: inline-block; }
.legend-line--mapping { border-color: var(--vp-c-brand-2); }
.legend-line--concept { border-color: var(--vp-c-text-2); border-top-style: dashed; }
.graph-relation-legend strong { font-size: 10px; }
.relation-legend-item i { width: 22px; height: 0; border-top: 2px solid; }
.relation-legend-item--similar-to i { border-color: #2563eb; }
.relation-legend-item--alternative-to i { border-color: #d97706; border-top-style: dashed; }
.relation-legend-item--complements i { border-color: #059669; border-top-style: dashed; }
.relation-legend-item--integrates-with i { border-color: #7c3aed; }
.relation-legend-item--depends-on i { border-color: #dc2626; border-top-style: dashed; }
.relation-legend-item--extends i { border-color: #0891b2; border-top-style: dotted; }
.relation-legend-item--contrasts-with i { border-color: #be123c; border-top-style: dotted; }

.graph-filter-backdrop {
  position: fixed; z-index: 100; inset: 0; background: rgba(0, 0, 0, .32);
}

@media (max-width: 1180px) {
  .graph-explorer--filters.graph-explorer--inspecting { grid-template-columns: 230px minmax(0, 1fr); }
  .graph-explorer--filters.graph-explorer--inspecting .graph-inspector { grid-column: 2; position: static; }
}

@media (max-width: 980px) {
  .graph-explorer--filters,
  .graph-explorer--inspecting,
  .graph-explorer--filters.graph-explorer--inspecting { grid-template-columns: 1fr; }
  .graph-explorer > .graph-filter-panel { position: static; max-height: none; }
  .graph-inspector { position: static; }
}

@media (max-width: 760px) {
  .knowledge-graph-shell { padding: 24px 14px 64px; }
  .graph-hero { grid-template-columns: 1fr; gap: 18px; margin-bottom: 20px; }
  .graph-hero p { font-size: 13px; line-height: 1.65; }
  .graph-stats strong { font-size: 20px; }
  .graph-toolbar { align-items: stretch; }
  .graph-search { flex-basis: 100%; }
  .graph-filter-trigger { flex: 1 1 105px; justify-content: center; }
  .graph-color-select { flex: 1 1 130px; }
  .graph-view-mode { flex: 1 1 210px; }
  .graph-view-mode button { flex: 1; padding-inline: 8px; }
  .graph-toggle { flex: 1 1 150px; }
  .graph-layout-details { flex: 0 0 auto; }
  .graph-layout-details > div { position: fixed; left: 16px; right: 16px; top: auto; min-width: 0; }
  .graph-filter-result-count { width: 100%; margin-left: 0; }
  .knowledge-graph { aspect-ratio: 1 / 1; }
  .graph-focus-hint { top: 10px; max-width: calc(100% - 145px); font-size: 10px; }
  .graph-zoom-controls { right: 10px; top: 10px; }
  .graph-zoom-controls button { min-width: 38px; min-height: 32px; }
  .graph-node-label { font-size: 9.5px; stroke-width: 5px; }
  .graph-inspector { border-radius: 16px; }
  .graph-color-legend > div { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 3px; }
}
</style>
