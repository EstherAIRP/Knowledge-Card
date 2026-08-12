import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadCards } from '../scripts/lib/knowledge.mjs';

const contentRoot = fileURLToPath(new URL('../content/knowledge/', import.meta.url));
const conceptPath = fileURLToPath(new URL('../data/concepts.json', import.meta.url));
const relationPath = fileURLToPath(new URL('../data/relations.json', import.meta.url));

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

export default {
  watch: ['../content/knowledge/**/*.md', '../data/concepts.json', '../data/relations.json'],
  load() {
    const cards = loadCards(contentRoot);
    const concepts = readJson(conceptPath, { concepts: [], card_concepts: [], concept_relations: [], stats: {} });
    const relations = readJson(relationPath, { edges: [] });
    const cardById = new Map(cards.map((card) => [card.data.id, card]));

    const nodes = [
      ...cards.map((card) => ({
        id: `card:${card.data.id}`,
        entityId: card.data.id,
        kind: 'card',
        label: card.data.title,
        description: card.data.summary,
        route: `/knowledge/${card.data.id}`,
        degree: concepts.card_concepts.filter((edge) => edge.card_id === card.data.id).length
      })),
      ...concepts.concepts.map((concept) => ({
        id: `concept:${concept.id}`,
        entityId: concept.id,
        kind: 'concept',
        conceptType: concept.type,
        label: concept.label,
        description: concept.description,
        route: `/concepts/${concept.id}`,
        degree: concept.card_count
      }))
    ];

    const edges = [
      ...concepts.card_concepts
        .filter((edge) => cardById.has(edge.card_id))
        .map((edge) => ({
          source: `card:${edge.card_id}`,
          target: `concept:${edge.concept_id}`,
          kind: 'card-concept',
          type: 'has_concept',
          weight: edge.strength,
          evidence: edge.evidence
        })),
      ...concepts.concept_relations.map((edge) => ({
        source: `concept:${edge.source}`,
        target: `concept:${edge.target}`,
        kind: 'concept-concept',
        type: edge.type,
        weight: edge.weight,
        support: edge.support
      })),
      ...(relations.edges ?? []).map((edge) => ({
        source: `card:${edge.source}`,
        target: `card:${edge.target}`,
        kind: 'card-card',
        type: edge.type,
        weight: edge.score,
        direction: edge.direction ?? 'undirected'
      }))
    ];

    return {
      generatedAt: concepts.generated_at ?? null,
      stats: {
        cards: cards.length,
        concepts: concepts.concepts.length,
        cardConceptEdges: concepts.card_concepts.length,
        conceptRelations: concepts.concept_relations.length,
        cardRelations: relations.edges?.length ?? 0
      },
      nodes,
      edges
    };
  }
};
