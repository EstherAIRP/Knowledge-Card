<script setup>
import { computed, ref } from 'vue';
import { withBase } from 'vitepress';
import { data as graph } from '../../../graph.data.js';

const query = ref('');
const showCardRelations = ref(false);
const selectedKind = ref('ALL');

const width = 1000;
const height = 720;
const centerX = width / 2;
const centerY = height / 2;

function circularLayout(nodes, radius, offset = 0) {
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

const positionedNodes = computed(() => {
  const concepts = graph.nodes
    .filter((node) => node.kind === 'concept')
    .sort((a, b) => b.degree - a.degree || a.label.localeCompare(b.label, 'zh-TW'));
  const cards = graph.nodes
    .filter((node) => node.kind === 'card')
    .sort((a, b) => a.label.localeCompare(b.label, 'zh-TW'));
  return [
    ...circularLayout(concepts, 215),
    ...circularLayout(cards, 325, Math.PI / Math.max(cards.length, 1))
  ];
});

const nodeMap = computed(() => new Map(positionedNodes.value.map((node) => [node.id, node])));

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
  if (edge.kind === 'card-card' && !showCardRelations.value) return false;
  return visibleNodeIds.value.has(edge.source) && visibleNodeIds.value.has(edge.target);
}));

function edgeClass(edge) {
  return `graph-edge graph-edge--${edge.kind}`;
}

function nodeClass(node) {
  const dimmed = needle.value && !matchingIds.value.has(node.id);
  return [
    'graph-node',
    `graph-node--${node.kind}`,
    dimmed ? 'graph-node--dimmed' : ''
  ].filter(Boolean).join(' ');
}

function nodeRadius(node) {
  return node.kind === 'concept' ? Math.min(25, 11 + node.degree * 1.6) : 13;
}

function shortLabel(label) {
  return label.length > 24 ? `${label.slice(0, 22)}…` : label;
}
</script>

<template>
  <section class="knowledge-graph-shell">
    <header class="graph-hero">
      <div>
        <div class="graph-kicker">PHASE 3 · CONCEPT-CENTRIC GRAPH</div>
        <h1>Knowledge Graph</h1>
        <p>Concept 是內圈語意節點，Knowledge Card 是外圈證據節點。線條同時呈現 Card↔Concept membership 與 Concept↔Concept 共現；Card↔Card semantic relations 可選擇顯示。</p>
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
        <span>顯示 Card↔Card semantic edges</span>
      </label>
    </div>

    <div class="graph-canvas-wrap">
      <svg class="knowledge-graph" :viewBox="`0 0 ${width} ${height}`" role="img" aria-label="Knowledge concept graph">
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

        <g v-for="node in visibleNodes" :key="node.id" :class="nodeClass(node)" :transform="`translate(${node.x} ${node.y})`">
          <a :href="withBase(node.route)">
            <circle :r="nodeRadius(node)" />
            <text :y="node.kind === 'concept' ? nodeRadius(node) + 18 : 30" text-anchor="middle">{{ shortLabel(node.label) }}</text>
            <title>{{ node.label }} — {{ node.description }}</title>
          </a>
        </g>

        <g class="graph-center-label" transform="translate(500 360)">
          <circle r="70" />
          <text text-anchor="middle" y="-6">Knowledge</text>
          <text text-anchor="middle" y="18">Radar</text>
        </g>
      </svg>
    </div>

    <div class="graph-legend">
      <span><i class="legend-dot legend-dot--concept"></i>Concept</span>
      <span><i class="legend-dot legend-dot--card"></i>Knowledge Card</span>
      <span><i class="legend-line legend-line--mapping"></i>Card↔Concept</span>
      <span><i class="legend-line legend-line--concept"></i>Concept↔Concept</span>
      <span v-if="showCardRelations"><i class="legend-line legend-line--card"></i>Card↔Card</span>
    </div>
  </section>
</template>

<style scoped>
.knowledge-graph-shell { max-width: 1180px; margin: 0 auto; padding: 36px 24px 80px; }
.graph-hero { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(280px, .8fr); gap: 32px; align-items: end; margin-bottom: 28px; }
.graph-kicker { font-size: 12px; font-weight: 800; letter-spacing: .14em; opacity: .6; }
.graph-hero h1 { margin: 8px 0 10px; font-size: clamp(34px, 6vw, 64px); line-height: .98; letter-spacing: -.035em; }
.graph-hero p { margin: 0; max-width: 760px; line-height: 1.8; opacity: .76; }
.graph-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.graph-stats div { border: 1px solid var(--vp-c-divider); border-radius: 14px; padding: 14px 16px; background: var(--vp-c-bg-soft); }
.graph-stats strong { display: block; font-size: 24px; line-height: 1.1; }
.graph-stats span { display: block; margin-top: 4px; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; opacity: .58; }
.graph-toolbar { display: flex; flex-wrap: wrap; gap: 12px; align-items: end; margin-bottom: 14px; }
.graph-toolbar label { display: grid; gap: 5px; font-size: 12px; font-weight: 700; }
.graph-toolbar input[type='search'], .graph-toolbar select { min-height: 40px; border: 1px solid var(--vp-c-divider); border-radius: 10px; padding: 0 12px; background: var(--vp-c-bg); color: var(--vp-c-text-1); }
.graph-search { flex: 1 1 320px; }
.graph-toggle { display: flex !important; grid-auto-flow: column; align-items: center; min-height: 40px; border: 1px solid var(--vp-c-divider); border-radius: 10px; padding: 0 12px; background: var(--vp-c-bg-soft); }
.graph-canvas-wrap { overflow: hidden; border: 1px solid var(--vp-c-divider); border-radius: 20px; background: color-mix(in srgb, var(--vp-c-bg-soft) 86%, transparent); }
.knowledge-graph { display: block; width: 100%; min-width: 720px; min-height: 560px; }
.graph-edge { stroke-width: 1.3; vector-effect: non-scaling-stroke; }
.graph-edge--card-concept { stroke: var(--vp-c-brand-2); opacity: .38; }
.graph-edge--concept-concept { stroke: var(--vp-c-text-2); opacity: .28; stroke-dasharray: 5 6; }
.graph-edge--card-card { stroke: var(--vp-c-warning-1); opacity: .38; stroke-dasharray: 2 5; }
.graph-node circle { vector-effect: non-scaling-stroke; stroke-width: 2; transition: transform .18s ease, opacity .18s ease; }
.graph-node text { font-size: 12px; font-weight: 700; fill: var(--vp-c-text-1); pointer-events: none; }
.graph-node a:hover circle { transform: scale(1.16); transform-origin: center; }
.graph-node--concept circle { fill: var(--vp-c-brand-soft); stroke: var(--vp-c-brand-1); }
.graph-node--card circle { fill: var(--vp-c-bg); stroke: var(--vp-c-text-2); }
.graph-node--dimmed { opacity: .25; }
.graph-center-label circle { fill: var(--vp-c-bg); stroke: var(--vp-c-divider); stroke-width: 1.5; }
.graph-center-label text { fill: var(--vp-c-text-1); font-size: 19px; font-weight: 800; letter-spacing: -.02em; }
.graph-legend { display: flex; flex-wrap: wrap; gap: 14px 22px; margin-top: 14px; font-size: 12px; opacity: .72; }
.graph-legend span { display: inline-flex; align-items: center; gap: 7px; }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.legend-dot--concept { background: var(--vp-c-brand-1); }
.legend-dot--card { border: 2px solid var(--vp-c-text-2); background: var(--vp-c-bg); }
.legend-line { width: 22px; height: 0; border-top: 2px solid; display: inline-block; }
.legend-line--mapping { border-color: var(--vp-c-brand-2); }
.legend-line--concept { border-color: var(--vp-c-text-2); border-top-style: dashed; }
.legend-line--card { border-color: var(--vp-c-warning-1); border-top-style: dotted; }
@media (max-width: 760px) {
  .graph-hero { grid-template-columns: 1fr; }
  .graph-canvas-wrap { overflow-x: auto; }
  .knowledge-graph-shell { padding-inline: 16px; }
}
</style>
