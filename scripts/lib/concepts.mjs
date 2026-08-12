import { effectiveValue } from './relations.mjs';

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function normalizeConceptToken(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('en-US')
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

function displayLabel(value) {
  return String(value ?? '').trim();
}

function effectiveCategories(card) {
  return asArray(effectiveValue(card?.data?.classification?.categories));
}

function effectiveTags(card) {
  return asArray(effectiveValue(card?.data?.classification?.tags));
}

function normalizeSet(values) {
  return new Set(asArray(values).map(normalizeConceptToken).filter(Boolean));
}

function evidenceItem(kind, value) {
  return { kind, value: displayLabel(value) };
}

function promotedMatch(card, concept) {
  const categories = effectiveCategories(card);
  const tags = effectiveTags(card);
  const categorySet = normalizeSet(categories);
  const tagSet = normalizeSet(tags);
  const rules = concept?.match ?? {};
  const evidence = [];

  for (const category of asArray(rules.categories_any)) {
    if (categorySet.has(normalizeConceptToken(category))) {
      evidence.push(evidenceItem('category', category));
    }
  }
  for (const tag of asArray(rules.tags_any)) {
    if (tagSet.has(normalizeConceptToken(tag))) {
      evidence.push(evidenceItem('tag', tag));
    }
  }

  const hasRule = asArray(rules.categories_any).length > 0 || asArray(rules.tags_any).length > 0;
  return hasRule && evidence.length > 0 ? evidence : [];
}

function conceptRecord({ id, label, type, description, origin }) {
  return {
    id,
    label,
    type,
    description: description ?? null,
    origin,
    aliases: [],
    card_ids: [],
    card_count: 0
  };
}

function addConcept(concepts, record) {
  const existing = concepts.get(record.id);
  if (!existing) {
    concepts.set(record.id, record);
    return record;
  }
  return existing;
}

function addMapping(mappings, mapping) {
  const key = `${mapping.card_id}::${mapping.concept_id}`;
  const existing = mappings.get(key);
  if (!existing) {
    mappings.set(key, mapping);
    return;
  }
  const evidence = [...existing.evidence, ...mapping.evidence];
  const seen = new Set();
  existing.evidence = evidence.filter((item) => {
    const token = `${item.kind}:${normalizeConceptToken(item.value)}`;
    if (seen.has(token)) return false;
    seen.add(token);
    return true;
  });
  existing.strength = Math.max(existing.strength, mapping.strength);
}

export function buildConceptIndex(cards, config = {}) {
  const extraction = config.extraction ?? {};
  const includeCategories = extraction.include_categories !== false;
  const includeSharedTags = extraction.include_shared_tags !== false;
  const minimumTagSupport = Math.max(2, Number(extraction.minimum_tag_support ?? 2));
  const conceptRelationMinSupport = Math.max(1, Number(extraction.concept_relation_min_support ?? 2));
  const conceptRelationTopK = Math.max(1, Number(extraction.concept_relation_top_k ?? 8));

  const concepts = new Map();
  const mappings = new Map();
  const tagSupport = new Map();
  const tagDisplay = new Map();

  for (const card of cards) {
    const cardId = card.data.id;
    const seenTags = new Set();
    for (const tag of effectiveTags(card)) {
      const token = normalizeConceptToken(tag);
      if (!token || seenTags.has(token)) continue;
      seenTags.add(token);
      if (!tagSupport.has(token)) tagSupport.set(token, new Set());
      tagSupport.get(token).add(cardId);
      if (!tagDisplay.has(token)) tagDisplay.set(token, displayLabel(tag));
    }
  }

  for (const card of cards) {
    const cardId = card.data.id;

    if (includeCategories) {
      for (const category of effectiveCategories(card)) {
        const token = normalizeConceptToken(category);
        if (!token) continue;
        const conceptId = `category-${token}`;
        addConcept(concepts, conceptRecord({
          id: conceptId,
          label: displayLabel(category),
          type: 'category',
          description: `Knowledge Card taxonomy category：${displayLabel(category)}`,
          origin: 'category'
        }));
        addMapping(mappings, {
          card_id: cardId,
          concept_id: conceptId,
          strength: 1,
          evidence: [evidenceItem('category', category)],
          origin: 'category'
        });
      }
    }

    if (includeSharedTags) {
      for (const tag of effectiveTags(card)) {
        const token = normalizeConceptToken(tag);
        const support = tagSupport.get(token)?.size ?? 0;
        if (!token || support < minimumTagSupport) continue;
        const conceptId = `tag-${token}`;
        addConcept(concepts, conceptRecord({
          id: conceptId,
          label: tagDisplay.get(token) ?? displayLabel(tag),
          type: 'topic',
          description: `至少出現在 ${support} 張 Knowledge Cards 的共用技術主題。`,
          origin: 'shared-tag'
        }));
        addMapping(mappings, {
          card_id: cardId,
          concept_id: conceptId,
          strength: 0.9,
          evidence: [evidenceItem('tag', tag)],
          origin: 'shared-tag'
        });
      }
    }

    for (const promoted of asArray(config.promoted_concepts)) {
      const evidence = promotedMatch(card, promoted);
      if (evidence.length === 0) continue;
      const conceptId = normalizeConceptToken(promoted.id);
      if (!conceptId) continue;
      addConcept(concepts, conceptRecord({
        id: conceptId,
        label: promoted.label ?? promoted.id,
        type: promoted.type ?? 'concept',
        description: promoted.description ?? null,
        origin: 'promoted'
      }));
      addMapping(mappings, {
        card_id: cardId,
        concept_id: conceptId,
        strength: Number(Math.min(1, 0.72 + Math.min(0.24, evidence.length * 0.06)).toFixed(4)),
        evidence,
        origin: 'promoted'
      });
    }
  }

  const mappingList = [...mappings.values()].sort((a, b) =>
    a.card_id.localeCompare(b.card_id) || a.concept_id.localeCompare(b.concept_id)
  );

  const cardsByConcept = new Map();
  for (const mapping of mappingList) {
    if (!cardsByConcept.has(mapping.concept_id)) cardsByConcept.set(mapping.concept_id, new Set());
    cardsByConcept.get(mapping.concept_id).add(mapping.card_id);
  }

  const conceptList = [...concepts.values()]
    .map((concept) => {
      const cardIds = [...(cardsByConcept.get(concept.id) ?? new Set())].sort();
      return { ...concept, card_ids: cardIds, card_count: cardIds.length };
    })
    .filter((concept) => concept.card_count > 0)
    .sort((a, b) => b.card_count - a.card_count || a.label.localeCompare(b.label, 'zh-TW'));

  const validConceptIds = new Set(conceptList.map((concept) => concept.id));
  const filteredMappings = mappingList.filter((mapping) => validConceptIds.has(mapping.concept_id));
  const conceptIdsByCard = new Map();
  for (const mapping of filteredMappings) {
    if (!conceptIdsByCard.has(mapping.card_id)) conceptIdsByCard.set(mapping.card_id, []);
    conceptIdsByCard.get(mapping.card_id).push(mapping.concept_id);
  }

  const pairSupport = new Map();
  for (const [cardId, ids] of conceptIdsByCard) {
    const unique = [...new Set(ids)].sort();
    for (let left = 0; left < unique.length; left += 1) {
      for (let right = left + 1; right < unique.length; right += 1) {
        const key = `${unique[left]}::${unique[right]}`;
        if (!pairSupport.has(key)) pairSupport.set(key, { source: unique[left], target: unique[right], card_ids: [] });
        pairSupport.get(key).card_ids.push(cardId);
      }
    }
  }

  const conceptById = new Map(conceptList.map((concept) => [concept.id, concept]));
  const relationCandidates = [...pairSupport.values()]
    .map((pair) => {
      const support = pair.card_ids.length;
      const sourceCount = conceptById.get(pair.source)?.card_count ?? 1;
      const targetCount = conceptById.get(pair.target)?.card_count ?? 1;
      const weight = Number((support / Math.min(sourceCount, targetCount)).toFixed(4));
      return {
        source: pair.source,
        target: pair.target,
        type: 'co_occurs_with',
        support,
        weight,
        card_ids: pair.card_ids.sort()
      };
    })
    .filter((edge) => edge.support >= conceptRelationMinSupport)
    .sort((a, b) => b.weight - a.weight || b.support - a.support || `${a.source}::${a.target}`.localeCompare(`${b.source}::${b.target}`));

  const degree = new Map();
  const conceptRelations = [];
  for (const edge of relationCandidates) {
    const sourceDegree = degree.get(edge.source) ?? 0;
    const targetDegree = degree.get(edge.target) ?? 0;
    if (sourceDegree >= conceptRelationTopK || targetDegree >= conceptRelationTopK) continue;
    conceptRelations.push(edge);
    degree.set(edge.source, sourceDegree + 1);
    degree.set(edge.target, targetDegree + 1);
  }

  conceptRelations.sort((a, b) => a.source.localeCompare(b.source) || a.target.localeCompare(b.target));

  return {
    concepts: conceptList,
    card_concepts: filteredMappings,
    concept_relations: conceptRelations,
    stats: {
      card_count: cards.length,
      concept_count: conceptList.length,
      card_concept_edge_count: filteredMappings.length,
      concept_relation_edge_count: conceptRelations.length
    }
  };
}

export function validateConceptIndex(index, cardIds = new Set()) {
  const errors = [];
  if (!index || typeof index !== 'object' || Array.isArray(index)) return ['concept index must be an object.'];
  if (index.schema_version !== 1) errors.push('concept index schema_version must equal 1.');
  if (!Array.isArray(index.concepts)) errors.push('concept index concepts must be an array.');
  if (!Array.isArray(index.card_concepts)) errors.push('concept index card_concepts must be an array.');
  if (!Array.isArray(index.concept_relations)) errors.push('concept index concept_relations must be an array.');
  if (errors.length) return errors;

  const conceptIds = new Set();
  for (const concept of index.concepts) {
    if (!concept?.id || typeof concept.id !== 'string') errors.push('concept id must be a non-empty string.');
    if (conceptIds.has(concept.id)) errors.push(`duplicate concept id: ${concept.id}`);
    conceptIds.add(concept.id);
    if (!concept.label || typeof concept.label !== 'string') errors.push(`concept ${concept.id} requires label.`);
    if (!Number.isInteger(concept.card_count) || concept.card_count < 1) errors.push(`concept ${concept.id} card_count must be >= 1.`);
    if (!Array.isArray(concept.card_ids) || concept.card_ids.length !== concept.card_count) errors.push(`concept ${concept.id} card_ids/card_count mismatch.`);
    for (const cardId of concept.card_ids ?? []) {
      if (!cardIds.has(cardId)) errors.push(`concept ${concept.id} references unknown card ${cardId}.`);
    }
  }

  const mappingKeys = new Set();
  for (const mapping of index.card_concepts) {
    const key = `${mapping.card_id}::${mapping.concept_id}`;
    if (mappingKeys.has(key)) errors.push(`duplicate card-concept mapping: ${key}`);
    mappingKeys.add(key);
    if (!cardIds.has(mapping.card_id)) errors.push(`card-concept mapping references unknown card ${mapping.card_id}.`);
    if (!conceptIds.has(mapping.concept_id)) errors.push(`card-concept mapping references unknown concept ${mapping.concept_id}.`);
    if (!Number.isFinite(Number(mapping.strength)) || Number(mapping.strength) < 0 || Number(mapping.strength) > 1) errors.push(`card-concept mapping ${key} strength must be between 0 and 1.`);
    if (!Array.isArray(mapping.evidence) || mapping.evidence.length === 0) errors.push(`card-concept mapping ${key} requires evidence.`);
  }

  const relationKeys = new Set();
  for (const edge of index.concept_relations) {
    if (!conceptIds.has(edge.source) || !conceptIds.has(edge.target)) errors.push(`concept relation references unknown concept: ${edge.source} -> ${edge.target}`);
    if (edge.source === edge.target) errors.push(`concept relation cannot self-reference: ${edge.source}`);
    const key = [edge.source, edge.target].sort().join('::');
    if (relationKeys.has(key)) errors.push(`duplicate concept relation: ${key}`);
    relationKeys.add(key);
    if (edge.type !== 'co_occurs_with') errors.push(`unsupported concept relation type: ${edge.type}`);
    if (!Number.isInteger(edge.support) || edge.support < 1) errors.push(`concept relation ${key} support must be >= 1.`);
    if (!Number.isFinite(Number(edge.weight)) || Number(edge.weight) < 0 || Number(edge.weight) > 1) errors.push(`concept relation ${key} weight must be between 0 and 1.`);
  }

  const mappedCounts = new Map();
  for (const mapping of index.card_concepts) mappedCounts.set(mapping.concept_id, (mappedCounts.get(mapping.concept_id) ?? 0) + 1);
  for (const concept of index.concepts) {
    if ((mappedCounts.get(concept.id) ?? 0) !== concept.card_count) errors.push(`concept ${concept.id} mapping count does not match card_count.`);
  }

  return errors;
}
