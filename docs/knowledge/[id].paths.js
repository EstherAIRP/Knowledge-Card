import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCards } from '../../scripts/lib/knowledge.mjs';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const contentRoot = fileURLToPath(new URL('../../content/knowledge/', import.meta.url));
const relationPath = fileURLToPath(new URL('../../data/relations.json', import.meta.url));
const conceptPath = fileURLToPath(new URL('../../data/concepts.json', import.meta.url));

function effectiveValue(wrapper) {
  return wrapper?.user ?? wrapper?.ai ?? null;
}

function effectiveRelevance(relevance) {
  const ai = relevance?.ai ?? {};
  const user = relevance?.user ?? {};
  return Object.fromEntries(Object.keys(ai).map((key) => [key, user[key] ?? ai[key]]));
}

function normalizeCard(card) {
  const data = card.data;
  return {
    id: data.id,
    title: data.title,
    summary: data.summary,
    canonicalUrl: data.canonical_url,
    sourceType: data.source?.type,
    sourceIdentity: data.source?.identity,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    lastCheckedAt: data.last_checked_at,
    categories: effectiveValue(data.classification?.categories) ?? [],
    tags: effectiveValue(data.classification?.tags) ?? [],
    relevance: effectiveRelevance(data.relevance),
    actions: effectiveValue(data.actions) ?? [],
    status: effectiveValue(data.status),
    route: `/knowledge/${data.id}`
  };
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function relationPerspective(edge, currentId) {
  if (!edge.direction || edge.direction === 'undirected') return 'undirected';
  if (edge.direction === 'source_to_target') return currentId === edge.source ? 'outgoing' : 'incoming';
  if (edge.direction === 'target_to_source') return currentId === edge.target ? 'outgoing' : 'incoming';
  return 'undirected';
}

export default {
  watch: ['../../content/knowledge/**/*.md', '../../data/relations.json', '../../data/concepts.json'],
  paths() {
    const cards = loadCards(contentRoot);
    const normalizedCards = cards.map(normalizeCard);
    const cardById = new Map(normalizedCards.map((card) => [card.id, card]));
    const relationIndex = readJson(relationPath, { edges: [] });
    const conceptIndex = readJson(conceptPath, { concepts: [], card_concepts: [] });
    const edges = Array.isArray(relationIndex.edges) ? relationIndex.edges : [];
    const conceptById = new Map(conceptIndex.concepts.map((concept) => [concept.id, concept]));

    return cards.map((card, index) => {
      const data = card.data;
      const relativeCardPath = path.relative(repoRoot, card.filePath).replaceAll('\\', '/');
      const related = edges
        .filter((edge) => edge.source === data.id || edge.target === data.id)
        .map((edge) => {
          const neighborId = edge.source === data.id ? edge.target : edge.source;
          const neighbor = cardById.get(neighborId);
          if (!neighbor) return null;
          return {
            id: neighbor.id,
            title: neighbor.title,
            summary: neighbor.summary,
            route: neighbor.route,
            type: edge.type,
            direction: edge.direction ?? 'undirected',
            perspective: relationPerspective(edge, data.id),
            score: edge.score,
            confidence: edge.confidence ?? edge.score,
            scores: edge.scores ?? null,
            reason: edge.reason ?? null,
            classifier: edge.classifier ?? 'metadata-fallback',
            signals: edge.signals ?? [],
            pinned: edge.pinned ?? false,
            overridden: edge.overridden ?? false
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'zh-TW'));

      const concepts = conceptIndex.card_concepts
        .filter((mapping) => mapping.card_id === data.id)
        .map((mapping) => {
          const concept = conceptById.get(mapping.concept_id);
          if (!concept) return null;
          return {
            id: concept.id,
            label: concept.label,
            type: concept.type,
            origin: concept.origin,
            description: concept.description,
            route: `/concepts/${concept.id}`,
            cardCount: concept.card_count,
            strength: mapping.strength,
            evidence: mapping.evidence ?? []
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.strength - a.strength || b.cardCount - a.cardCount || a.label.localeCompare(b.label, 'zh-TW'));

      return {
        params: {
          id: data.id,
          card: {
            ...normalizedCards[index],
            cardPath: relativeCardPath,
            related,
            concepts
          }
        },
        content: card.body
      };
    });
  }
};
