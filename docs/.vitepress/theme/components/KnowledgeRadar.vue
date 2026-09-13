<script setup>
import { computed, ref } from 'vue';
import { withBase } from 'vitepress';
import { data as cards } from '../../../knowledge.data.js';

const query = ref('');
const category = ref('ALL');
const tag = ref('ALL');
const action = ref('ALL');
const resourceKind = ref('ALL');
const dimension = ref('overall');
const minScore = ref(1);
const sortBy = ref('newest');

const dimensions = [
  ['overall', 'Overall'],
  ['ai_rd', 'AI RD'],
  ['aoi_ai', 'AOI × AI'],
  ['llm_agent', 'LLM / Agent'],
  ['sillytavern_ai_rpg', 'SillyTavern / AI RPG'],
  ['image_gen', 'Image Gen']
];

const categories = computed(() => {
  const count = new Map();
  for (const card of cards) {
    for (const item of card.categories) count.set(item, (count.get(item) ?? 0) + 1);
  }
  return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-TW'));
});

const tags = computed(() => {
  const count = new Map();
  for (const card of cards) {
    for (const item of card.tags) count.set(item, (count.get(item) ?? 0) + 1);
  }
  return [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-TW'));
});

const actions = computed(() => {
  const values = new Set(cards.flatMap((card) => card.actions));
  return [...values].sort();
});

const resourceKinds = computed(() => {
  const count = new Map();
  for (const card of cards) {
    if (!card.resourceKind) continue;
    count.set(card.resourceKind, (count.get(card.resourceKind) ?? 0) + 1);
  }
  return [...count.entries()].sort((a, b) => a[0].localeCompare(b[0]));
});

const stats = computed(() => ({
  total: cards.length,
  high: cards.filter((card) => card.relevance.overall >= 4).length,
  tryCount: cards.filter((card) => card.actions.includes('TRY')).length,
  categoryCount: categories.value.length
}));

const filteredCards = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase('zh-TW');
  const selectedDimension = dimension.value;
  const result = cards.filter((card) => {
    if (category.value !== 'ALL' && !card.categories.includes(category.value)) return false;
    if (tag.value !== 'ALL' && !card.tags.includes(tag.value)) return false;
    if (action.value !== 'ALL' && !card.actions.includes(action.value)) return false;
    if (resourceKind.value !== 'ALL' && card.resourceKind !== resourceKind.value) return false;
    if ((card.relevance[selectedDimension] ?? 0) < minScore.value) return false;

    if (needle) {
      const haystack = [
        card.title,
        card.summary,
        card.sourceType,
        card.resourceKind,
        ...card.categories,
        ...(card.semanticCategories ?? []),
        ...card.tags,
        ...card.actions
      ].join(' ').toLocaleLowerCase('zh-TW');
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });

  return [...result].sort((a, b) => {
    if (sortBy.value === 'newest') {
      const byCreated = String(b.createdAt).localeCompare(String(a.createdAt));
      return byCreated || String(b.updatedAt).localeCompare(String(a.updatedAt)) || a.title.localeCompare(b.title, 'zh-TW');
    }
    if (sortBy.value === 'updated') return String(b.updatedAt).localeCompare(String(a.updatedAt));
    if (sortBy.value === 'title') return a.title.localeCompare(b.title, 'zh-TW');
    const score = (b.relevance[selectedDimension] ?? 0) - (a.relevance[selectedDimension] ?? 0);
    return score || String(b.updatedAt).localeCompare(String(a.updatedAt));
  });
});

function scoreLabel(score) {
  return '★'.repeat(score) + '☆'.repeat(5 - score);
}

function resourceKindLabel(kind) {
  const labels = {
    project: '專案',
    skill: 'Skill',
    tutorial: '教學',
    guide: '指南',
    article: '文章',
    reference: '參考資料',
    paper: '論文',
    tool: '工具'
  };
  return labels[kind] ?? kind;
}

function sourceLabel(card) {
  const source = card.sourceType === 'github' ? 'GitHub' : card.sourceType;
  return card.resourceKind ? `${source} · ${resourceKindLabel(card.resourceKind)}` : source;
}

function selectTag(value) {
  tag.value = value;
}

function resetFilters() {
  query.value = '';
  category.value = 'ALL';
  tag.value = 'ALL';
  action.value = 'ALL';
  resourceKind.value = 'ALL';
  dimension.value = 'overall';
  minScore.value = 1;
  sortBy.value = 'newest';
}
</script>

<template>
  <main class="radar-shell kc-shell">
    <section class="radar-hero">
      <div class="radar-kicker">PERSONAL TECHNOLOGY RADAR</div>
      <h1>Knowledge Radar</h1>
      <p>把值得保留的 AI、Agent、AOI 與創作技術，整理成可搜尋、可比較、可持續更新的 Knowledge Cards。</p>
      <div class="radar-stats">
        <div class="radar-stat"><strong>{{ stats.total }}</strong><span>Knowledge Cards</span></div>
        <div class="radar-stat"><strong>{{ stats.high }}</strong><span>高度相關</span></div>
        <div class="radar-stat"><strong>{{ stats.tryCount }}</strong><span>值得 TRY</span></div>
        <div class="radar-stat"><strong>{{ stats.categoryCount }}</strong><span>主題分類</span></div>
      </div>
    </section>

    <details class="radar-controls" aria-label="Knowledge filters">
      <summary class="radar-controls-summary">
        <span>
          <strong>搜尋與篩選</strong>
          <small>搜尋、主題分類、資源型態、Tag、Action、相關性與排序</small>
        </span>
        <span class="radar-controls-chevron" aria-hidden="true">⌄</span>
      </summary>

      <div class="radar-controls-body">
        <div class="radar-search-row">
          <label class="radar-search">
            <span>搜尋</span>
            <input v-model="query" type="search" placeholder="專案、Skill、技術、Tag、Action…" />
          </label>
          <label>
            <span>資源型態</span>
            <select v-model="resourceKind">
              <option value="ALL">全部</option>
              <option v-for="([item, count]) in resourceKinds" :key="item" :value="item">{{ resourceKindLabel(item) }} ({{ count }})</option>
            </select>
          </label>
          <label>
            <span>Tag</span>
            <select v-model="tag">
              <option value="ALL">全部</option>
              <option v-for="([item, count]) in tags" :key="item" :value="item">{{ item }} ({{ count }})</option>
            </select>
          </label>
          <label>
            <span>Action</span>
            <select v-model="action">
              <option value="ALL">全部</option>
              <option v-for="item in actions" :key="item" :value="item">{{ item }}</option>
            </select>
          </label>
          <label>
            <span>排序</span>
            <select v-model="sortBy">
              <option value="newest">新到舊</option>
              <option value="relevance">相關性</option>
              <option value="updated">最近更新</option>
              <option value="title">名稱</option>
            </select>
          </label>
        </div>

        <div class="radar-control-group">
          <div class="radar-control-label">主題分類</div>
          <div class="radar-pills">
            <button :class="{ active: category === 'ALL' }" @click="category = 'ALL'">全部 <small>{{ cards.length }}</small></button>
            <button
              v-for="([item, count]) in categories"
              :key="item"
              :class="{ active: category === item }"
              @click="category = item"
            >{{ item }} <small>{{ count }}</small></button>
          </div>
        </div>

        <div class="radar-relevance-control">
          <label>
            <span>相關性維度</span>
            <select v-model="dimension">
              <option v-for="([key, label]) in dimensions" :key="key" :value="key">{{ label }}</option>
            </select>
          </label>
          <label class="radar-score-range">
            <span>最低分數：<strong>{{ minScore }}</strong> / 5</span>
            <input v-model.number="minScore" type="range" min="1" max="5" step="1" />
          </label>
          <button class="radar-reset" @click="resetFilters">重設篩選</button>
        </div>
      </div>
    </details>

    <section class="radar-results-head">
      <div><strong>{{ filteredCards.length }}</strong> 筆結果</div>
      <div>{{ dimensions.find(([key]) => key === dimension)?.[1] }} ≥ {{ minScore }}</div>
    </section>

    <section v-if="filteredCards.length" class="radar-grid">
      <article v-for="card in filteredCards" :key="card.id" class="knowledge-tile">
        <div class="knowledge-tile-top">
          <div class="knowledge-source">{{ sourceLabel(card) }}</div>
          <div class="knowledge-score" :title="`${card.relevance[dimension]} / 5`">
            {{ scoreLabel(card.relevance[dimension] ?? 1) }}
          </div>
        </div>

        <h2><a :href="withBase(card.route)">{{ card.title }}</a></h2>
        <p>{{ card.summary }}</p>

        <div class="knowledge-categories">
          <span v-for="item in card.categories" :key="item">{{ item }}</span>
        </div>

        <div class="knowledge-actions">
          <b v-for="item in card.actions" :key="item">{{ item }}</b>
        </div>

        <div class="knowledge-tags">
          <button v-for="item in card.tags.slice(0, 6)" :key="item" @click="selectTag(item)">#{{ item }}</button>
        </div>

        <footer>
          <span>更新 {{ card.updatedAt }}</span>
          <a :href="withBase(card.route)">查看分析 →</a>
        </footer>
      </article>
    </section>

    <section v-else class="radar-empty">
      <strong>沒有符合條件的 Knowledge Card</strong>
      <p>調低相關性分數，或清除部分篩選條件。</p>
      <button @click="resetFilters">顯示全部</button>
    </section>
  </main>
</template>

<style scoped>
.radar-shell {
  padding-top: 28px;
}

.radar-hero {
  position: relative;
  overflow: hidden;
  padding: 48px;
  border: 1px solid var(--kc-border);
  border-radius: 28px;
  background:
    radial-gradient(circle at 86% 12%, color-mix(in srgb, var(--vp-c-brand-1) 22%, transparent), transparent 34%),
    linear-gradient(145deg, var(--vp-c-bg-soft), var(--vp-c-bg));
  box-shadow: 0 18px 70px rgba(0, 0, 0, 0.06);
}

.radar-kicker {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .16em;
  color: var(--vp-c-brand-1);
}

.radar-hero h1 {
  margin: 8px 0 12px;
  border: 0;
  font-size: clamp(38px, 6vw, 68px);
  line-height: .98;
  letter-spacing: -.045em;
}

.radar-hero > p {
  max-width: 720px;
  margin: 0;
  color: var(--kc-muted);
  font-size: 17px;
  line-height: 1.8;
}

.radar-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-top: 34px;
}

.radar-stat {
  padding: 17px 18px;
  border: 1px solid var(--kc-border);
  border-radius: 16px;
  background: color-mix(in srgb, var(--vp-c-bg) 75%, transparent);
}

.radar-stat strong,
.radar-stat span {
  display: block;
}

.radar-stat strong {
  font-size: 26px;
  line-height: 1.1;
}

.radar-stat span {
  margin-top: 5px;
  color: var(--kc-muted);
  font-size: 12px;
}

.radar-controls {
  margin-top: 20px;
  padding: 22px;
  border: 1px solid var(--kc-border);
  border-radius: 22px;
  background: var(--kc-panel);
}

.radar-search-row {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) 190px 150px 140px;
  gap: 12px;
}

.radar-controls label > span,
.radar-control-label {
  display: block;
  margin-bottom: 7px;
  color: var(--kc-muted);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .02em;
}

.radar-controls input[type="search"],
.radar-controls select {
  width: 100%;
  height: 42px;
  padding: 0 12px;
  border: 1px solid var(--kc-border);
  border-radius: 11px;
  outline: none;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font: inherit;
}

.radar-controls input[type="search"]:focus,
.radar-controls select:focus {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--vp-c-brand-1) 14%, transparent);
}

.radar-control-group {
  margin-top: 18px;
}

.radar-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.radar-pills button,
.radar-reset,
.radar-empty button {
  border: 1px solid var(--kc-border);
  border-radius: 999px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: .18s ease;
}

.radar-pills button {
  padding: 7px 11px;
  font-size: 12px;
}

.radar-pills button:hover,
.radar-pills button.active {
  border-color: var(--vp-c-brand-1);
  background: color-mix(in srgb, var(--vp-c-brand-1) 10%, var(--vp-c-bg));
  color: var(--vp-c-brand-1);
}

.radar-pills small {
  margin-left: 4px;
  opacity: .7;
}

.radar-relevance-control {
  display: grid;
  grid-template-columns: 220px minmax(220px, 1fr) auto;
  align-items: end;
  gap: 14px;
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid var(--kc-border);
}

.radar-score-range input {
  width: 100%;
  accent-color: var(--vp-c-brand-1);
}

.radar-reset {
  min-height: 42px;
  padding: 0 16px;
}

.radar-reset:hover,
.radar-empty button:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.radar-results-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin: 26px 2px 12px;
  color: var(--kc-muted);
  font-size: 13px;
}

.radar-results-head strong {
  color: var(--vp-c-text-1);
  font-size: 17px;
}

.radar-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.knowledge-tile {
  display: flex;
  min-height: 360px;
  flex-direction: column;
  padding: 22px;
  border: 1px solid var(--kc-border);
  border-radius: 20px;
  background: var(--vp-c-bg);
  box-shadow: 0 10px 36px rgba(0, 0, 0, .035);
  transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
}

.knowledge-tile:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 55%, var(--kc-border));
  box-shadow: 0 16px 46px rgba(0, 0, 0, .07);
}

.knowledge-tile-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.knowledge-source {
  color: var(--kc-muted);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .09em;
  text-transform: uppercase;
}

.knowledge-score {
  color: #d49a1f;
  font-size: 12px;
  letter-spacing: .03em;
  white-space: nowrap;
}

.knowledge-tile h2 {
  margin: 17px 0 8px;
  border: 0;
  font-size: 22px;
  line-height: 1.25;
}

.knowledge-tile h2 a {
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.knowledge-tile > p {
  display: -webkit-box;
  overflow: hidden;
  margin: 0 0 16px;
  color: var(--kc-muted);
  font-size: 14px;
  line-height: 1.7;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
}

.knowledge-categories,
.knowledge-actions,
.knowledge-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.knowledge-categories span {
  padding: 4px 8px;
  border-radius: 7px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 11px;
}

.knowledge-actions {
  margin-top: 10px;
}

.knowledge-actions b {
  padding: 4px 8px;
  border: 1px solid color-mix(in srgb, var(--vp-c-brand-1) 35%, transparent);
  border-radius: 7px;
  color: var(--vp-c-brand-1);
  font-size: 10px;
  letter-spacing: .05em;
}

.knowledge-tags {
  margin-top: 12px;
}

.knowledge-tags button {
  padding: 0;
  border: 0;
  background: none;
  color: var(--vp-c-text-3);
  cursor: pointer;
  font-size: 11px;
}

.knowledge-tags button:hover {
  color: var(--vp-c-brand-1);
}

.knowledge-tile footer {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  padding-top: 20px;
  color: var(--vp-c-text-3);
  font-size: 11px;
}

.knowledge-tile footer a {
  color: var(--vp-c-brand-1);
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
}

.radar-empty {
  padding: 64px 20px;
  border: 1px dashed var(--kc-border);
  border-radius: 20px;
  text-align: center;
  color: var(--kc-muted);
}

.radar-empty strong {
  color: var(--vp-c-text-1);
  font-size: 18px;
}

.radar-empty button {
  padding: 8px 14px;
}

@media (max-width: 1000px) {
  .radar-search-row { grid-template-columns: 1fr 1fr; }
  .radar-search { grid-column: 1 / -1; }
}

@media (max-width: 900px) {
  .radar-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .radar-stats { grid-template-columns: repeat(2, 1fr); }
  .radar-relevance-control { grid-template-columns: 1fr 1fr; }
  .radar-reset { grid-column: 1 / -1; }
}

@media (max-width: 640px) {
  .radar-shell { padding-top: 12px; }
  .radar-hero { padding: 28px 20px; border-radius: 20px; }
  .radar-hero > p { font-size: 14px; }
  .radar-stats { gap: 8px; margin-top: 24px; }
  .radar-stat { padding: 13px; }
  .radar-stat strong { font-size: 21px; }
  .radar-controls { padding: 16px; border-radius: 17px; }
  .radar-search-row,
  .radar-relevance-control,
  .radar-grid { grid-template-columns: 1fr; }
  .radar-search { grid-column: auto; }
  .radar-reset { grid-column: auto; }
  .knowledge-tile { min-height: 0; }
  .radar-results-head { align-items: end; }
}

.radar-controls {
  padding: 0;
  overflow: hidden;
}

.radar-controls-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px;
  cursor: pointer;
  list-style: none;
  user-select: none;
}

.radar-controls-summary::-webkit-details-marker {
  display: none;
}

.radar-controls-summary > span:first-child {
  min-width: 0;
}

.radar-controls-summary strong,
.radar-controls-summary small {
  display: block;
}

.radar-controls-summary strong {
  color: var(--vp-c-text-1);
  font-size: 14px;
}

.radar-controls-summary small {
  margin-top: 3px;
  color: var(--radar-muted);
  font-size: 11px;
}

.radar-controls-chevron {
  flex: 0 0 auto;
  color: var(--vp-c-text-3);
  font-size: 20px;
  line-height: 1;
  transition: transform .18s ease;
}

.radar-controls[open] .radar-controls-chevron {
  transform: rotate(180deg);
}

.radar-controls-body {
  padding: 20px 22px 22px;
  border-top: 1px solid var(--radar-border);
}

@media (max-width: 640px) {
  .radar-controls-summary {
    padding: 15px 16px;
  }

  .radar-controls-body {
    padding: 16px;
  }
}
</style>
