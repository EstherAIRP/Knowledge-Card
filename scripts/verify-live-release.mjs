import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { verifyIndexManifestAtGitCommit } from './release-manifest.mjs';

function requireText(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value.trim();
}

function requireFullSha(value, label) {
  const text = requireText(value, label).toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(text)) {
    throw new Error(`${label} must be a full 40-character Git SHA.`);
  }
  return text;
}

function requirePositiveInteger(value, label) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return parsed;
}

function releaseMetaUrl(siteUrl, releaseId, attempt) {
  const base = requireText(siteUrl, 'site_url').replace(/\/?$/, '/');
  const url = new URL('release-meta.json', base);
  url.searchParams.set('release_id', releaseId);
  url.searchParams.set('attempt', String(attempt));
  return url;
}

async function readJsonResponse(response, url) {
  if (!response?.ok) {
    throw new Error(`HTTP ${response?.status ?? 'unknown'} while reading ${url}`);
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON from ${url}: ${error.message}`);
  }
}

function validateIdentity(meta, expected) {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
    throw new Error('Live release metadata must be an object.');
  }
  if (meta.schema_version !== 1) {
    throw new Error(`Live release schema_version mismatch: expected 1, got ${meta.schema_version}.`);
  }

  const checks = [
    ['release_id', meta.release_id, expected.releaseId],
    ['source_sha', meta.source_sha?.toLowerCase?.(), expected.sourceSha],
    ['index_commit_sha', meta.index_commit_sha?.toLowerCase?.(), expected.indexCommitSha],
    ['build_mode', meta.build_mode, expected.buildMode]
  ];

  for (const [label, actual, expectedValue] of checks) {
    if (actual !== expectedValue) {
      throw new Error(
        `Live release ${label} mismatch: expected ${expectedValue}, got ${actual ?? '(missing)'}.`
      );
    }
  }

  if (!meta.indexes || typeof meta.indexes !== 'object' || Array.isArray(meta.indexes)) {
    throw new Error('Live release indexes must be an object.');
  }
}

export async function verifyLiveRelease({
  siteUrl,
  releaseId,
  sourceSha,
  indexCommitSha,
  buildMode,
  cwd = process.cwd(),
  attempts = 10,
  delayMs = 3000,
  fetchImpl = globalThis.fetch,
  sleepImpl = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
}) {
  const expected = {
    releaseId: requireText(releaseId, 'release_id'),
    sourceSha: requireFullSha(sourceSha, 'source_sha'),
    indexCommitSha: requireFullSha(indexCommitSha, 'index_commit_sha'),
    buildMode: requireText(buildMode, 'build_mode')
  };
  if (!['incremental', 'full'].includes(expected.buildMode)) {
    throw new Error(`build_mode must be incremental or full; got ${expected.buildMode}.`);
  }

  const maxAttempts = requirePositiveInteger(attempts, 'attempts');
  const retryDelay = Number(delayMs);
  if (!Number.isFinite(retryDelay) || retryDelay < 0) {
    throw new Error('delay_ms must be a non-negative number.');
  }
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch implementation is unavailable.');
  }

  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const url = releaseMetaUrl(siteUrl, expected.releaseId, attempt);
    try {
      const response = await fetchImpl(url, {
        headers: {
          'cache-control': 'no-cache',
          pragma: 'no-cache'
        }
      });
      const meta = await readJsonResponse(response, url);
      validateIdentity(meta, expected);

      verifyIndexManifestAtGitCommit(
        { schema_version: 1, indexes: meta.indexes },
        { cwd, commit: expected.indexCommitSha }
      );

      return {
        url: url.toString(),
        release_id: meta.release_id,
        source_sha: meta.source_sha,
        index_commit_sha: meta.index_commit_sha,
        build_mode: meta.build_mode,
        attempts_used: attempt
      };
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts && retryDelay > 0) {
        await sleepImpl(retryDelay);
      }
    }
  }

  throw new Error(
    `Live release verification failed after ${maxAttempts} attempt(s): ${lastError?.message ?? 'unknown error'}`
  );
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) throw new Error(`Unexpected argument: ${token}`);
    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`);
    options[key] = value;
    index += 1;
  }
  return options;
}

async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  for (const key of ['site-url', 'release-id', 'source', 'index-commit', 'build-mode']) {
    if (!options[key]) throw new Error(`Missing required --${key} <value>.`);
  }

  const result = await verifyLiveRelease({
    siteUrl: options['site-url'],
    releaseId: options['release-id'],
    sourceSha: options.source,
    indexCommitSha: options['index-commit'],
    buildMode: options['build-mode'],
    attempts: options.attempts ?? 10,
    delayMs: options['delay-ms'] ?? 3000
  });

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  try {
    await main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
