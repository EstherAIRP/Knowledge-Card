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

export function activeFilterCount(filters) {
  let count = 0;
  for (const key of ['categories', 'actions', 'tags', 'sourceTypes', 'resourceKinds', 'relationTypes']) {
    if (normalizeList(filters?.[key]).length) count += 1;
  }
  if (Number(filters?.minimumRelevance ?? 1) > 1) count += 1;
  if (filters?.semanticEnabled) count += 1;
  return count;
}
