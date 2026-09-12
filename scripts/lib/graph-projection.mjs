import fs from 'node:fs';

function requireArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }
  return value;
}

function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value;
}

function requireString(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value;
}

function requireFiniteNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`${label} must be a finite number.`);
  }
  return number;
}

export function readRequiredJson(filePath, { label = filePath } = {}) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required graph input: ${label}`);
  }

  const stat = fs.statSync(filePath);
  if (!stat.isFile() || stat.size === 0) {
    throw new Error(`Graph input is empty or invalid: ${label}`);
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot parse graph input ${label}: ${error.message}`);
  }
}

export function readOptionalJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const stat = fs.statSync(filePath);
  if (!stat.isFile() || stat.size === 0) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function assertUniqueIds(items, getId, label) {
  const seen = new Set();
  for (const item of items) {
    const id = getId(item);
    if (seen.has(id)) {
      throw new Error(`Duplicate ${label} id in graph projection: ${id}`);
    }
    seen.add(id);
  }
}

function conceptCentroid(conceptId, cardConcepts, cardPositions) {
  let xSum = 0;
  let ySum = 0;
  let weightSum = 0;

  for (const edge of cardConcepts) {
    if (edge.concept_id !== conceptId) continue;
    const position = cardPositions.get(edge.card_id);
    if (!position) continue;
    const strength = Number(edge.strength);
    const weight = Number.isFinite(strength) && strength > 0 ? strength : 1;
    xSum += position.x * weight;
    ySum += position.y * weight;
    weightSum += weight;
  }

  return weightSum === 0
    ? { x: null, y: null }
    : { x: xSum / weightSum, y: ySum / weightSum };
}

export function projectGraph({ cards, concepts, relations, layout = null }) {
  requireArray(cards, 'cards');
  requireObject(concepts, 'concepts index');
  requireObject(relations, 'relations index');

  const conceptList = requireArray(concepts.concepts, 'concepts.concepts');
  const cardConcepts = requireArray(concepts.card_concepts, 'concepts.card_concepts');
  const conceptRelations = requireArray(concepts.concept_relations, 'concepts.concept_relations');
  const cardRelations = requireArray(relations.edges, 'relations.edges');

  assertUniqueIds(
    cards,
    (card) => requireString(card?.data?.id, 'card.data.id'),
    'card'
  );
  assertUniqueIds(
    conceptList,
    (concept) => requireString(concept?.id, 'concept.id'),
    'concept'
  );

  const cardById = new Map(cards.map((card) => [card.data.id, card]));
  const conceptById = new Map(conceptList.map((concept) => [concept.id, concept]));
  const cardConceptDegree = new Map();
  const cardPositions = new Map();

  if (layout) {
    requireObject(layout, 'graph layout index');
    const layoutNodes = requireObject(layout.nodes, 'layout.nodes');
    for (const card of cards) {
      const position = requireObject(layoutNodes[card.data.id], `layout.nodes[${card.data.id}]`);
      cardPositions.set(card.data.id, {
        x: requireFiniteNumber(position.x, `layout.nodes[${card.data.id}].x`),
        y: requireFiniteNumber(position.y, `layout.nodes[${card.data.id}].y`)
      });
    }
    for (const layoutCardId of Object.keys(layoutNodes)) {
      if (!cardById.has(layoutCardId)) {
        throw new Error(`Graph layout references missing card: ${layoutCardId}`);
      }
    }
  }

  for (const edge of cardConcepts) {
    const cardId = requireString(edge?.card_id, 'card_concepts[].card_id');
    const conceptId = requireString(edge?.concept_id, 'card_concepts[].concept_id');
    if (!cardById.has(cardId)) {
      throw new Error(`Card-concept edge references missing card: ${cardId}`);
    }
    if (!conceptById.has(conceptId)) {
      throw new Error(`Card-concept edge references missing concept: ${conceptId}`);
    }
    cardConceptDegree.set(cardId, (cardConceptDegree.get(cardId) ?? 0) + 1);
  }

  for (const edge of conceptRelations) {
    const source = requireString(edge?.source, 'concept_relations[].source');
    const target = requireString(edge?.target, 'concept_relations[].target');
    if (!conceptById.has(source)) {
      throw new Error(`Concept relation references missing source concept: ${source}`);
    }
    if (!conceptById.has(target)) {
      throw new Error(`Concept relation references missing target concept: ${target}`);
    }
  }

  for (const edge of cardRelations) {
    const source = requireString(edge?.source, 'relations.edges[].source');
    const target = requireString(edge?.target, 'relations.edges[].target');
    if (!cardById.has(source)) {
      throw new Error(`Card relation references missing source card: ${source}`);
    }
    if (!cardById.has(target)) {
      throw new Error(`Card relation references missing target card: ${target}`);
    }
  }

  const nodes = [
    ...cards.map((card) => ({
      id: `card:${card.data.id}`,
      entityId: card.data.id,
      kind: 'card',
      label: card.data.title,
      description: card.data.summary,
      route: `/knowledge/${card.data.id}`,
      degree: cardConceptDegree.get(card.data.id) ?? 0,
      ...(cardPositions.get(card.data.id) ?? { x: null, y: null })
    })),
    ...conceptList.map((concept) => ({
      id: `concept:${concept.id}`,
      entityId: concept.id,
      kind: 'concept',
      conceptType: concept.type,
      label: concept.label,
      description: concept.description,
      route: `/concepts/${concept.id}`,
      degree: concept.card_count,
      ...conceptCentroid(concept.id, cardConcepts, cardPositions)
    }))
  ];

  const edges = [
    ...cardConcepts.map((edge) => ({
      source: `card:${edge.card_id}`,
      target: `concept:${edge.concept_id}`,
      kind: 'card-concept',
      type: 'has_concept',
      weight: edge.strength,
      evidence: edge.evidence
    })),
    ...conceptRelations.map((edge) => ({
      source: `concept:${edge.source}`,
      target: `concept:${edge.target}`,
      kind: 'concept-concept',
      type: edge.type,
      weight: edge.weight,
      support: edge.support
    })),
    ...cardRelations.map((edge) => ({
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
    layout: {
      generatedAt: layout?.generated_at ?? null,
      method: layout?.method ?? null,
      metric: layout?.metric ?? null,
      stress: layout?.quality?.stress ?? null,
      embeddingModel: layout?.embedding_model ?? null,
      embeddingInputHash: layout?.embedding_input_hash ?? null
    },
    stats: {
      cards: cards.length,
      concepts: conceptList.length,
      cardConceptEdges: cardConcepts.length,
      conceptRelations: conceptRelations.length,
      cardRelations: cardRelations.length,
      positionedCards: cardPositions.size
    },
    nodes,
    edges
  };
}
