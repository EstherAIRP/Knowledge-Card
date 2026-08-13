import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const THREADS_SOURCE_SNAPSHOT_SCHEMA_VERSION = 1;

function sha256(value) {
  return crypto.createHash('sha256').update(String(value ?? ''), 'utf8').digest('hex');
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
}

function stableJson(value) {
  return JSON.stringify(stableValue(value));
}

function normalizeText(value) {
  if (value === undefined || value === null) return '';
  return String(value).replace(/\r\n?/g, '\n').trim();
}

function normalizeUrl(value, { dropQuery = false } = {}) {
  if (!value) return null;
  try {
    const url = new URL(String(value));
    url.hash = '';
    if (dropQuery) {
      url.search = '';
    } else {
      const entries = [...url.searchParams.entries()].sort(([aKey, aValue], [bKey, bValue]) =>
        aKey.localeCompare(bKey) || aValue.localeCompare(bValue));
      url.search = '';
      for (const [key, item] of entries) url.searchParams.append(key, item);
    }
    return url.toString();
  } catch {
    return String(value).trim() || null;
  }
}

function normalizeMedia(media) {
  return (Array.isArray(media) ? media : []).map((item) => ({
    id: item?.id ? String(item.id) : null,
    type: item?.type || 'unknown',
    // Meta CDN signatures are volatile. Path identity is materially more stable.
    url: normalizeUrl(item?.url, { dropQuery: true }),
    thumbnail_url: normalizeUrl(item?.thumbnail_url, { dropQuery: true }),
    width: Number.isFinite(Number(item?.width)) ? Number(item.width) : null,
    height: Number.isFinite(Number(item?.height)) ? Number(item.height) : null
  }));
}

function normalizeReference(reference) {
  if (!reference || typeof reference !== 'object') return null;
  return {
    id: reference.id ? String(reference.id) : null,
    shortcode: reference.shortcode ? String(reference.shortcode) : null,
    username: reference.username ? String(reference.username) : null,
    permalink: normalizeUrl(reference.permalink),
    text_hash: sha256(normalizeText(reference.text))
  };
}

function partKey(part) {
  if (part?.id) return `id:${part.id}`;
  if (part?.shortcode) return `shortcode:${part.shortcode}`;
  if (part?.canonical_url) return `url:${part.canonical_url}`;
  return `index:${part?.index ?? 'unknown'}`;
}

function buildPartSnapshot(part, index) {
  const textHash = sha256(normalizeText(part?.text));
  const mediaShape = normalizeMedia(part?.media);
  const mediaHash = sha256(stableJson(mediaShape));
  const referencesShape = {
    quoted_post: normalizeReference(part?.quoted_post),
    reposted_post: normalizeReference(part?.reposted_post),
    link_attachment_url: normalizeUrl(part?.link_attachment_url),
    alt_text_hash: sha256(normalizeText(part?.alt_text))
  };
  const referencesHash = sha256(stableJson(referencesShape));
  const structureShape = {
    id: part?.id ? String(part.id) : null,
    shortcode: part?.shortcode ? String(part.shortcode) : null,
    canonical_url: normalizeUrl(part?.canonical_url),
    reply_to: part?.reply_to ? String(part.reply_to) : null,
    root_post: part?.root_post ? String(part.root_post) : null
  };
  const structureHash = sha256(stableJson(structureShape));
  const contentHash = sha256(stableJson({ textHash, mediaHash, referencesHash }));

  return {
    index: Number.isInteger(Number(part?.index)) ? Number(part.index) : index + 1,
    key: partKey(part),
    id: part?.id ? String(part.id) : null,
    shortcode: part?.shortcode ? String(part.shortcode) : null,
    canonical_url: normalizeUrl(part?.canonical_url),
    timestamp: part?.timestamp || null,
    reply_to: part?.reply_to ? String(part.reply_to) : null,
    root_post: part?.root_post ? String(part.root_post) : null,
    text_hash: textHash,
    media_hash: mediaHash,
    references_hash: referencesHash,
    structure_hash: structureHash,
    content_hash: contentHash
  };
}

function assertCompleteThreadsSource(source) {
  if (source?.provider !== 'threads' || !source?.source_identity || !source?.canonical_url) {
    const error = new Error('Threads source snapshot requires a normalized Threads source with canonical identity.');
    error.code = 'THREADS_SNAPSHOT_INVALID_SOURCE';
    throw error;
  }
  if (!source?.thread?.complete || !source?.extraction?.conversation_complete || !Array.isArray(source?.parts) || !source.parts.length) {
    const error = new Error('Threads source snapshot requires a verified complete conversation.');
    error.code = 'THREADS_SNAPSHOT_INCOMPLETE_SOURCE';
    throw error;
  }
}

export function buildThreadsSourceSnapshot(source, options = {}) {
  assertCompleteThreadsSource(source);
  const parts = source.parts.map(buildPartSnapshot);
  const sourceShape = {
    source_identity: source.source_identity,
    canonical_url: normalizeUrl(source.canonical_url),
    root_post_id: source.root_post_id ? String(source.root_post_id) : null,
    root_shortcode: source.root_shortcode || source.shortcode || null,
    author: source.author || source.username || null,
    thread_total: source.thread.total || parts.length,
    parts: parts.map((part) => ({
      key: part.key,
      index: part.index,
      id: part.id,
      shortcode: part.shortcode,
      canonical_url: part.canonical_url,
      reply_to: part.reply_to,
      root_post: part.root_post,
      content_hash: part.content_hash,
      structure_hash: part.structure_hash
    }))
  };

  return {
    schema_version: THREADS_SOURCE_SNAPSHOT_SCHEMA_VERSION,
    provider: 'threads',
    source_identity: source.source_identity,
    canonical_url: normalizeUrl(source.canonical_url),
    root_post_id: source.root_post_id ? String(source.root_post_id) : null,
    root_shortcode: source.root_shortcode || source.shortcode || null,
    author: source.author || source.username || null,
    thread_total: source.thread.total || parts.length,
    captured_at: options.capturedAt || new Date().toISOString(),
    source_hash: sha256(stableJson(sourceShape)),
    parts
  };
}

function assertSnapshot(snapshot) {
  if (!snapshot || snapshot.schema_version !== THREADS_SOURCE_SNAPSHOT_SCHEMA_VERSION || snapshot.provider !== 'threads'
    || typeof snapshot.source_identity !== 'string' || typeof snapshot.source_hash !== 'string' || !Array.isArray(snapshot.parts)) {
    const error = new Error('Threads source snapshot file is invalid or uses an unsupported schema.');
    error.code = 'THREADS_SNAPSHOT_INVALID';
    throw error;
  }
}

function compactPart(part) {
  return {
    key: part.key,
    index: part.index,
    id: part.id || null,
    shortcode: part.shortcode || null,
    canonical_url: part.canonical_url || null
  };
}

function changedFields(previous, current) {
  const fields = [];
  if (previous.text_hash !== current.text_hash) fields.push('text');
  if (previous.media_hash !== current.media_hash) fields.push('media');
  if (previous.references_hash !== current.references_hash) fields.push('references');
  if (previous.structure_hash !== current.structure_hash) fields.push('structure');
  return fields;
}

export function compareThreadsSourceSnapshots(previous, current) {
  assertSnapshot(current);
  if (!previous) {
    return {
      status: 'FIRST_SEEN',
      changed: false,
      material: false,
      previous_total: null,
      current_total: current.parts.length,
      added_parts: current.parts.map(compactPart),
      removed_parts: [],
      changed_parts: [],
      order_changed: false,
      previous_source_hash: null,
      current_source_hash: current.source_hash
    };
  }
  assertSnapshot(previous);
  if (previous.source_identity !== current.source_identity) {
    const error = new Error(`Threads source snapshot identity mismatch: ${previous.source_identity} != ${current.source_identity}.`);
    error.code = 'THREADS_SNAPSHOT_IDENTITY_MISMATCH';
    throw error;
  }

  if (previous.source_hash === current.source_hash) {
    return {
      status: 'UNCHANGED',
      changed: false,
      material: false,
      previous_total: previous.parts.length,
      current_total: current.parts.length,
      added_parts: [],
      removed_parts: [],
      changed_parts: [],
      order_changed: false,
      previous_source_hash: previous.source_hash,
      current_source_hash: current.source_hash
    };
  }

  const previousByKey = new Map(previous.parts.map((part) => [part.key, part]));
  const currentByKey = new Map(current.parts.map((part) => [part.key, part]));
  const added = current.parts.filter((part) => !previousByKey.has(part.key));
  const removed = previous.parts.filter((part) => !currentByKey.has(part.key));
  const changed = [];

  for (const part of current.parts) {
    const prior = previousByKey.get(part.key);
    if (!prior) continue;
    const fields = changedFields(prior, part);
    if (fields.length) changed.push({ ...compactPart(part), fields });
  }

  const previousCommonOrder = previous.parts.filter((part) => currentByKey.has(part.key)).map((part) => part.key);
  const currentCommonOrder = current.parts.filter((part) => previousByKey.has(part.key)).map((part) => part.key);
  const orderChanged = previousCommonOrder.join('\u0000') !== currentCommonOrder.join('\u0000');
  const previousKeys = previous.parts.map((part) => part.key);
  const currentKeys = current.parts.map((part) => part.key);
  const appendOnly = added.length > 0
    && removed.length === 0
    && changed.length === 0
    && !orderChanged
    && previousKeys.every((key, index) => currentKeys[index] === key);

  const signalCount = Number(added.length > 0) + Number(removed.length > 0) + Number(changed.length > 0) + Number(orderChanged);
  let status = 'STRUCTURE_CHANGED';
  if (appendOnly) status = 'THREAD_EXTENDED';
  else if (removed.length > 0 && added.length === 0 && changed.length === 0 && !orderChanged) status = 'PART_REMOVED';
  else if (changed.length > 0 && added.length === 0 && removed.length === 0 && !orderChanged) status = 'PART_CHANGED';
  else if (signalCount > 1) status = 'MULTIPLE_CHANGES';

  return {
    status,
    changed: true,
    material: true,
    previous_total: previous.parts.length,
    current_total: current.parts.length,
    added_parts: added.map(compactPart),
    removed_parts: removed.map(compactPart),
    changed_parts: changed,
    order_changed: orderChanged,
    previous_source_hash: previous.source_hash,
    current_source_hash: current.source_hash
  };
}

export function defaultThreadsSnapshotRoot(contentRoot) {
  if (!contentRoot) return null;
  const resolved = path.resolve(contentRoot);
  const contentDir = path.dirname(resolved);
  if (path.basename(resolved) !== 'knowledge' || path.basename(contentDir) !== 'content') return null;
  return path.join(path.dirname(contentDir), 'state', 'source-snapshots', 'threads');
}

export function threadsSnapshotPath(stateRoot, sourceIdentity) {
  if (!stateRoot || !sourceIdentity) return null;
  const rawLabel = String(sourceIdentity).replace(/^threads(?:-id)?:/i, '');
  const label = rawLabel.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'source';
  return path.join(path.resolve(stateRoot), `${label}-${sha256(sourceIdentity).slice(0, 12)}.json`);
}

export function readThreadsSourceSnapshot(stateRoot, sourceIdentity) {
  const filePath = threadsSnapshotPath(stateRoot, sourceIdentity);
  if (!filePath || !fs.existsSync(filePath)) return { snapshot: null, path: filePath };
  let snapshot;
  try {
    snapshot = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (cause) {
    const error = new Error(`Threads source snapshot could not be read: ${filePath}`);
    error.code = 'THREADS_SNAPSHOT_READ_FAILED';
    error.cause = cause;
    throw error;
  }
  assertSnapshot(snapshot);
  if (snapshot.source_identity !== sourceIdentity) {
    const error = new Error(`Threads snapshot at ${filePath} belongs to ${snapshot.source_identity}, expected ${sourceIdentity}.`);
    error.code = 'THREADS_SNAPSHOT_IDENTITY_MISMATCH';
    throw error;
  }
  return { snapshot, path: filePath };
}

export function inspectThreadsSourceChange(source, stateRoot, options = {}) {
  const current = buildThreadsSourceSnapshot(source, options);
  const previous = readThreadsSourceSnapshot(stateRoot, source.source_identity);
  return {
    ...compareThreadsSourceSnapshots(previous.snapshot, current),
    snapshot_path: previous.path,
    baseline_exists: Boolean(previous.snapshot),
    current_snapshot: current
  };
}

export function writeThreadsSourceSnapshot(source, stateRoot, options = {}) {
  if (!stateRoot) {
    const error = new Error('Threads snapshot state root is required.');
    error.code = 'THREADS_SNAPSHOT_ROOT_REQUIRED';
    throw error;
  }
  const current = buildThreadsSourceSnapshot(source, options);
  const previous = readThreadsSourceSnapshot(stateRoot, source.source_identity);
  const change = compareThreadsSourceSnapshots(previous.snapshot, current);
  const filePath = previous.path || threadsSnapshotPath(stateRoot, source.source_identity);

  if (previous.snapshot?.source_hash === current.source_hash) {
    return { path: filePath, written: false, snapshot: previous.snapshot, change };
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(current, null, 2)}\n`, 'utf8');
  return { path: filePath, written: true, snapshot: current, change };
}
