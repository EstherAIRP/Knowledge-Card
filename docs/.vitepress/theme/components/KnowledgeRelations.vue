<script setup>
import { computed } from 'vue';
import { useData, withBase } from 'vitepress';

const { params } = useData();
const relations = computed(() => params.value.card?.related ?? []);

function scoreLabel(score) {
  return `${Math.round((Number(score) || 0) * 100)}%`;
}

function typeLabel(relation) {
  const labels = {
    similar_to: 'Similar',
    alternative_to: 'Alternative',
    complements: 'Complements',
    integrates_with: 'Integrates with',
    contrasts_with: 'Contrasts with'
  };
  if (relation.type === 'depends_on') {
    return relation.perspective === 'incoming' ? 'Depended on by' : 'Depends on';
  }
  if (relation.type === 'extends') {
    return relation.perspective === 'incoming' ? 'Extended by' : 'Extends';
  }
  return labels[relation.type] ?? 'Related';
}

function cleanSignal(signal) {
  const [, value] = String(signal).split(/:(.+)/);
  return value || signal;
}

function scoreParts(relation) {
  const scores = relation.scores ?? {};
  return [
    ['Taxonomy', scores.taxonomy],
    ['Semantic', scores.semantic],
    ['LLM', scores.llm]
  ].filter(([, value]) => value !== null && value !== undefined);
}
</script>

<template>
  <section v-if="relations.length" class="knowledge-relations">
    <div class="knowledge-relations-head">
      <div>
        <span>SEMANTIC RELATION INDEX</span>
        <h2>Related Knowledge</h2>
      </div>
      <small>{{ relations.length }} relations</small>
    </div>

    <div class="knowledge-relations-grid">
      <a
        v-for="relation in relations"
        :key="relation.id"
        class="knowledge-relation-card"
        :href="withBase(relation.route)"
      >
        <div class="knowledge-relation-top">
          <span>{{ typeLabel(relation) }}</span>
          <strong>{{ scoreLabel(relation.score) }}</strong>
        </div>
        <h3>{{ relation.title }}</h3>
        <p class="knowledge-relation-summary">{{ relation.summary }}</p>
        <p v-if="relation.reason" class="knowledge-relation-reason">{{ relation.reason }}</p>

        <div v-if="scoreParts(relation).length" class="knowledge-relation-scores">
          <span v-for="([label, value]) in scoreParts(relation)" :key="label">
            {{ label }} {{ scoreLabel(value) }}
          </span>
        </div>

        <div v-if="relation.signals?.length" class="knowledge-relation-signals">
          <span v-for="signal in relation.signals.slice(0, 4)" :key="signal">{{ cleanSignal(signal) }}</span>
        </div>
        <small class="knowledge-relation-classifier">
          {{ relation.overridden ? 'Human override' : relation.classifier === 'llm' ? 'LLM classified' : 'Automatic fallback' }}
        </small>
      </a>
    </div>
  </section>
</template>

<style scoped>
.knowledge-relations {
  margin: 42px 0 10px;
  padding-top: 28px;
  border-top: 1px solid var(--kc-border);
}

.knowledge-relations-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.knowledge-relations-head span {
  color: var(--vp-c-brand-1);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .14em;
}

.knowledge-relations-head h2 {
  margin: 4px 0 0;
  border: 0;
  font-size: 22px;
}

.knowledge-relations-head small {
  color: var(--vp-c-text-3);
}

.knowledge-relations-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.knowledge-relation-card {
  display: block;
  padding: 18px;
  border: 1px solid var(--kc-border);
  border-radius: 16px;
  background: var(--kc-panel);
  color: var(--vp-c-text-1);
  text-decoration: none !important;
  transition: transform .18s ease, border-color .18s ease;
}

.knowledge-relation-card:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 55%, var(--kc-border));
}

.knowledge-relation-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--vp-c-text-3);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.knowledge-relation-top strong {
  color: var(--vp-c-brand-1);
}

.knowledge-relation-card h3 {
  margin: 10px 0 7px;
  font-size: 17px;
}

.knowledge-relation-summary,
.knowledge-relation-reason {
  margin: 0;
  font-size: 12px;
  line-height: 1.65;
}

.knowledge-relation-summary {
  display: -webkit-box;
  overflow: hidden;
  color: var(--vp-c-text-2);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.knowledge-relation-reason {
  margin-top: 9px;
  padding-top: 9px;
  border-top: 1px dashed var(--kc-border);
  color: var(--vp-c-text-1);
}

.knowledge-relation-scores,
.knowledge-relation-signals {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 11px;
}

.knowledge-relation-scores span,
.knowledge-relation-signals span {
  padding: 3px 7px;
  border-radius: 999px;
  font-size: 9px;
}

.knowledge-relation-scores span {
  background: color-mix(in srgb, var(--vp-c-brand-1) 10%, var(--vp-c-bg));
  color: var(--vp-c-brand-1);
}

.knowledge-relation-signals span {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-3);
}

.knowledge-relation-classifier {
  display: block;
  margin-top: 10px;
  color: var(--vp-c-text-3);
  font-size: 9px;
}

@media (max-width: 640px) {
  .knowledge-relations-grid {
    grid-template-columns: 1fr;
  }

  .knowledge-relations-head {
    align-items: start;
    flex-direction: column;
  }
}
</style>
