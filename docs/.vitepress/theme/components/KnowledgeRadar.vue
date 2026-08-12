<script setup>
import { computed, ref } from 'vue';
import { withBase } from 'vitepress';
import { data as cards } from '../../../knowledge.data.js';

const query = ref('');
const category = ref('ALL');
const tag = ref('ALL');
const action = ref('ALL');
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
    if ((card.relevance[selectedDimension] ?? 0) < minScore.value) return false;

    if (needle) {
      const haystack = [
        card.title,
        card.summary,
        card.sourceType,
        ...card.categories,
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

function selectTag(value) {
  tag.value = value;
}

function resetFilters() {
  query.value = '';
  category.value = 'ALL';
  tag.value = 'ALL';
  action.value = 'ALL';
  dimension.value = 'overall';
  minScore.value = 1;
  sortBy.value = 'newest';
}
</script>

<template>
  <main class="radar-shell">
    <section class="radar-hero">
      <div class="radar-kicker">PERSONAL TECHNOLOGY RADAR</div>
      <h1>Knowledge Radar</h1>
      <p>把值得保留的 AI、Agent、AOI 與創作技術，整理成可搜尋、可比較、可持續更新的 Knowledge Cards。</p>
      <div class="radar-stats">
        <div class="radar-stat"><strong>{{ stats.total }}</strong><span>Knowledge Cards</span></div>
        <div class="radar-stat"><strong>{{ stats.high }}</strong><span>高度相關</span></div>
        <div class="radar-stat"><strong>{{ stats.tryCount }}</strong><span>值得 TRY</span></div>
        <div class="radar-stat"><strong>{{ stats.categoryCount }}</strong><span>Categories</span></div>
      </div>
    </section>

    <details class="radar-controls" aria-label="Knowledge filters">
      <summary class="radar-controls-summary">
        <span>
          <strong>搜尋與篩選</strong>
          <small>搜尋、Tag、Action、Category、相關性與排序</small>
        </span>
        <span class="radar-controls-chevron" aria-hidden="true">⌄</span>
      </summary>

      <div class="radar-controls-body">
        <div class="radar-search-row">
          <label class="radar-search">
            <span>搜尋</span>
            <input v-model="query" type="search" placeholder="專案、技術、Tag、Action…" />
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
          <div class="radar-control-label">Category</div>
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
          <div class="knowledge-source">{{ card.sourceType }}</div>
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
