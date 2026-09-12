<script setup>
import { computed, ref } from 'vue';
import { withBase } from 'vitepress';
import { data as graph } from '../../../graph.data.js';

const query = ref('');
const showCardRelations = ref(false);
const selectedKind = ref('ALL');
const selectedCardId = ref(null);

const width = 1000;
const height = 720;
const centerX = width / 2;
const centerY = height / 2;
const semanticScale = 270;

function fallbackCircularLayout(nodes, radius, offset = 0) {
  const count = Math.max(nodes.length, 1);
  return nodes.map((node, index) => {
    const angle = offset + (Math.PI * 2 * index) / count - Math.PI / 2;
    return {
      ...node,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    };
  });
}

function hasSemanticPosition(node) {
  return Number.isFinite(Number(node.x)) && Number.isFinite(Number(node.y));
}

const layoutAvailable = computed(() => {
  const cards = graph.nodes.filter((node) => node.kind === 'card');
  return cards.length > 0 && cards.every(hasSemanticPosition);
});

const positionedNodes = computed(() => {
  if (layoutAvailable.value) {
    return graph.nodes.map((node) => ({
      ...node,
      semanticX: Number(node.x),
      semanticY: Number(node.y),
      x: centerX + Number(node.x) * semanticScale,
      y: centerY + Number(node.y) * semanticScale
    }));
  }

  const concepts = graph.nodes
    .filter((node) => node.kind === 'concept')
    .sort((a, b) => b.degree - a.degree || a.label.localeCompare(b.label, 'zh-TW'));
  const cards = graph.nodes
    .filter((node) => node.kind === 'card')
    .sort((a, b) => a.label.localeCompare(b.label, 'zh-TW'));

  return [
    ...fallbackCircularLayout(concepts, 215),
    ...fallbackCircularLayout(cards, 325, Math.PI / Math.max(cards.length, 1))
  ];
});

const nodeMap = computed(() => new Map(positionedNodes.value.map((node) => [node.id, node])));
const selectedCardNode = computed(() =>
  positionedNodes.value.find((node) => node.kind === 'card' && node.entityId === selectedCardId.value) ?? null
);
const selectedNeighbors = computed(() =>
  selectedCardId.value ? graph.semantic?.neighborsByCard?.[selectedCardId.value] ?? [] : []
);
const selectedNeighborIds = computed(() => new Set(selectedNeighbors.value.map((item) => item.cardId)));

const needle = computed(() => query.value.trim().toLocaleLowerCase('zh-TW'));
const matchingIds = computed(() => {
  if (!needle.value) return new Set(positionedNodes.value.map((node) => node.id));
  return new Set(positionedNodes.value
    .filter((node) => `${node.label} ${node.description ?? ''} ${node.conceptType ?? ''}`.toLocaleLowerCase('zh-TW').includes(needle.value))
    .map((node) => node.id));
});

const visibleNodes = computed(() => positionedNodes.value.filter((node) => {
  if (selectedKind.value !== 'ALL' && node.kind !== selectedKind.value) return false;
  if (!needle.value) return true;
  if (matchingIds.value.has(node.id)) return true;
  return graph.edges.some((edge) =>
    (edge.source === node.id && matchingIds.value.has(edge.target)) ||
    (edge.target === node.id && matchingIds.value.has(edge.source))
  );
}));

const visibleNodeIds = computed(() => new Set(visibleNodes.value.map((node) => node.id)));
const visibleEdges = computed(() => graph.edges.filter((edge) => {
  if (!visibleNodeIds.value.has(edge.source) || !visibleNodeIds.value.has(edge.target)) return false;
  if (edge.kind !== 'card-card') return true;
  if (showCardRelations.value) return true;
  if (!selectedCardId.value) return false;
  const selectedNodeId = `card:${selectedCardId.value}`;
  return edge.source === selectedNodeId || edge.target === selectedNodeId;
}));

function edgeClass(edge) {
  return `graph-edge graph-edge--${edge.kind}`;
}

function nodeClass(node) {
  const searchDimmed = needle.value && !matchingIds.value.has(node.id);
  const selected = node.kind === 'card' && node.entityId === selectedCardId.value;
  const neighbor = node.kind === 'card' && selectedNeighborIds.value.has(node.entityId);
  const contextDimmed = selectedCardId.value && node.kind === 'card' && !selected && !neighbor;

  return [
    'graph-node',
    `graph-node--${node.kind}`,
    selected ? 'graph-node--selected' : '',
    neighbor ? 'graph-node--neighbor' : '',
    searchDimmed || contextDimmed ? 'graph-node--dimmed' : ''
  ].filter(Boolean).join(' ');
}

function nodeRadius(node) {
  return node.kind === 'concept' ? Math.min(25, 11 + node.degree * 1.6) : 13;
}

function shortLabel(label) {
  return label.length > 24 ? `${label.slice(0, 22)}…` : label;
}

function selectCard(cardId) {
  selectedCardId.value = selectedCardId.value === cardId ? null : cardId;
}

function handleNodeClick(event, node) {
  if (node.kind !== 'card') return;
  event.preventDefault();
  selectCard(node.entityId);
}

function formatMetric(value) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(3) : '—';
}

function relationLabel(relation) {
  if (!relation) return '無明確關聯';
  return relation.type;
}
</script>

<template>
  <section class="knowledge-graph-shell">
    <header class="graph-hero">
      <div>
        <div class="graph-kicker">SEMANTIC KNOWLEDGE MAP</div>
        <h1>Knowledge Graph</h1>
        <p>Knowledge Card 的空間位置由 embedding 語意距離投影；Concept 位於相關 Card 的加權重心。線條另外表示明確知識關係，空間距離與關係判定彼此獨立。</p>
      </div>
      <div class="graph-stats">
        <div><strong>{{ graph.stats.cards }}</strong><span>Cards</span></div>
        <div><strong>{{ graph.stats.concepts }}</strong><span>Concepts</span></div>
        <div><strong>{{ graph.stats.cardConceptEdges }}</strong><span>Mappings</span></div>
        <div><strong>{{ graph.stats.conceptRelations }}</strong><span>Concept Links</span></div>
      </div>
    </header>

    <div class="graph-toolbar">
      <label class="graph-search">
        <span>搜尋</span>
        <input v-model="query" type="search" placeholder="Concept、Card、技術關鍵字" />
      </label>
      <label>
        <span>節點</span>
        <select v-model="selectedKind">
          <option value="ALL">全部</option>
          <option value="concept">Concept</option>
          <option value="card">Knowledge Card</option>
        </select>
      </label>
      <label class="graph-toggle">
        <input v-model="showCardRelations" type="checkbox" />
        <span>顯示全部 Card↔Card 關聯</span>
      </label>
      <div :class="['graph-layout-status', layoutAvailable ? '' : 'graph-layout-status--fallback']">
        <strong>{{ layoutAvailable ? '語意佈局' : '備援佈局' }}</strong>
        <span v-if="layoutAvailable">
          {{ graph.layout?.method ?? 'MDS' }}
          <template v-if="graph.layout?.stress !== null && graph.layout?.stress !== undefined">
            · stress {{ formatMetric(graph.layout.stress) }}
          </template>
        </span>
        <span v-else>graph-layout 尚未產生</span>
      </div>
    </div>

    <div :class="['graph-workspace', selectedCardNode ? 'graph-workspace--inspecting' : '']">
      <div class="graph-canvas-wrap">
        <svg class="knowledge-graph" :viewBox="`0 0 ${width} ${height}`" role="img" aria-label="Knowledge semantic graph">
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
            :transform="`translate(${node.x} ${node.y})`"
          >
            <a :href="withBase(node.route)" @click="handleNodeClick($event, node)">
              <circle :r="nodeRadius(node)" />
              <text :y="node.kind === 'concept' ? nodeRadius(node) + 18 : 30" text-anchor="middle">{{ shortLabel(node.label) }}</text>
              <title>{{ node.label }} — {{ node.description }}</title>
            </a>
          </g>
        </svg>
      </div>

      <aside v-if="selectedCardNode" class="graph-inspector">
        <div class="graph-inspector__header">
          <div>
            <div class="graph-inspector__eyebrow">已選取 Knowledge Card</div>
            <h2>{{ selectedCardNode.label }}</h2>
          </div>
          <button type="button" class="graph-inspector__close" aria-label="關閉語意鄰居面板" @click="selectedCardId = null">×</button>
        </div>

        <p class="graph-inspector__description">{{ selectedCardNode.description }}</p>
        <a class="graph-inspector__open" :href="withBase(selectedCardNode.route)">開啟知識卡 →</a>

        <div class="graph-inspector__meta">
          <span>距離：原始 embedding cosine distance</span>
          <span v-if="graph.semantic?.embeddingModel">模型：{{ graph.semantic.embeddingModel }}</span>
          <span v-if="layoutAvailable">位置：2D MDS 近似</span>
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
          畫面上的 2D 距離是高維語意空間的近似；上方數值才是由原始 embedding 直接計算的相似度與距離。
        </p>
      </aside>
    </div>

    <div class="graph-legend">
      <span><i class="legend-dot legend-dot--concept"></i>Concept</span>
      <span><i class="legend-dot legend-dot--card"></i>Knowledge Card</span>
      <span><i class="legend-dot legend-dot--neighbor"></i>最近語意鄰居</span>
      <span><i class="legend-line legend-line--mapping"></i>Card↔Concept</span>
      <span><i class="legend-line legend-line--concept"></i>Concept↔Concept</span>
      <span v-if="showCardRelations || selectedCardNode"><i class="legend-line legend-line--card"></i>Card↔Card</span>
    </div>
  </section>
</template>

<style scoped>
.knowledge-graph-shell { max-width: 1280px; margin: 0 auto; padding: 36px 24px 80px; }
.graph-hero { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(280px, .8fr); gap: 32px; align-items: end; margin-bottom: 28px; }
.graph-kicker { font-size: 12px; font-weight: 800; letter-spacing: .14em; opacity: .6; }
.graph-hero h1 { margin: 8px 0 10px; font-size: clamp(34px, 6vw, 64px); line-height: .98; letter-spacing: -.035em; }
.graph-hero p { margin: 0; max-width: 780px; line-height: 1.8; opacity: .76; }
.graph-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.graph-stats div { border: 1px solid var(--vp-c-divider); border-radius: 14px; padding: 14px 16px; background: var(--vp-c-bg-soft); }
.graph-stats strong { display: block; font-size: 24px; line-height: 1.1; }
.graph-stats span { display: block; margin-top: 4px; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; opacity: .58; }
.graph-toolbar { display: flex; flex-wrap: wrap; gap: 12px; align-items: end; margin-bottom: 14px; }
.graph-toolbar label { display: grid; gap: 5px; font-size: 12px; font-weight: 700; }
.graph-toolbar input[type='search'], .graph-toolbar select { min-height: 40px; border: 1px solid var(--vp-c-divider); border-radius: 10px; padding: 0 12px; background: var(--vp-c-bg); color: var(--vp-c-text-1); }
.graph-search { flex: 1 1 280px; }
.graph-toggle { display: flex !important; grid-auto-flow: column; align-items: center; min-height: 40px; border: 1px solid var(--vp-c-divider); border-radius: 10px; padding: 0 12px; background: var(--vp-c-bg-soft); }
.graph-layout-status { min-height: 40px; display: grid; align-content: center; gap: 1px; border: 1px solid var(--vp-c-brand-1); border-radius: 10px; padding: 5px 12px; background: var(--vp-c-brand-soft); font-size: 11px; }
.graph-layout-status strong { font-size: 12px; }
.graph-layout-status span { opacity: .7; }
.graph-layout-status--fallback { border-color: var(--vp-c-warning-1); background: var(--vp-c-warning-soft); }
.graph-workspace { display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px; align-items: start; }
.graph-workspace--inspecting { grid-template-columns: minmax(0, 1fr) 330px; }
.graph-canvas-wrap { overflow: hidden; border: 1px solid var(--vp-c-divider); border-radius: 20px; background: color-mix(in srgb, var(--vp-c-bg-soft) 86%, transparent); }
.knowledge-graph { display: block; width: 100%; min-width: 720px; min-height: 560px; }
.graph-edge { stroke-width: 1.3; vector-effect: non-scaling-stroke; }
.graph-edge--card-concept { stroke: var(--vp-c-brand-2); opacity: .32; }
.graph-edge--concept-concept { stroke: var(--vp-c-text-2); opacity: .24; stroke-dasharray: 5 6; }
.graph-edge--card-card { stroke: var(--vp-c-warning-1); opacity: .52; stroke-dasharray: 2 5; }
.graph-node { transition: opacity .18s ease; }
.graph-node circle { vector-effect: non-scaling-stroke; stroke-width: 2; transition: transform .18s ease, opacity .18s ease, stroke-width .18s ease; }
.graph-node text { font-size: 12px; font-weight: 700; fill: var(--vp-c-text-1); pointer-events: none; }
.graph-node a:hover circle { transform: scale(1.16); transform-origin: center; }
.graph-node--concept circle { fill: var(--vp-c-brand-soft); stroke: var(--vp-c-brand-1); }
.graph-node--card circle { fill: var(--vp-c-bg); stroke: var(--vp-c-text-2); }
.graph-node--neighbor circle { stroke: var(--vp-c-brand-1); stroke-width: 3; }
.graph-node--selected { opacity: 1 !important; }
.graph-node--selected circle { fill: var(--vp-c-brand-soft); stroke: var(--vp-c-brand-1); stroke-width: 5; }
.graph-node--dimmed { opacity: .18; }
.graph-inspector { border: 1px solid var(--vp-c-divider); border-radius: 20px; padding: 18px; background: var(--vp-c-bg-soft); position: sticky; top: 82px; }
.graph-inspector__header { display: flex; gap: 12px; align-items: start; justify-content: space-between; }
.graph-inspector__eyebrow { font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; opacity: .55; }
.graph-inspector h2 { margin: 4px 0 0; font-size: 20px; line-height: 1.3; }
.graph-inspector__close { border: 0; background: transparent; color: var(--vp-c-text-2); font-size: 24px; line-height: 1; cursor: pointer; }
.graph-inspector__description { margin: 12px 0 8px; font-size: 13px; line-height: 1.65; opacity: .75; }
.graph-inspector__open { display: inline-block; margin-bottom: 14px; font-size: 12px; font-weight: 800; }
.graph-inspector__meta { display: grid; gap: 4px; border-block: 1px solid var(--vp-c-divider); padding: 11px 0; font-size: 10px; line-height: 1.5; opacity: .68; }
.graph-neighbors__title { display: flex; justify-content: space-between; align-items: baseline; margin: 15px 0 8px; font-size: 12px; }
.graph-neighbors__title span { opacity: .55; }
.graph-neighbors { display: grid; gap: 8px; list-style: none; padding: 0; margin: 0; }
.graph-neighbors li { border: 1px solid var(--vp-c-divider); border-radius: 12px; padding: 10px; background: var(--vp-c-bg); }
.graph-neighbor__heading { display: flex; gap: 8px; justify-content: space-between; align-items: start; }
.graph-neighbor__heading button { border: 0; padding: 0; background: transparent; color: var(--vp-c-text-1); font: inherit; font-size: 12px; font-weight: 800; text-align: left; cursor: pointer; }
.graph-neighbor__heading a { flex: 0 0 auto; font-size: 10px; }
.graph-neighbor__metrics { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 7px; font-size: 10px; opacity: .72; }
.graph-neighbor__metrics b { font-weight: 800; }
.graph-relation-chip { display: inline-flex; margin-top: 7px; border-radius: 999px; padding: 3px 7px; background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); font-size: 9px; font-weight: 800; }
.graph-relation-chip--muted { background: var(--vp-c-bg-soft); color: var(--vp-c-text-3); }
.graph-inspector__note { margin: 14px 0 0; font-size: 10px; line-height: 1.6; opacity: .58; }
.graph-legend { display: flex; flex-wrap: wrap; gap: 14px 22px; margin-top: 14px; font-size: 12px; opacity: .72; }
.graph-legend span { display: inline-flex; align-items: center; gap: 7px; }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.legend-dot--concept { background: var(--vp-c-brand-1); }
.legend-dot--card { border: 2px solid var(--vp-c-text-2); background: var(--vp-c-bg); }
.legend-dot--neighbor { border: 3px solid var(--vp-c-brand-1); background: var(--vp-c-bg); }
.legend-line { width: 22px; height: 0; border-top: 2px solid; display: inline-block; }
.legend-line--mapping { border-color: var(--vp-c-brand-2); }
.legend-line--concept { border-color: var(--vp-c-text-2); border-top-style: dashed; }
.legend-line--card { border-color: var(--vp-c-warning-1); border-top-style: dotted; }
@media (max-width: 980px) {
  .graph-workspace--inspecting { grid-template-columns: 1fr; }
  .graph-inspector { position: static; }
}
@media (max-width: 760px) {
  .graph-hero { grid-template-columns: 1fr; }
  .graph-canvas-wrap { overflow-x: auto; }
  .knowledge-graph-shell { padding-inline: 16px; }
}
</style>
