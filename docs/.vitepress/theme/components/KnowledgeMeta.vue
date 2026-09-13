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
  return `${source} · ${labels[kind] ?? kind}`;
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

<style scoped>
.knowledge-detail-head {
  margin: 12px 0 34px;
  padding: 22px;
  border: 1px solid var(--kc-border);
  border-radius: 18px;
  background: var(--kc-panel);
}

.knowledge-detail-top,
.knowledge-detail-footer {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.knowledge-detail-source,
.knowledge-detail-footer {
  color: var(--vp-c-text-3);
  font-size: 12px;
}

.knowledge-detail-actions,
.knowledge-detail-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 12px;
}

.knowledge-detail-actions span {
  padding: 5px 9px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--vp-c-brand-1) 11%, var(--vp-c-bg));
  color: var(--vp-c-brand-1);
  font-size: 11px;
  font-weight: 800;
}

.knowledge-detail-categories span {
  padding: 5px 9px;
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 11px;
}

.relevance-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px 18px;
  margin: 20px 0;
}

.relevance-item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 5px 10px;
  align-items: center;
}

.relevance-item label,
.relevance-item strong {
  font-size: 11px;
}

.relevance-item label {
  color: var(--kc-muted);
}

.relevance-track {
  grid-column: 1 / -1;
  height: 5px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--vp-c-bg-soft);
}

.relevance-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--vp-c-brand-1);
}

.knowledge-detail-footer {
  padding-top: 14px;
  border-top: 1px solid var(--kc-border);
}

.knowledge-detail-footer a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.knowledge-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.knowledge-detail-head .knowledge-tags span {
  color: var(--vp-c-text-3);
  font-size: 11px;
}

@media (max-width: 900px) {
  .relevance-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 640px) {
  .relevance-grid { grid-template-columns: 1fr; }
  .knowledge-detail-top,
  .knowledge-detail-footer { flex-direction: column; }
}
</style>
