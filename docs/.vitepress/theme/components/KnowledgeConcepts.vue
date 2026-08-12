<script setup>
import { computed } from 'vue';
import { useData, withBase } from 'vitepress';

const { params } = useData();
const concepts = computed(() => params.value.card?.concepts ?? []);
</script>

<template>
  <section v-if="concepts.length" class="knowledge-concepts">
    <div class="knowledge-concepts-head">
      <div>
        <span>PHASE 3 · CONCEPTS</span>
        <h2>Concept Neighborhood</h2>
      </div>
      <a :href="withBase('/graph')">Knowledge Graph →</a>
    </div>

    <div class="knowledge-concept-grid">
      <a v-for="concept in concepts" :key="concept.id" class="knowledge-concept" :href="withBase(concept.route)">
        <div class="knowledge-concept-top">
          <div>
            <span>{{ concept.type }}</span>
            <h3>{{ concept.label }}</h3>
          </div>
          <strong>{{ Math.round((concept.strength ?? 0) * 100) }}%</strong>
        </div>
        <p>{{ concept.description }}</p>
        <div class="knowledge-concept-meta">
          <span>{{ concept.cardCount }} Cards</span>
          <span>{{ concept.origin }}</span>
        </div>
      </a>
    </div>
  </section>
</template>

<style scoped>
.knowledge-concepts { margin-top: 46px; padding-top: 24px; border-top: 1px solid var(--vp-c-divider); }
.knowledge-concepts-head { display: flex; justify-content: space-between; gap: 20px; align-items: end; margin-bottom: 14px; }
.knowledge-concepts-head span { font-size: 10px; font-weight: 800; letter-spacing: .1em; opacity: .55; }
.knowledge-concepts-head h2 { margin: 4px 0 0; padding: 0; border: 0; }
.knowledge-concepts-head > a { font-size: 12px; font-weight: 700; white-space: nowrap; }
.knowledge-concept-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 10px; }
.knowledge-concept { display: block; padding: 14px; border: 1px solid var(--vp-c-divider); border-radius: 13px; color: inherit; text-decoration: none; background: var(--vp-c-bg-soft); transition: transform .18s ease, border-color .18s ease; }
.knowledge-concept:hover { transform: translateY(-2px); border-color: var(--vp-c-brand-1); }
.knowledge-concept-top { display: flex; justify-content: space-between; gap: 12px; align-items: start; }
.knowledge-concept-top span { font-size: 9px; text-transform: uppercase; letter-spacing: .08em; opacity: .55; }
.knowledge-concept h3 { margin: 2px 0 0; font-size: 16px; }
.knowledge-concept-top strong { font-size: 11px; color: var(--vp-c-brand-1); }
.knowledge-concept p { margin: 8px 0; font-size: 12px; line-height: 1.6; opacity: .7; }
.knowledge-concept-meta { display: flex; justify-content: space-between; gap: 10px; font-size: 10px; opacity: .55; }
</style>
