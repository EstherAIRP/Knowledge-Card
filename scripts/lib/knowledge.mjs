import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';

const TRACKING_KEYS = new Set([
  'fbclid',
  'gclid',
  'mc_cid',
  'mc_eid',
  'ref_src',
  'ref_url'
]);

export const REQUIRED_SECTIONS = [
  '一句話介紹',
  '它解決什麼問題',
  '核心概念',
  '架構與技術',
  '主要功能',
  '技術亮點',
  '限制與風險',
  '與你的相關性',
  '建議怎麼使用',
  '與其他收藏的關聯',
  '使用者備註',
  '更新紀錄'
];

export function slugify(value) {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function cleanTrackingParams(url) {
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith('utm_') || TRACKING_KEYS.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.sort();
}

function isThreadsHost(hostname) {
  const host = hostname.toLowerCase();
  return host === 'threads.com' || host.endsWith('.threads.com') || host === 'threads.net' || host.endsWith('.threads.net');
}

function canonicalizeThreadsPost(parsed) {
  if (!isThreadsHost(parsed.hostname)) return null;
  const parts = parsed.pathname.split('/').filter(Boolean);
  if (parts.length < 3 || !parts[0].startsWith('@') || parts[1].toLowerCase() !== 'post' || !parts[2]) return null;
  const username = decodeURIComponent(parts[0]);
  const shortcode = decodeURIComponent(parts[2]);
  const canonicalUrl = `https://threads.com/${username}/post/${shortcode}`;
  const identity = `threads:${shortcode}`;
  const digest = crypto.createHash('sha256').update(identity).digest('hex').slice(0, 6);
  return {
    sourceType: 'article',
    canonicalUrl,
    identity,
    id: `${slugify(`threads-${shortcode}`) || 'threads-post'}-${digest}`
  };
}

export function canonicalizeSource(rawUrl) {
  const parsed = new URL(rawUrl.trim());
  parsed.hash = '';
  parsed.hostname = parsed.hostname.toLowerCase();

  if (parsed.hostname === 'www.github.com') {
    parsed.hostname = 'github.com';
  }

  if (parsed.hostname === 'github.com') {
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length < 2) {
      throw new Error('GitHub URL must identify a repository as /owner/repo.');
    }

    const owner = decodeURIComponent(parts[0]);
    const repo = decodeURIComponent(parts[1]).replace(/\.git$/i, '');
    if (!owner || !repo) {
      throw new Error('GitHub repository owner/repo is incomplete.');
    }

    const ownerLower = owner.toLowerCase();
    const repoLower = repo.toLowerCase();
    const canonicalUrl = `https://github.com/${owner}/${repo}`;
    const identity = `github:${ownerLower}/${repoLower}`;

    return {
      sourceType: 'github',
      canonicalUrl,
      identity,
      id: slugify(`github-${owner}-${repo}`)
    };
  }

  const threadsPost = canonicalizeThreadsPost(parsed);
  if (threadsPost) return threadsPost;

  if (parsed.hostname.startsWith('www.')) {
    parsed.hostname = parsed.hostname.slice(4);
  }

  cleanTrackingParams(parsed);
  if (parsed.pathname.length > 1) {
    parsed.pathname = parsed.pathname.replace(/\/+$/, '');
  }

  const canonicalUrl = parsed.toString();
  const identity = `url:${canonicalUrl}`;
  const lastSegment = parsed.pathname.split('/').filter(Boolean).at(-1) || 'root';
  const digest = crypto.createHash('sha256').update(identity).digest('hex').slice(0, 8);
  const base = slugify(`${parsed.hostname}-${lastSegment}`) || 'source';

  return {
    sourceType: inferSourceType(parsed),
    canonicalUrl,
    identity,
    id: `${base}-${digest}`
  };
}

function inferSourceType(url) {
  const host = url.hostname.toLowerCase();
  const pathname = url.pathname.toLowerCase();
  if (host === 'arxiv.org' || host.endsWith('.arxiv.org')) return 'paper';
  if (host === 'youtube.com' || host === 'youtu.be') return 'video';
  if (pathname.includes('/docs/') || host.startsWith('docs.')) return 'documentation';
  return 'article';
}

export function parseCardDocument(text, filePath = '<memory>') {
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) {
    throw new Error(`${filePath}: missing YAML frontmatter opening delimiter.`);
  }

  const end = normalized.indexOf('\n---\n', 4);
  if (end === -1) {
    throw new Error(`${filePath}: missing YAML frontmatter closing delimiter.`);
  }

  const frontmatterText = normalized.slice(4, end);
  const data = parseYaml(frontmatterText);
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`${filePath}: frontmatter must parse to an object.`);
  }

  return {
    data,
    body: normalized.slice(end + 5),
    frontmatterText
  };
}

export function walkMarkdownFiles(rootDir) {
  if (!fs.existsSync(rootDir)) return [];
  const result = [];
  const stack = [rootDir];

  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md') {
        result.push(full);
      }
    }
  }

  return result.sort();
}

export function loadCards(contentRoot) {
  const cards = [];
  for (const filePath of walkMarkdownFiles(contentRoot)) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = parseCardDocument(raw, filePath);
    cards.push({ filePath, raw, ...parsed });
  }
  return cards;
}

export function findExistingCard(cards, resolvedSource) {
  const identityMatch = cards.find((card) => card.data?.source?.identity === resolvedSource.identity);
  if (identityMatch) return identityMatch;

  const urlMatch = cards.find((card) => {
    try {
      return canonicalizeSource(card.data.canonical_url).canonicalUrl === resolvedSource.canonicalUrl;
    } catch {
      return card.data.canonical_url === resolvedSource.canonicalUrl;
    }
  });

  return urlMatch || null;
}

export function resolveIngestion(rawUrl, contentRoot, year = new Date().getFullYear()) {
  const source = canonicalizeSource(rawUrl);
  const cards = loadCards(contentRoot);
  const existing = findExistingCard(cards, source);

  return {
    input_url: rawUrl,
    source_type: source.sourceType,
    canonical_url: source.canonicalUrl,
    source_identity: source.identity,
    id: existing?.data?.id || source.id,
    mode: existing ? 'update' : 'create',
    existing_path: existing ? path.relative(process.cwd(), existing.filePath).replaceAll('\\', '/') : null,
    suggested_path: existing
      ? path.relative(process.cwd(), existing.filePath).replaceAll('\\', '/')
      : `content/knowledge/${year}/${source.id}.md`
  };
}

export function extractSection(body, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^## ${escaped}\\s*$`, 'm');
  const match = pattern.exec(body);
  if (!match) return null;

  const start = match.index + match[0].length;
  const tail = body.slice(start);
  const next = /^##\s+/m.exec(tail);
  const end = next ? start + next.index : body.length;
  return body.slice(start, end);
}

export function compareUserOwnedState(before, after) {
  const checks = [
    ['id', before.data.id, after.data.id],
    ['created_at', before.data.created_at, after.data.created_at],
    ['classification.categories.user', before.data?.classification?.categories?.user, after.data?.classification?.categories?.user],
    ['classification.tags.user', before.data?.classification?.tags?.user, after.data?.classification?.tags?.user],
    ['relevance.user', before.data?.relevance?.user, after.data?.relevance?.user],
    ['actions.user', before.data?.actions?.user, after.data?.actions?.user],
    ['status.user', before.data?.status?.user, after.data?.status?.user]
  ];

  const errors = [];
  for (const [name, oldValue, newValue] of checks) {
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      errors.push(`${name} changed but is user/stable-owned.`);
    }
  }

  const oldNotes = extractSection(before.body, '使用者備註');
  const newNotes = extractSection(after.body, '使用者備註');
  if (oldNotes !== newNotes) {
    errors.push('## 使用者備註 changed but is user-owned.');
  }

  return errors;
}
