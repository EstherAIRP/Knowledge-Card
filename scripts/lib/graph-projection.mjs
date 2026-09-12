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

function requireCoordinate(value, label) {
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

function projectLayout(cards, layout) {
  requireObject(layout, 'graph layout index');
  if (layout.schema_version !== 1) {
    throw new Error(`Unsupported graph layout schema_version: ${layout.schema_version}`);
  }
  if (layout.dimensions !== 2) {
    throw new Error(`graph layout dimensions must equal 2; got ${layout.dimensions}`);
  }

  const layoutNodes = requireObject(layout.nodes, 'graph layout nodes');
  if (Number(layout.card_count) !== cards.length) {
    throw new Error(
      `graph layout card_count ${layout.card_count} does not match ${cards.length} Knowledge Cards.`
    );
  }

  const cardIds = new Set(cards.map((card) => card.data.id));
  const positions = new Map();
  for (const card of cards) {
    const cardId = card.data.id;
    if (!Object.prototype.hasOwnProperty.call(layoutNodes, cardId)) {
      throw new Error(`Graph layout is missing card: ${cardId}`);
    }
    const point = requireObject(layoutNodes[cardId], `graph layout node ${cardId}`);
    positions.set(cardId, {
      x: requireCoordinate(point.x, `graph layout node ${cardId}.x`),
      y: requireCoordinate(point.y, `graph layout node ${cardId}.y`)
    });
  }

  for (const cardId of Object.keys(layoutNodes)) {
    if (!cardIds.has(cardId)) {
      throw new Error(`Graph layout references missing card: ${cardId}`);
    }
  }

  return positions;
}

export function projectGraph({ cards, concepts, relations, layout }) {
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
  const cardPositions = projectLayout(cards, layout);
  const cardConceptDegree = new Map();
  const conceptPositionSums = new Map();

  for (const edge of cardConcepts) {
    const cardId = requireString(edge?.card_id, 'card_concepts[].card_id');
    const conceptId = requireString(edge?.concept_id, 'card_concepts[].concept_id');
    if (!cardById.has(cardId)) {
      throw new Error(`Card-concept edge references missing card: ${cardId}`);
    }
    if (!conceptById.has(conceptId)) {
      throw new Error(`Card-concept edge references missing concept: ${conceptId}`);
    }
    const strength = Number(edge?.strength);
    if (!Number.isFinite(strength) || strength <= 0 || strength > 1) {
      throw new Error(`Card-concept edge strength must be within (0, 1]: ${cardId} -> ${conceptId}`);
    }

    cardConceptDegree.set(cardId, (cardConceptDegree.get(cardId) ?? 0) + 1);
    const position = cardPositions.get(cardId);
    const sum = conceptPositionSums.get(conceptId) ?? { x: 0, y: 0, weight: 0 };
    sum.x += position.x * strength;
    sum.y += position.y * strength;
    sum.weight += strength;
    conceptPositionSums.set(conceptId, sum);
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
    ...cards.map((card) => {
      const position = cardPositions.get(card.data.id);
      return {
        id: `card:${card.data.id}`,
        entityId: card.data.id,
        kind: 'card',
        label: card.data.title,
        description: card.data.summary,
        route: `/knowledge/${card.data.id}`,
        degree: cardConceptDegree.get(card.data.id) ?? 0,
        x: position.x,
        y: position.y
      };
    }),
    ...conceptList.map((concept) => {
      const sum = conceptPositionSums.get(concept.id);
      if (!sum || sum.weight <= 0) {
        throw new Error(`Concept has no positioned supporting cards: ${concept.id}`);
      }
      return {
        id: `concept:${concept.id}`,
        entityId: concept.id,
        kind: 'concept',
        conceptType: concept.type,
        label: concept.label,
        description: concept.description,
        route: `/concepts/${concept.id}`,
        degree: concept.card_count,
        x: sum.x / sum.weight,
        y: sum.y / sum.weight
      };
    })
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
      generatedAt: layout.generated_at ?? null,
      method: layout.method,
      metric: layout.metric,
      dimensions: layout.dimensions,
      stress: layout.quality?.stress ?? null,
      embeddingProvider: layout.embedding_provider,
      embeddingModel: layout.embedding_model,
      embeddingInputHash: layout.embedding_input_hash
    },
    stats: {
      cards: cards.length,
      concepts: conceptList.length,
      cardConceptEdges: cardConcepts.length,
      conceptRelations: conceptRelations.length,
      cardRelations: cardRelations.length
    },
    nodes,
    edges
  };
}
