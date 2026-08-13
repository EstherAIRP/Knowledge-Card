import path from 'node:path';
import process from 'node:process';
import { prepareExternalIngestion } from './lib/source-ingestion.mjs';
import {
  defaultThreadsSnapshotRoot,
  writeThreadsSourceSnapshot
} from './lib/sources/threads/source-state.mjs';

const rawUrl = process.argv[2];
if (!rawUrl) {
  console.error('Usage: npm run ingest:snapshot -- <threads-url>');
  process.exit(2);
}

try {
  const contentRoot = path.resolve('content/knowledge');
  const result = await prepareExternalIngestion(rawUrl, contentRoot);
  if (result?.source_document?.provider !== 'threads') {
    const error = new Error('Source snapshots are currently supported only for Threads sources.');
    error.code = 'SOURCE_SNAPSHOT_PROVIDER_UNSUPPORTED';
    throw error;
  }
  if (result.mode !== 'update' || !result.existing_path) {
    const error = new Error('Refusing to advance source state before a corresponding Knowledge Card exists. Create/update and validate the Card first.');
    error.code = 'SOURCE_SNAPSHOT_CARD_REQUIRED';
    throw error;
  }

  const stateRoot = defaultThreadsSnapshotRoot(contentRoot);
  if (!stateRoot) {
    const error = new Error('Could not determine the repository Threads source-state directory.');
    error.code = 'THREADS_SNAPSHOT_ROOT_REQUIRED';
    throw error;
  }

  const saved = writeThreadsSourceSnapshot(result.source_document, stateRoot);
  const relativePath = path.relative(process.cwd(), saved.path).split(path.sep).join('/');
  console.log(JSON.stringify({
    provider: 'threads',
    source_identity: result.source_identity,
    canonical_url: result.canonical_url,
    existing_path: result.existing_path,
    change_before_snapshot: result.source_change,
    snapshot: {
      path: relativePath,
      source_hash: saved.snapshot.source_hash,
      captured_at: saved.snapshot.captured_at,
      written: saved.written
    }
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    error: error?.code || 'SOURCE_SNAPSHOT_FAILED',
    message: error instanceof Error ? error.message : String(error),
    partial: error?.partial || null
  }, null, 2));
  process.exit(1);
}
