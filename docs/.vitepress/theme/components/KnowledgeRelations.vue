<script setup>
import { computed } from 'vue';
import { useData, withBase } from 'vitepress';

const { params } = useData();
const relations = computed(() => params.value.card?.related ?? []);

function scoreLabel(score) {
  return `${Math.round((Number(score) || 0) * 100)}%`;
}

function typeLabel(type) {
  return type === 'similar_to' ? 'Similar' : 'Related';
}

function cleanSignal(signal) {
  const [, value] = String(signal).split(/:(.+)/);
  return value || signal;
}
</script>

<template>
  <section v-if="relations.length" class="knowledge-relations">
    <div class="knowledge-relations-head">
      <div>
        <span>RELATION INDEX</span>
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
          <span>{{ typeLabel(relation.type) }}</span>
          <strong>{{ scoreLabel(relation.score) }}</strong>
        </div>
        <h3>{{ relation.title }}</h3>
        <p>{{ relation.summary }}</p>
        <div v-if="relation.signals?.length" class="knowledge-relation-signals">
          <span v-for="signal in relation.signals.slice(0, 4)" :key="signal">{{ cleanSignal(signal) }}</span>
        </div>
      </a>
    </div>
  </section>
</template>
