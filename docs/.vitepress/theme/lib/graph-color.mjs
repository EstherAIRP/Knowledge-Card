export const GRAPH_COLOR_PALETTE = Object.freeze([
  '#2563eb',
  '#7c3aed',
  '#0891b2',
  '#059669',
  '#ca8a04',
  '#ea580c',
  '#dc2626',
  '#db2777',
  '#4f46e5',
  '#475569'
]);

export const RELEVANCE_COLORS = Object.freeze({
  1: '#cbd5e1',
  2: '#94a3b8',
  3: '#38bdf8',
  4: '#2563eb',
  5: '#7c3aed'
});

function stableHash(value) {
  let hash = 2166136261;
  const text = String(value ?? '');
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function categoricalColor(value) {
  if (!value) return '#64748b';
  return GRAPH_COLOR_PALETTE[stableHash(value) % GRAPH_COLOR_PALETTE.length];
}

export function relevanceColor(value) {
  const score = Math.max(1, Math.min(5, Math.round(Number(value) || 1)));
  return RELEVANCE_COLORS[score];
}

export function cardColorKey(node, mode) {
  if (node?.kind !== 'card') return null;
  if (mode === 'category') return node.categories?.[0] ?? '未分類';
  if (mode === 'action') return node.actions?.[0] ?? '無 Action';
  if (mode === 'relevance') return String(Math.max(1, Math.min(5, Math.round(Number(node.relevance?.overall) || 1))));
  return null;
}

export function cardColor(node, mode) {
  const key = cardColorKey(node, mode);
  if (!key || mode === 'none') return '#64748b';
  return mode === 'relevance' ? relevanceColor(key) : categoricalColor(key);
}

export function colorLegend(nodes, mode) {
  if (mode === 'none') return [];
  if (mode === 'relevance') {
    return [1, 2, 3, 4, 5].map((score) => ({
      key: String(score),
      label: `Relevance ${score}`,
      color: relevanceColor(score)
    }));
  }

  const values = [...new Set(
    (nodes ?? [])
      .filter((node) => node.kind === 'card')
      .map((node) => cardColorKey(node, mode))
      .filter(Boolean)
  )].sort((left, right) => left.localeCompare(right, 'zh-TW'));

  return values.map((value) => ({
    key: value,
    label: value,
    color: categoricalColor(value)
  }));
}
