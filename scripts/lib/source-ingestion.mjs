import path from 'node:path';
import { canonicalizeSource, resolveIngestion } from './knowledge.mjs';
import { extractExternalSource } from './source-extraction.mjs';
import { resolveExternalSourceUrl } from './source-resolution.mjs';
import {
  defaultThreadsSnapshotRoot,
  inspectThreadsSourceChange
} from './sources/threads/source-state.mjs';

function resolutionSummary(external) {
  return external?.provider
    ? {
        provider: external.provider,
        input_kind: external.input_kind,
        method: external.method,
        transient: external.transient,
        redirect_count: external.redirect_count
      }
    : null;
}

function assertCompleteThreadsSource(source) {
  if (!source?.thread?.complete || !source?.extraction?.conversation_complete) {
    const error = new Error('Threads primary source is not a verified complete conversation.');
    error.code = 'THREADS_PRIMARY_SOURCE_INCOMPLETE';
    error.partial = source || null;
    throw error;
  }
  const hasText = typeof source?.combined_text === 'string' && source.combined_text.trim().length > 0;
  const hasMedia = Array.isArray(source?.parts) && source.parts.some((part) => Array.isArray(part?.media) && part.media.length > 0);
  if (!source.canonical_url || !source.source_identity || (!hasText && !hasMedia)) {
    const error = new Error('Threads complete source is missing root identity or analyzable text/media content.');
    error.code = 'THREADS_PRIMARY_SOURCE_INVALID';
    error.partial = source;
    throw error;
  }
}

function displayStatePath(filePath) {
  if (!filePath) return null;
  const relative = path.relative(process.cwd(), filePath);
  if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) {
    return relative.split(path.sep).join('/');
  }
  return filePath;
}

function sourceChangeSummary(change) {
  if (!change) return null;
  const { current_snapshot: _currentSnapshot, ...summary } = change;
  return {
    ...summary,
    snapshot_path: displayStatePath(summary.snapshot_path)
  };
}

function resolveSourceStateRoot(contentRoot, options) {
  if (options.sourceStateRoot === false || options.sourceState === false) return null;
  return options.sourceStateRoot || defaultThreadsSnapshotRoot(contentRoot);
}

export function resolveExtractedSourceIngestion(source, contentRoot, year = new Date().getFullYear()) {
  if (!source?.canonical_url) {
    const error = new Error('Extracted source does not provide a canonical URL.');
    error.code = 'EXTRACTED_SOURCE_INVALID';
    throw error;
  }

  const canonical = canonicalizeSource(source.canonical_url);
  if (source.source_identity && source.source_identity !== canonical.identity) {
    const error = new Error(`Extracted source identity ${source.source_identity} does not match canonical identity ${canonical.identity}.`);
    error.code = 'EXTRACTED_SOURCE_IDENTITY_MISMATCH';
    error.partial = source;
    throw error;
  }

  return resolveIngestion(canonical.canonicalUrl, contentRoot, year);
}

export async function prepareExternalIngestion(rawUrl, contentRoot, options = {}) {
  const year = options.year ?? new Date().getFullYear();
  const external = options.resolution || await resolveExternalSourceUrl(rawUrl, options);

  if (external.provider !== 'threads') {
    const ingestion = resolveIngestion(external.canonical_url, contentRoot, year);
    return {
      ...ingestion,
      input_url: rawUrl,
      resolved_input_url: external.canonical_url,
      url_resolution: resolutionSummary(external)
    };
  }

  const extracted = await extractExternalSource(rawUrl, {
    ...options,
    resolution: external
  });
  const source = extracted.source;
  assertCompleteThreadsSource(source);
  const ingestion = resolveExtractedSourceIngestion(source, contentRoot, year);
  const stateRoot = resolveSourceStateRoot(contentRoot, options);
  const sourceChange = stateRoot
    ? sourceChangeSummary(inspectThreadsSourceChange(source, stateRoot, { capturedAt: options.capturedAt }))
    : null;

  return {
    ...ingestion,
    input_url: rawUrl,
    resolved_input_url: external.canonical_url,
    url_resolution: resolutionSummary(external),
    source_document: source,
    source_change: sourceChange,
    analysis_input: {
      provider: 'threads',
      text_field: 'source_document.combined_text',
      media_field: 'source_document.parts[].media',
      complete: true
    }
  };
}
