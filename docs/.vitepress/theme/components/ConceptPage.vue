<script setup>
import { computed } from 'vue';
import { useData, withBase } from 'vitepress';

const { params } = useData();
const concept = computed(() => params.value.concept ?? {});

function evidenceLabel(item) {
  if (!item) return '';
  return item.kind === 'category' ? `Category · ${item.value}` : `#${item.value}`;
}
</script>

<template>
  <section class="concept-detail-head">
    <div class="concept-meta-row">
      <div>
        <span class="concept-type">{{ concept.type }}</span>
        <span class="concept-origin">{{ concept.origin }}</span>
      </div>
      <a :href="withBase('/graph')">在 Graph 中查看</a>
    </div>
    <div class="concept-count"><strong>{{ concept.card_count ?? 0 }}</strong> supporting Knowledge Cards</div>
  </section>

  <section class="concept-section">
    <div class="concept-section-title">
      <div>
        <span>Evidence</span>
        <h2>Supporting Knowledge Cards</h2>
      </div>
      <strong>{{ concept.cards?.length ?? 0 }}</strong>
    </div>

    <div class="concept-card-grid">
      <a v-for="card in concept.cards" :key="card.id" class="concept-card" :href="withBase(card.route)">
        <div class="concept-card-top">
          <h3>{{ card.title }}</h3>
          <span>{{ Math.round((card.strength ?? 0) * 100) }}%</span>
        </div>
        <p>{{ card.summary }}</p>
        <div class="concept-evidence">
          <span v-for="(item, index) in card.evidence" :key="`${item.kind}-${item.value}-${index}`">{{ evidenceLabel(item) }}</span>
        </div>
      </a>
    </div>
  </section>

  <section v-if="concept.related?.length" class="concept-section">
    <div class="concept-section-title">
      <div>
        <span>Ontology neighborhood</span>
        <h2>Related Concepts</h2>
      </div>
      <strong>{{ concept.related.length }}</strong>
    </div>

    <div class="concept-related-grid">
      <a v-for="item in concept.related" :key="item.id" class="concept-related" :href="withBase(item.route)">
        <div>
          <span>{{ item.type }}</span>
          <h3>{{ item.label }}</h3>
        </div>
        <strong>{{ item.support }} shared Cards</strong>
        <p>{{ item.description }}</p>
      </a>
    </div>
  </section>

  <div class="concept-footer">
    <a :href="withBase('/graph')">← Knowledge Graph</a>
    <a :href="withBase('/')">Knowledge Radar</a>
  </div>
</template>

<style scoped>
.concept-detail-head { margin: 18px 0 34px; padding: 18px 20px; border: 1px solid var(--vp-c-divider); border-radius: 16px; background: var(--vp-c-bg-soft); }
.concept-meta-row { display: flex; justify-content: space-between; gap: 16px; align-items: center; }
.concept-meta-row > div { display: flex; gap: 8px; flex-wrap: wrap; }
.concept-type, .concept-origin { display: inline-flex; align-items: center; min-height: 26px; padding: 0 9px; border-radius: 999px; font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
.concept-type { background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); }
.concept-origin { border: 1px solid var(--vp-c-divider); }
.concept-count { margin-top: 14px; font-size: 13px; opacity: .72; }
.concept-count strong { margin-right: 5px; font-size: 22px; color: var(--vp-c-text-1); }
.concept-section { margin-top: 38px; }
.concept-section-title { display: flex; justify-content: space-between; gap: 20px; align-items: end; margin-bottom: 14px; }
.concept-section-title span { font-size: 11px; text-transform: uppercase; letter-spacing: .1em; opacity: .56; }
.concept-section-title h2 { margin: 3px 0 0; border: 0; padding: 0; }
.concept-section-title > strong { font-size: 28px; opacity: .25; }
.concept-card-grid, .concept-related-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
.concept-card, .concept-related { display: block; border: 1px solid var(--vp-c-divider); border-radius: 14px; padding: 16px; color: inherit; text-decoration: none; background: var(--vp-c-bg); transition: border-color .18s ease, transform .18s ease; }
.concept-card:hover, .concept-related:hover { border-color: var(--vp-c-brand-1); transform: translateY(-2px); }
.concept-card-top { display: flex; justify-content: space-between; gap: 14px; align-items: start; }
.concept-card h3, .concept-related h3 { margin: 0; font-size: 17px; }
.concept-card-top > span { font-size: 12px; font-weight: 800; color: var(--vp-c-brand-1); }
.concept-card p, .concept-related p { margin: 8px 0 0; font-size: 13px; line-height: 1.65; opacity: .72; }
.concept-evidence { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.concept-evidence span { padding: 4px 7px; border-radius: 7px; background: var(--vp-c-bg-soft); font-size: 10px; opacity: .78; }
.concept-related > div > span { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; opacity: .55; }
.concept-related > strong { display: block; margin-top: 8px; font-size: 11px; color: var(--vp-c-brand-1); }
.concept-footer { display: flex; justify-content: space-between; gap: 20px; margin-top: 44px; padding-top: 18px; border-top: 1px solid var(--vp-c-divider); font-size: 13px; }
</style>
