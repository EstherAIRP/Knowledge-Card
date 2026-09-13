function normalizeList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [...value];
}

function intersects(values, selected) {
  if (!selected?.length) return true;
  const valueSet = new Set(values ?? []);
  return selected.some((item) => valueSet.has(item));
}

function scalarMatches(value, selected) {
  if (!selected?.length) return true;
  return selected.includes(value);
}

function normalizeSearchQuery(query) {
  return String(query ?? '').trim().toLocaleLowerCase('zh-TW');
}

function edgeCardId(edge) {
  if (edge?.source?.startsWith('card:')) return edge.source.slice(5);
  if (edge?.target?.startsWith('card:')) return edge.target.slice(5);
  return null;
}

function edgeConceptId(edge) {
  if (edge?.source?.startsWith('concept:')) return edge.source;
  if (edge?.target?.startsWith('concept:')) return edge.target;
  return null;
}

function connectedConceptIdsForCards(edges, cardIds) {
  const conceptIds = new Set();
  for (const edge of edges ?? []) {
    if (edge.kind !== 'card-concept') continue;
    const cardId = edgeCardId(edge);
    const conceptId = edgeConceptId(edge);
    if (cardId && conceptId && cardIds.has(cardId)) conceptIds.add(conceptId);
  }
  return conceptIds;
}

export function nodeMatchesGraphSearch(node, query) {
  const needle = normalizeSearchQuery(query);
  if (!needle) return false;

  const searchable = [
    node?.label,
    node?.description,
    node?.conceptType,
    ...(node?.tags ?? []),
    ...(node?.categories ?? []),
    ...(node?.actions ?? []),
    node?.sourceType,
    node?.resourceKind
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase('zh-TW');

  return searchable.includes(needle);
}

export function collectGraphFacets(nodes) {
  const cards = (nodes ?? []).filter((node) => node.kind === 'card');
  const collectMany = (key) => [...new Set(cards.flatMap((node) => node[key] ?? []))]
    .filter(Boolean)
    .sort((a, b) => String(a).localeCompare(String(b), 'zh-TW'));
  const collectOne = (key) => [...new Set(cards.map((node) => node[key]).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b), 'zh-TW'));

  const tagCounts = new Map();
  for (const card of cards) {
    for (const tag of card.tags ?? []) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  return {
    categories: collectMany('categories'),
    actions: collectMany('actions'),
    tags: [...tagCounts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'zh-TW'))
      .map(([value, count]) => ({ value, count })),
    sourceTypes: collectOne('sourceType'),
    resourceKinds: collectOne('resourceKind')
  };
}

export function buildCardRelationTypes(edges) {
  const relationTypesByCard = new Map();
  for (const edge of edges ?? []) {
    if (edge.kind !== 'card-card') continue;
    const source = edge.source?.replace(/^card:/, '');
    const target = edge.target?.replace(/^card:/, '');
    if (!source || !target) continue;

    if (!relationTypesByCard.has(source)) relationTypesByCard.set(source, new Set());
    if (!relationTypesByCard.has(target)) relationTypesByCard.set(target, new Set());
    relationTypesByCard.get(source).add(edge.type);
    relationTypesByCard.get(target).add(edge.type);
  }
  return relationTypesByCard;
}

export function semanticAllowedCardIds({
  selectedCardId,
  semantic,
  mode = 'top',
  topN = 6,
  maxDistance = 0.3
}) {
  if (!selectedCardId) return null;

  const allowed = new Set([selectedCardId]);
  const allDistances = semantic?.distancesByCard?.[selectedCardId] ?? [];

  if (mode === 'distance') {
    for (const item of allDistances) {
      if (Number(item.distance) <= Number(maxDistance)) allowed.add(item.cardId);
    }
    return allowed;
  }

  const safeTopN = Math.max(1, Number(topN) || 1);
  for (const item of allDistances.slice(0, safeTopN)) allowed.add(item.cardId);
  return allowed;
}

export function cardMatchesFilters(
  node,
  filters,
  {
    relationTypesByCard = new Map(),
    semanticAllowedIds = null
  } = {}
) {
  if (node?.kind !== 'card') return false;

  const categories = normalizeList(filters?.categories);
  const actions = normalizeList(filters?.actions);
  const tags = normalizeList(filters?.tags);
  const sourceTypes = normalizeList(filters?.sourceTypes);
  const resourceKinds = normalizeList(filters?.resourceKinds);
  const relationTypes = normalizeList(filters?.relationTypes);
  const minimumRelevance = Number(filters?.minimumRelevance ?? 1);

  if (!intersects(node.categories ?? [], categories)) return false;
  if (!intersects(node.actions ?? [], actions)) return false;
  if (!intersects(node.tags ?? [], tags)) return false;
  if (!scalarMatches(node.sourceType ?? null, sourceTypes)) return false;
  if (!scalarMatches(node.resourceKind ?? null, resourceKinds)) return false;

  const overall = Number(node.relevance?.overall ?? 0);
  if (Number.isFinite(minimumRelevance) && overall < minimumRelevance) return false;

  if (relationTypes.length) {
    const nodeRelationTypes = relationTypesByCard.get(node.entityId) ?? new Set();
    if (!relationTypes.some((type) => nodeRelationTypes.has(type))) return false;
  }

  if (semanticAllowedIds && !semanticAllowedIds.has(node.entityId)) return false;

  return true;
}

export function matchingCardIds({ nodes, edges, semantic, selectedCardId, filters }) {
  const relationTypesByCard = buildCardRelationTypes(edges);
  const semanticAllowedIds = filters?.semanticEnabled
    ? semanticAllowedCardIds({
        selectedCardId,
        semantic,
        mode: filters.semanticMode,
        topN: filters.semanticTopN,
        maxDistance: filters.semanticMaxDistance
      })
    : null;

  return new Set(
    (nodes ?? [])
      .filter((node) => cardMatchesFilters(node, filters, {
        relationTypesByCard,
        semanticAllowedIds
      }))
      .map((node) => node.entityId)
  );
}

export function matchingGraphResults({
  nodes,
  edges,
  semantic,
  selectedCardId,
  filters,
  query
}) {
  const filteredCardIds = matchingCardIds({
    nodes,
    edges,
    semantic,
    selectedCardId,
    filters
  });
  const needle = normalizeSearchQuery(query);

  if (!needle) {
    return {
      needle,
      cardIds: filteredCardIds,
      directNodeIds: new Set(),
      contextConceptNodeIds: connectedConceptIdsForCards(edges, filteredCardIds)
    };
  }

  const directNodeIds = new Set();
  const searchCardIds = new Set();
  const directConceptNodeIds = new Set();

  for (const node of nodes ?? []) {
    if (!nodeMatchesGraphSearch(node, needle)) continue;
    directNodeIds.add(node.id);
    if (node.kind === 'card') searchCardIds.add(node.entityId);
    if (node.kind === 'concept') directConceptNodeIds.add(node.id);
  }

  for (const edge of edges ?? []) {
    if (edge.kind !== 'card-concept') continue;
    const conceptId = edgeConceptId(edge);
    const cardId = edgeCardId(edge);
    if (conceptId && cardId && directConceptNodeIds.has(conceptId)) {
      searchCardIds.add(cardId);
    }
  }

  const cardIds = new Set(
    [...filteredCardIds].filter((cardId) => searchCardIds.has(cardId))
  );
  const contextConceptNodeIds = connectedConceptIdsForCards(edges, cardIds);
  for (const conceptId of directConceptNodeIds) contextConceptNodeIds.add(conceptId);

  return {
    needle,
    cardIds,
    directNodeIds,
    contextConceptNodeIds
  };
}

export function activeFilterCount(filters) {
  let count = 0;
  for (const key of ['categories', 'actions', 'tags', 'sourceTypes', 'resourceKinds', 'relationTypes']) {
    if (normalizeList(filters?.[key]).length) count += 1;
  }
  if (Number(filters?.minimumRelevance ?? 1) > 1) count += 1;
  if (filters?.semanticEnabled) count += 1;
  return count;
}
