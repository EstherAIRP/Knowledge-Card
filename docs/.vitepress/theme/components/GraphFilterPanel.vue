<script setup>
const props = defineProps({
  facets: { type: Object, required: true },
  relationTypes: { type: Array, required: true },
  filters: { type: Object, required: true },
  activeCount: { type: Number, required: true },
  resultCount: { type: Number, required: true },
  totalCount: { type: Number, required: true },
  tagSearch: { type: String, default: '' },
  colorBy: { type: String, default: 'category' },
  selectedCard: { type: Boolean, default: false },
  mobile: { type: Boolean, default: false }
});

const emit = defineEmits([
  'toggle-filter',
  'update-filter',
  'update:tagSearch',
  'update:colorBy',
  'reset',
  'fit-results',
  'close'
]);

function checked(key, value) {
  return props.filters[key]?.includes(value);
}

function updateNumber(key, event) {
  emit('update-filter', key, Number(event.target.value));
}

function updateString(key, event) {
  emit('update-filter', key, event.target.value);
}

const sourceLabels = {
  github: 'GitHub',
  article: '文章',
  paper: '論文',
  documentation: '文件',
  tool: '工具',
  video: '影片',
  other: '其他'
};

const resourceLabels = {
  project: 'Project',
  skill: 'Skill'
};
</script>

<template>
  <section :class="['graph-filter-panel', mobile ? 'graph-filter-panel--mobile' : '']">
    <header class="graph-filter-panel__header">
      <div>
        <div class="graph-filter-panel__eyebrow">FILTERS</div>
        <h2>篩選</h2>
        <p>{{ resultCount }} / {{ totalCount }} Cards <span v-if="activeCount">· {{ activeCount }} 組條件</span></p>
      </div>
      <button v-if="mobile" type="button" class="graph-filter-panel__close" aria-label="關閉篩選" @click="emit('close')">×</button>
    </header>

    <div class="graph-filter-section">
      <label class="graph-filter-select">
        <span>顏色依據</span>
        <select :value="colorBy" @change="emit('update:colorBy', $event.target.value)">
          <option value="none">無</option>
          <option value="category">Category</option>
          <option value="action">Action</option>
          <option value="relevance">Relevance</option>
        </select>
      </label>

      <div class="graph-filter-segment" aria-label="篩選結果顯示方式">
        <button
          type="button"
          :class="{ active: filters.displayMode === 'dim' }"
          @click="emit('update-filter', 'displayMode', 'dim')"
        >
          淡化
        </button>
        <button
          type="button"
          :class="{ active: filters.displayMode === 'hide' }"
          @click="emit('update-filter', 'displayMode', 'hide')"
        >
          隱藏
        </button>
      </div>
    </div>

    <details class="graph-filter-group" open>
      <summary>Category <span>{{ filters.categories.length || '' }}</span></summary>
      <div class="graph-filter-options">
        <label v-for="item in facets.categories" :key="item">
          <input
            type="checkbox"
            :checked="checked('categories', item)"
            @change="emit('toggle-filter', 'categories', item)"
          />
          <span>{{ item }}</span>
        </label>
      </div>
    </details>

    <details class="graph-filter-group">
      <summary>Action <span>{{ filters.actions.length || '' }}</span></summary>
      <div class="graph-filter-options graph-filter-options--compact">
        <label v-for="item in facets.actions" :key="item">
          <input
            type="checkbox"
            :checked="checked('actions', item)"
            @change="emit('toggle-filter', 'actions', item)"
          />
          <span>{{ item }}</span>
        </label>
      </div>
    </details>

    <details class="graph-filter-group">
      <summary>Relevance <span v-if="filters.minimumRelevance > 1">≥ {{ filters.minimumRelevance }}</span></summary>
      <label class="graph-range">
        <div><span>最低 Overall</span><strong>{{ filters.minimumRelevance }}</strong></div>
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          :value="filters.minimumRelevance"
          @input="updateNumber('minimumRelevance', $event)"
        />
        <div class="graph-range__ticks"><span>1</span><span>3</span><span>5</span></div>
      </label>
    </details>

    <details class="graph-filter-group">
      <summary>來源 <span>{{ filters.sourceTypes.length + filters.resourceKinds.length || '' }}</span></summary>
      <div class="graph-filter-subtitle">Source Type</div>
      <div class="graph-filter-options graph-filter-options--compact">
        <label v-for="item in facets.sourceTypes" :key="item">
          <input
            type="checkbox"
            :checked="checked('sourceTypes', item)"
            @change="emit('toggle-filter', 'sourceTypes', item)"
          />
          <span>{{ sourceLabels[item] ?? item }}</span>
        </label>
      </div>
      <template v-if="facets.resourceKinds.length">
        <div class="graph-filter-subtitle">GitHub Resource</div>
        <div class="graph-filter-options graph-filter-options--compact">
          <label v-for="item in facets.resourceKinds" :key="item">
            <input
              type="checkbox"
              :checked="checked('resourceKinds', item)"
              @change="emit('toggle-filter', 'resourceKinds', item)"
            />
            <span>{{ resourceLabels[item] ?? item }}</span>
          </label>
        </div>
      </template>
    </details>

    <details class="graph-filter-group">
      <summary>Tag <span>{{ filters.tags.length || '' }}</span></summary>
      <input
        class="graph-tag-search"
        type="search"
        :value="tagSearch"
        placeholder="搜尋 Tag"
        @input="emit('update:tagSearch', $event.target.value)"
      />
      <div class="graph-filter-tags">
        <button
          v-for="item in facets.tags"
          :key="item.value"
          type="button"
          :class="{ active: checked('tags', item.value) }"
          @click="emit('toggle-filter', 'tags', item.value)"
        >
          {{ item.value }} <small>{{ item.count }}</small>
        </button>
      </div>
    </details>

    <details class="graph-filter-group">
      <summary>Relation <span>{{ filters.relationTypes.length || '' }}</span></summary>
      <div class="graph-filter-options graph-filter-options--compact">
        <label v-for="item in relationTypes" :key="item">
          <input
            type="checkbox"
            :checked="checked('relationTypes', item)"
            @change="emit('toggle-filter', 'relationTypes', item)"
          />
          <span>{{ item }}</span>
        </label>
      </div>
    </details>

    <details v-if="selectedCard" class="graph-filter-group" open>
      <summary>語意距離 <span v-if="filters.semanticEnabled">ON</span></summary>
      <label class="graph-filter-enable">
        <input
          type="checkbox"
          :checked="filters.semanticEnabled"
          @change="emit('update-filter', 'semanticEnabled', $event.target.checked)"
        />
        <span>限制選取 Card 的語意鄰域</span>
      </label>

      <div :class="['graph-semantic-filter', filters.semanticEnabled ? '' : 'is-disabled']">
        <div class="graph-filter-segment">
          <button
            type="button"
            :class="{ active: filters.semanticMode === 'top' }"
            @click="emit('update-filter', 'semanticMode', 'top')"
          >
            Top N
          </button>
          <button
            type="button"
            :class="{ active: filters.semanticMode === 'distance' }"
            @click="emit('update-filter', 'semanticMode', 'distance')"
          >
            Distance ≤ X
          </button>
        </div>

        <label v-if="filters.semanticMode === 'top'" class="graph-range">
          <div><span>最近鄰居</span><strong>{{ filters.semanticTopN }}</strong></div>
          <input
            type="range"
            min="1"
            max="12"
            step="1"
            :value="filters.semanticTopN"
            @input="updateNumber('semanticTopN', $event)"
          />
        </label>

        <label v-else class="graph-range">
          <div><span>最大距離</span><strong>{{ Number(filters.semanticMaxDistance).toFixed(2) }}</strong></div>
          <input
            type="range"
            min="0.05"
            max="1"
            step="0.05"
            :value="filters.semanticMaxDistance"
            @input="updateNumber('semanticMaxDistance', $event)"
          />
        </label>
      </div>
    </details>

    <footer class="graph-filter-panel__footer">
      <button type="button" class="graph-filter-reset" @click="emit('reset')">重設</button>
      <button type="button" class="graph-filter-fit" :disabled="resultCount === 0" @click="emit('fit-results')">
        Fit Results
      </button>
    </footer>
  </section>
</template>

<style scoped>
.graph-filter-panel {
  border: 1px solid var(--vp-c-divider);
  border-radius: 18px;
  padding: 16px;
  background: var(--vp-c-bg-soft);
  max-height: calc(100vh - 120px);
  overflow: auto;
  position: sticky;
  top: 82px;
}
.graph-filter-panel__header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--vp-c-divider);
}
.graph-filter-panel__eyebrow {
  font-size: 9px;
  font-weight: 900;
  letter-spacing: .12em;
  opacity: .5;
}
.graph-filter-panel h2 {
  margin: 2px 0 0;
  font-size: 18px;
}
.graph-filter-panel__header p {
  margin: 4px 0 0;
  font-size: 10px;
  opacity: .62;
}
.graph-filter-panel__close {
  border: 0;
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 26px;
  cursor: pointer;
}
.graph-filter-section {
  display: grid;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid var(--vp-c-divider);
}
.graph-filter-select {
  display: grid;
  gap: 5px;
  font-size: 11px;
  font-weight: 800;
}
.graph-filter-select select,
.graph-tag-search {
  min-height: 36px;
  width: 100%;
  border: 1px solid var(--vp-c-divider);
  border-radius: 9px;
  padding: 0 9px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}
.graph-filter-segment {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 9px;
  padding: 3px;
  background: var(--vp-c-bg);
}
.graph-filter-segment button {
  min-height: 32px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--vp-c-text-2);
  font: inherit;
  font-size: 10px;
  font-weight: 800;
  cursor: pointer;
}
.graph-filter-segment button.active {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}
.graph-filter-group {
  border-bottom: 1px solid var(--vp-c-divider);
  padding: 11px 0;
}
.graph-filter-group summary {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
  list-style: none;
  font-size: 11px;
  font-weight: 900;
}
.graph-filter-group summary::-webkit-details-marker { display: none; }
.graph-filter-group summary span {
  color: var(--vp-c-brand-1);
  font-size: 10px;
}
.graph-filter-options {
  display: grid;
  gap: 7px;
  margin-top: 9px;
}
.graph-filter-options--compact {
  grid-template-columns: 1fr 1fr;
}
.graph-filter-options label,
.graph-filter-enable {
  display: flex;
  align-items: start;
  gap: 7px;
  font-size: 10px;
  line-height: 1.4;
  cursor: pointer;
}
.graph-filter-options input,
.graph-filter-enable input {
  margin-top: 1px;
}
.graph-filter-subtitle {
  margin-top: 10px;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: .06em;
  text-transform: uppercase;
  opacity: .5;
}
.graph-range {
  display: grid;
  gap: 6px;
  margin-top: 10px;
}
.graph-range > div:first-child {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 10px;
}
.graph-range strong {
  color: var(--vp-c-brand-1);
}
.graph-range input {
  width: 100%;
}
.graph-range__ticks {
  display: flex;
  justify-content: space-between;
  font-size: 8px;
  opacity: .5;
}
.graph-tag-search {
  margin-top: 9px;
  font-size: 10px;
}
.graph-filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 8px;
  max-height: 160px;
  overflow: auto;
}
.graph-filter-tags button {
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  padding: 4px 7px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  font: inherit;
  font-size: 9px;
  cursor: pointer;
}
.graph-filter-tags button.active {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}
.graph-filter-tags small {
  opacity: .55;
}
.graph-semantic-filter {
  display: grid;
  gap: 9px;
  margin-top: 10px;
}
.graph-semantic-filter.is-disabled {
  opacity: .35;
  pointer-events: none;
}
.graph-filter-panel__footer {
  position: sticky;
  bottom: -16px;
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: 8px;
  padding: 12px 0 16px;
  margin-top: 8px;
  background: var(--vp-c-bg-soft);
}
.graph-filter-panel__footer button {
  min-height: 38px;
  border-radius: 9px;
  font: inherit;
  font-size: 10px;
  font-weight: 900;
  cursor: pointer;
}
.graph-filter-reset {
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
}
.graph-filter-fit {
  border: 1px solid var(--vp-c-brand-1);
  background: var(--vp-c-brand-1);
  color: white;
}
.graph-filter-fit:disabled {
  opacity: .4;
  cursor: default;
}
.graph-filter-panel--mobile {
  position: fixed;
  z-index: 101;
  left: 0;
  right: 0;
  bottom: 0;
  top: auto;
  max-height: min(78vh, 720px);
  border-radius: 22px 22px 0 0;
  padding: 18px 18px 8px;
  box-shadow: 0 -14px 44px rgba(0, 0, 0, .2);
}
.graph-filter-panel--mobile .graph-filter-panel__footer {
  bottom: -8px;
  padding-bottom: 12px;
}
</style>
