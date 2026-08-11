import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCards } from '../../scripts/lib/knowledge.mjs';

const contentRoot = fileURLToPath(new URL('../../content/knowledge/', import.meta.url));

function effectiveValue(wrapper) {
  return wrapper?.user ?? wrapper?.ai ?? null;
}

function effectiveRelevance(relevance) {
  const ai = relevance?.ai ?? {};
  const user = relevance?.user ?? {};
  return Object.fromEntries(Object.keys(ai).map((key) => [key, user[key] ?? ai[key]]));
}

export default {
  watch: ['../../content/knowledge/**/*.md'],
  paths() {
    return loadCards(contentRoot).map((card) => {
      const data = card.data;
      const relativeCardPath = path.relative(process.cwd(), card.filePath).replaceAll('\\', '/');
      return {
        params: {
          id: data.id,
          card: {
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
            cardPath: relativeCardPath
          }
        },
        content: card.body
      };
    });
  }
};
