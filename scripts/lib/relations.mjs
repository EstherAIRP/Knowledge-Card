export const PHASE1_RELATION_TYPES = new Set(['related', 'similar_to']);
export const PHASE2_RELATION_TYPES = new Set([
  'similar_to',
  'alternative_to',
  'complements',
  'integrates_with',
  'depends_on',
  'extends',
  'contrasts_with'
]);
export const RELATION_TYPES = new Set([...PHASE1_RELATION_TYPES, ...PHASE2_RELATION_TYPES]);
export const RELATION_DIRECTIONS = new Set(['undirected', 'source_to_target', 'target_to_source']);
export const DIRECTIONAL_RELATION_TYPES = new Set(['depends_on', 'extends']);

export const DEFAULT_RELATION_CONFIG = Object.freeze({
  minScore: 0.28,
  similarToMinScore: 0.58,
  topK: 8,
  weights: Object.freeze({
    categories: 0.45,
    tags: 0.30,
    relevance: 0.20,
    actions: 0.05
  })
});

const RELEVANCE_DIMENSIONS = [
  'ai_rd',
  'aoi_ai',
  'llm_agent',
  'sillytavern_ai_rpg',
  'image_gen'
];

function normalizeToken(value) {
  return String(value ?? '').trim().toLowerCase();
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function tokenMap(values) {
  return new Map(
    asArray(values)
      .map((value) => [normalizeToken(value), String(value).trim()])
      .filter(([key]) => key)
  );
}

export function effectiveValue(wrapper) {
  return wrapper?.user ?? wrapper?.ai ?? null;
}

export function effectiveRelevance(relevance) {
  const ai = relevance?.ai ?? {};
  const user = relevance?.user ?? {};
  return Object.fromEntries(
    Object.keys(ai).map((key) => [key, user[key] ?? ai[key]])
  );
}

export function jaccard(leftValues, rightValues) {
  const left = new Set(asArray(leftValues).map(normalizeToken).filter(Boolean));
  const right = new Set(asArray(rightValues).map(normalizeToken).filter(Boolean));
  const union = new Set([...left, ...right]);
  if (union.size === 0) return 0;

  let intersection = 0;
  for (const value of left) {
    if (right.has(value)) intersection += 1;
  }
  return intersection / union.size;
}

function sharedValues(leftValues, rightValues) {
  const left = tokenMap(leftValues);
  const right = tokenMap(rightValues);
  return [...left.keys()]
    .filter((key) => right.has(key))
    .sort()
    .map((key) => left.get(key));
}

function highRelevanceDimensions(card) {
  const relevance = effectiveRelevance(card?.data?.relevance);
  return RELEVANCE_DIMENSIONS.filter((key) => Number(relevance[key] ?? 0) >= 4);
}

function canonicalPair(source, target) {
  return source.localeCompare(target) <= 0
    ? [source, target]
    : [target, source];
}

export function relationPairKey(source, target) {
  const [left, right] = canonicalPair(source, target);
  return `${left}::${right}`;
}

export function scoreCardPair(leftCard, rightCard, config = DEFAULT_RELATION_CONFIG) {
  const leftId = leftCard?.data?.id;
  const rightId = rightCard?.data?.id;
  if (!leftId || !rightId || leftId === rightId) return null;

  const leftCategories = effectiveValue(leftCard.data?.classification?.categories) ?? [];
  const rightCategories = effectiveValue(rightCard.data?.classification?.categories) ?? [];
  const leftTags = effectiveValue(leftCard.data?.classification?.tags) ?? [];
  const rightTags = effectiveValue(rightCard.data?.classification?.tags) ?? [];
  const leftActions = effectiveValue(leftCard.data?.actions) ?? [];
  const rightActions = effectiveValue(rightCard.data?.actions) ?? [];
  const leftHighRelevance = highRelevanceDimensions(leftCard);
  const rightHighRelevance = highRelevanceDimensions(rightCard);

  const metrics = {
    categories: jaccard(leftCategories, rightCategories),
    tags: jaccard(leftTags, rightTags),
    relevance: jaccard(leftHighRelevance, rightHighRelevance),
    actions: jaccard(leftActions, rightActions)
  };

  const score = Number((
    metrics.categories * config.weights.categories +
    metrics.tags * config.weights.tags +
    metrics.relevance * config.weights.relevance +
    metrics.actions * config.weights.actions
  ).toFixed(4));

  const signals = [
    ...sharedValues(leftCategories, rightCategories).map((value) => `category:${value}`),
    ...sharedValues(leftTags, rightTags).map((value) => `tag:${value}`),
    ...sharedValues(leftHighRelevance, rightHighRelevance).map((value) => `relevance:${value}`),
    ...sharedValues(leftActions, rightActions).map((value) => `action:${value}`)
  ];

  const type = score >= config.similarToMinScore &&
    (metrics.categories >= 0.5 || metrics.tags >= 0.35)
    ? 'similar_to'
    : 'related';

  const [source, target] = canonicalPair(leftId, rightId);
  return { source, target, type, score, metrics, signals };
}

export function buildGeneratedRelations(cards, config = DEFAULT_RELATION_CONFIG) {
  const candidates = [];
  for (let left = 0; left < cards.length; left += 1) {
    for (let right = left + 1; right < cards.length; right += 1) {
      const relation = scoreCardPair(cards[left], cards[right], config);
      if (relation && relation.score >= config.minScore) {
        candidates.push(relation);
      }
    }
  }

  candidates.sort((a, b) =>
    b.score - a.score || relationPairKey(a.source, a.target).localeCompare(relationPairKey(b.source, b.target))
  );

  const degree = new Map();
  const accepted = [];
  for (const relation of candidates) {
    const sourceDegree = degree.get(relation.source) ?? 0;
    const targetDegree = degree.get(relation.target) ?? 0;
    if (sourceDegree >= config.topK || targetDegree >= config.topK) continue;

    accepted.push({
      source: relation.source,
      target: relation.target,
      type: relation.type,
      score: relation.score,
      signals: relation.signals
    });
    degree.set(relation.source, sourceDegree + 1);
    degree.set(relation.target, targetDegree + 1);
  }

  return accepted.sort((a, b) =>
    a.source.localeCompare(b.source) || a.target.localeCompare(b.target)
  );
}

function normalizeManualEdge(edge, fallback = {}) {
  const [source, target] = canonicalPair(String(edge?.source ?? ''), String(edge?.target ?? ''));
  return {
    ...fallback,
    source,
    target,
    type: edge?.type ?? fallback.type ?? 'similar_to',
    direction: edge?.direction ?? fallback.direction ?? 'undirected',
    score: Number(edge?.score ?? fallback.score ?? 1),
    signals: Array.isArray(edge?.signals)
      ? edge.signals
      : fallback.signals ?? ['manual:override'],
    ...(edge?.reason ? { reason: String(edge.reason) } : {}),
    ...(edge?.confidence !== undefined ? { confidence: Number(edge.confidence) } : {})
  };
}

function validateDirection(type, direction, label, errors) {
  if (!RELATION_DIRECTIONS.has(direction)) {
    errors.push(`${label} has unsupported direction: ${direction}`);
    return;
  }
  if (DIRECTIONAL_RELATION_TYPES.has(type) && direction === 'undirected') {
    errors.push(`${label} direction must be directional for ${type}.`);
  }
  if (!DIRECTIONAL_RELATION_TYPES.has(type) && direction !== 'undirected') {
    errors.push(`${label} direction must be undirected for ${type}.`);
  }
}

export function applyRelationOverrides(generatedEdges, overrides = {}) {
  const blocked = new Set(
    asArray(overrides.blocked)
      .filter((edge) => edge?.source && edge?.target)
      .map((edge) => relationPairKey(edge.source, edge.target))
  );

  const edgeMap = new Map();
  for (const edge of generatedEdges) {
    const key = relationPairKey(edge.source, edge.target);
    if (!blocked.has(key)) edgeMap.set(key, { ...edge });
  }

  for (const edge of asArray(overrides.overrides)) {
    if (!edge?.source || !edge?.target) continue;
    const key = relationPairKey(edge.source, edge.target);
    if (blocked.has(key)) continue;
    const existing = edgeMap.get(key) ?? {};
    edgeMap.set(key, {
      ...normalizeManualEdge(edge, existing),
      overridden: true,
      classifier: 'human'
    });
  }

  for (const edge of asArray(overrides.pinned)) {
    if (!edge?.source || !edge?.target) continue;
    const key = relationPairKey(edge.source, edge.target);
    if (blocked.has(key)) continue;
    const existing = edgeMap.get(key) ?? {};
    edgeMap.set(key, {
      ...normalizeManualEdge(edge, existing),
      pinned: true,
      classifier: existing.classifier ?? 'human'
    });
  }

  return [...edgeMap.values()].sort((a, b) =>
    a.source.localeCompare(b.source) || a.target.localeCompare(b.target)
  );
}

export function validateRelationOverrides(overrides, cardIds = new Set()) {
  const errors = [];
  for (const group of ['pinned', 'blocked', 'overrides']) {
    const entries = overrides?.[group] ?? [];
    if (!Array.isArray(entries)) {
      errors.push(`${group} must be an array.`);
      continue;
    }

    for (const [index, edge] of entries.entries()) {
      const label = `${group}[${index}]`;
      if (!edge?.source || !edge?.target) {
        errors.push(`${label} must define source and target.`);
        continue;
      }
      if (edge.source === edge.target) errors.push(`${label} cannot self-reference.`);
      if (cardIds.size > 0 && !cardIds.has(edge.source)) errors.push(`${label} source card does not exist: ${edge.source}`);
      if (cardIds.size > 0 && !cardIds.has(edge.target)) errors.push(`${label} target card does not exist: ${edge.target}`);
      if (edge.type && !RELATION_TYPES.has(edge.type)) errors.push(`${label} has unsupported type: ${edge.type}`);
      if (edge.type && (edge.direction !== undefined || DIRECTIONAL_RELATION_TYPES.has(edge.type))) {
        validateDirection(edge.type, edge.direction ?? 'undirected', label, errors);
      }
      if (edge.score !== undefined && (!Number.isFinite(Number(edge.score)) || Number(edge.score) < 0 || Number(edge.score) > 1)) {
        errors.push(`${label} score must be between 0 and 1.`);
      }
      if (edge.confidence !== undefined && (!Number.isFinite(Number(edge.confidence)) || Number(edge.confidence) < 0 || Number(edge.confidence) > 1)) {
        errors.push(`${label} confidence must be between 0 and 1.`);
      }
    }
  }
  return errors;
}

export function validateRelationIndex(index, cardIds = new Set()) {
  const errors = [];
  if (!index || typeof index !== 'object' || Array.isArray(index)) {
    return ['relation index must be an object.'];
  }
  if (![1, 2].includes(index.schema_version)) errors.push('schema_version must equal 1 or 2.');
  if (!Array.isArray(index.edges)) return [...errors, 'edges must be an array.'];

  const seenPairs = new Set();
  for (const [position, edge] of index.edges.entries()) {
    const label = `edges[${position}]`;
    if (!edge?.source || !edge?.target) {
      errors.push(`${label} must define source and target.`);
      continue;
    }
    if (edge.source === edge.target) errors.push(`${label} cannot self-reference.`);
    if (cardIds.size > 0 && !cardIds.has(edge.source)) errors.push(`${label} source card does not exist: ${edge.source}`);
    if (cardIds.size > 0 && !cardIds.has(edge.target)) errors.push(`${label} target card does not exist: ${edge.target}`);
    if (!RELATION_TYPES.has(edge.type)) errors.push(`${label} has unsupported type: ${edge.type}`);
    if (index.schema_version >= 2 || edge.direction !== undefined) {
      validateDirection(edge.type, edge.direction ?? 'undirected', label, errors);
    }
    if (!Number.isFinite(Number(edge.score)) || Number(edge.score) < 0 || Number(edge.score) > 1) {
      errors.push(`${label} score must be between 0 and 1.`);
    }
    if (!Array.isArray(edge.signals) || edge.signals.some((value) => typeof value !== 'string')) {
      errors.push(`${label} signals must be an array of strings.`);
    }
    if (edge.reason !== undefined && (typeof edge.reason !== 'string' || edge.reason.trim().length === 0 || edge.reason.length > 600)) {
      errors.push(`${label} reason must be a non-empty string up to 600 characters.`);
    }
    if (edge.confidence !== undefined && (!Number.isFinite(Number(edge.confidence)) || Number(edge.confidence) < 0 || Number(edge.confidence) > 1)) {
      errors.push(`${label} confidence must be between 0 and 1.`);
    }
    if (edge.scores !== undefined) {
      for (const key of ['taxonomy', 'semantic', 'llm', 'combined']) {
        const value = edge.scores?.[key];
        if (value !== null && value !== undefined && (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 1)) {
          errors.push(`${label} scores.${key} must be null or between 0 and 1.`);
        }
      }
    }

    const key = relationPairKey(edge.source, edge.target);
    if (seenPairs.has(key)) errors.push(`${label} duplicates relation pair ${key}.`);
    seenPairs.add(key);
  }
  return errors;
}
