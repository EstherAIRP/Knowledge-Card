<script setup>
import { computed } from 'vue';
import { useData, withBase } from 'vitepress';

const { params } = useData();
const card = computed(() => params.value.card ?? {});

const dimensions = [
  ['overall', 'Overall'],
  ['ai_rd', 'AI RD'],
  ['aoi_ai', 'AOI × AI'],
  ['llm_agent', 'LLM / Agent'],
  ['sillytavern_ai_rpg', 'SillyTavern / AI RPG'],
  ['image_gen', 'Image Gen']
];

const editUrl = computed(() => {
  const path = card.value.cardPath;
  return path
    ? `https://github.com/EstherAIRP/Knowledge-Card/edit/main/${path}`
    : 'https://github.com/EstherAIRP/Knowledge-Card';
});

function width(score) {
  return `${Math.max(0, Math.min(5, score ?? 0)) * 20}%`;
}
</script>

<template>
  <section class="knowledge-detail-head">
    <div class="knowledge-detail-top">
      <div>
        <div class="knowledge-detail-source">{{ card.sourceType }} · {{ card.status }}</div>
        <div class="knowledge-detail-categories">
          <span v-for="item in card.categories" :key="item">{{ item }}</span>
        </div>
      </div>
    </div>

    <details v-if="card.actions?.length" class="knowledge-action-collapse">
      <summary>
        <span>Action</span>
        <small>{{ card.actions.length }} 項</small>
      </summary>
      <div class="knowledge-detail-actions">
        <span v-for="item in card.actions" :key="item">{{ item }}</span>
      </div>
    </details>

    <div class="relevance-grid" aria-label="Relevance scores">
      <div v-for="([key, label]) in dimensions" :key="key" class="relevance-item">
        <label>{{ label }}</label>
        <strong>{{ card.relevance?.[key] ?? '-' }} / 5</strong>
        <div class="relevance-track"><i :style="{ width: width(card.relevance?.[key]) }"></i></div>
      </div>
    </div>

    <div class="knowledge-tags">
      <span v-for="tag in card.tags" :key="tag">#{{ tag }}</span>
    </div>

    <div class="knowledge-detail-footer">
      <span>建立 {{ card.createdAt }} · 更新 {{ card.updatedAt }} · 最近檢查 {{ card.lastCheckedAt }}</span>
      <span>
        <a :href="card.canonicalUrl" target="_blank" rel="noreferrer">原始來源 ↗</a>
        &nbsp;·&nbsp;
        <a :href="editUrl" target="_blank" rel="noreferrer">編輯 Card ↗</a>
        &nbsp;·&nbsp;
        <a :href="withBase('/')">回到 Radar</a>
      </span>
    </div>
  </section>
</template>

<style scoped>
.knowledge-action-collapse {
  margin-top: 16px;
  overflow: hidden;
  border: 1px solid var(--radar-border);
  border-radius: 12px;
  background: color-mix(in srgb, var(--vp-c-bg) 70%, transparent);
}

.knowledge-action-collapse summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 13px;
  cursor: pointer;
  list-style: none;
  color: var(--vp-c-text-2);
  font-size: 12px;
  font-weight: 800;
  user-select: none;
}

.knowledge-action-collapse summary::-webkit-details-marker {
  display: none;
}

.knowledge-action-collapse summary::after {
  content: '⌄';
  margin-left: auto;
  color: var(--vp-c-text-3);
  font-size: 17px;
  line-height: 1;
  transition: transform .18s ease;
}

.knowledge-action-collapse[open] summary::after {
  transform: rotate(180deg);
}

.knowledge-action-collapse summary small {
  color: var(--vp-c-text-3);
  font-size: 10px;
  font-weight: 600;
}

.knowledge-action-collapse .knowledge-detail-actions {
  margin-top: 0;
  padding: 0 13px 13px;
}
</style>
