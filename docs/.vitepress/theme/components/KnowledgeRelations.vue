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
