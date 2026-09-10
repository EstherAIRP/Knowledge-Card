import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { INDEX_PATHS, readManifest } from './release-manifest.mjs';

function requireFullSha(value, label) {
  if (!/^[0-9a-f]{40}$/i.test(value ?? '')) {
    throw new Error(`${label} must be a full 40-character Git SHA.`);
  }
  return value.toLowerCase();
}

function requireText(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value.trim();
}

export function createReleaseMeta({
  manifest,
  sourceSha,
  indexCommitSha,
  releaseId,
  buildMode,
  generatedAt = new Date().toISOString()
}) {
  if (!manifest || manifest.schema_version !== 1 || !manifest.indexes) {
    throw new Error('Release manifest schema_version 1 is required.');
  }

  for (const indexPath of INDEX_PATHS) {
    const entry = manifest.indexes[indexPath];
    if (
      !entry ||
      !/^[0-9a-f]{64}$/i.test(entry.sha256 ?? '') ||
      !Number.isInteger(entry.bytes) ||
      entry.bytes <= 0
    ) {
      throw new Error(`Release manifest entry is invalid: ${indexPath}`);
    }
  }

  if (!['incremental', 'full'].includes(buildMode)) {
    throw new Error(`build_mode must be incremental or full; got ${buildMode ?? '(missing)'}.`);
  }

  return {
    schema_version: 1,
    release_id: requireText(releaseId, 'release_id'),
    source_sha: requireFullSha(sourceSha, 'source_sha'),
    index_commit_sha: requireFullSha(indexCommitSha, 'index_commit_sha'),
    build_mode: buildMode,
    generated_at: requireText(generatedAt, 'generated_at'),
    indexes: Object.fromEntries(
      INDEX_PATHS.map((indexPath) => [
        indexPath,
        {
          sha256: manifest.indexes[indexPath].sha256.toLowerCase(),
          bytes: manifest.indexes[indexPath].bytes
        }
      ])
    )
  };
}

export function writeReleaseMeta(filePath, meta) {
  const fullPath = path.resolve(filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith('--')) throw new Error(`Unexpected argument: ${token}`);
    const key = token.slice(2);
    const value = rest[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`);
    options[key] = value;
    index += 1;
  }
  return { command, options };
}

function main(argv = process.argv.slice(2)) {
  const { command, options } = parseArgs(argv);
  if (command !== 'create') {
    throw new Error(
      'Usage: node scripts/release-meta.mjs create --manifest <file> --source <sha> --index-commit <sha> --release-id <id> --build-mode <incremental|full> --output <file>'
    );
  }

  for (const key of ['manifest', 'source', 'index-commit', 'release-id', 'build-mode', 'output']) {
    if (!options[key]) throw new Error(`create requires --${key} <value>.`);
  }

  const meta = createReleaseMeta({
    manifest: readManifest(options.manifest),
    sourceSha: options.source,
    indexCommitSha: options['index-commit'],
    releaseId: options['release-id'],
    buildMode: options['build-mode']
  });
  writeReleaseMeta(options.output, meta);
  console.log(`Release metadata written: ${path.resolve(options.output)}`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
