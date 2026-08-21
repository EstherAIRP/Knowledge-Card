import { fileURLToPath } from 'node:url';
import { effectiveResourceKind, loadCards } from '../scripts/lib/knowledge.mjs';

const contentRoot = fileURLToPath(new URL('../content/knowledge/', import.meta.url));

function effectiveValue(wrapper) {
  if (!wrapper) return null;
  return wrapper.user ?? wrapper.ai ?? null;
}

function effectiveRelevance(relevance) {
  const ai = relevance?.ai ?? {};
  const user = relevance?.user ?? {};
  return Object.fromEntries(
    Object.keys(ai).map((key) => [key, user[key] ?? ai[key]])
  );
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
    resourceKind: effectiveResourceKind(data),
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

export default {
  watch: ['../content/knowledge/**/*.md'],
  load() {
    return loadCards(contentRoot)
      .map(normalizeCard)
      .sort((a, b) => {
        const byUpdated = String(b.updatedAt).localeCompare(String(a.updatedAt));
        if (byUpdated !== 0) return byUpdated;
        return a.title.localeCompare(b.title, 'zh-TW');
      });
  }
};
