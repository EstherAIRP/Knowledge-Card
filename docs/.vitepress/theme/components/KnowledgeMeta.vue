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

const sourceLabel = computed(() => {
  const source = card.value.sourceType === 'github' ? 'GitHub' : card.value.sourceType;
  const kind = card.value.resourceKind;
  if (!kind) return source;
  const kindLabel = kind === 'skill' ? 'Skill' : 'Project';
  return `${source} · ${kindLabel}`;
});

function width(score) {
  return `${Math.max(0, Math.min(5, score ?? 0)) * 20}%`;
}
</script>

<template>
  <section class="knowledge-detail-head">
    <div class="knowledge-detail-top">
      <div>
        <div class="knowledge-detail-source">{{ sourceLabel }} · {{ card.status }}</div>
        <div class="knowledge-detail-categories">
          <span v-for="item in card.categories" :key="item">{{ item }}</span>
        </div>
      </div>
      <div class="knowledge-detail-actions">
        <span v-for="item in card.actions" :key="item">{{ item }}</span>
      </div>
    </div>

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
