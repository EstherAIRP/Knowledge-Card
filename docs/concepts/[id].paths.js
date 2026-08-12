import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadCards } from '../../scripts/lib/knowledge.mjs';

const contentRoot = fileURLToPath(new URL('../../content/knowledge/', import.meta.url));
const conceptPath = fileURLToPath(new URL('../../data/concepts.json', import.meta.url));

function loadConceptIndex() {
  if (!fs.existsSync(conceptPath)) return { concepts: [], card_concepts: [], concept_relations: [] };
  return JSON.parse(fs.readFileSync(conceptPath, 'utf8'));
}

export default {
  watch: ['../../content/knowledge/**/*.md', '../../data/concepts.json'],
  paths() {
    const index = loadConceptIndex();
    const cards = loadCards(contentRoot);
    const cardById = new Map(cards.map((card) => [card.data.id, card.data]));
    const conceptById = new Map(index.concepts.map((concept) => [concept.id, concept]));

    return index.concepts.map((concept) => {
      const cardsForConcept = index.card_concepts
        .filter((edge) => edge.concept_id === concept.id)
        .map((edge) => {
          const card = cardById.get(edge.card_id);
          if (!card) return null;
          return {
            id: card.id,
            title: card.title,
            summary: card.summary,
            route: `/knowledge/${card.id}`,
            strength: edge.strength,
            origin: edge.origin,
            evidence: edge.evidence ?? []
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.strength - a.strength || a.title.localeCompare(b.title, 'zh-TW'));

      const related = index.concept_relations
        .filter((edge) => edge.source === concept.id || edge.target === concept.id)
        .map((edge) => {
          const neighborId = edge.source === concept.id ? edge.target : edge.source;
          const neighbor = conceptById.get(neighborId);
          if (!neighbor) return null;
          return {
            id: neighbor.id,
            label: neighbor.label,
            type: neighbor.type,
            description: neighbor.description,
            route: `/concepts/${neighbor.id}`,
            support: edge.support,
            weight: edge.weight
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.weight - a.weight || b.support - a.support || a.label.localeCompare(b.label, 'zh-TW'));

      return {
        params: {
          id: concept.id,
          concept: {
            ...concept,
            route: `/concepts/${concept.id}`,
            cards: cardsForConcept,
            related
          }
        },
        content: `# ${concept.label}\n\n${concept.description ?? ''}\n`
      };
    });
  }
};
