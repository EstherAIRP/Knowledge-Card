import { execFileSync } from 'node:child_process';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { INDEX_PATHS } from './release-manifest.mjs';

function runGit(cwd, args) {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim();
  } catch (error) {
    const stderr = error.stderr?.toString?.().trim();
    const detail = stderr || error.message;
    throw new Error(`git ${args.join(' ')} failed: ${detail}`);
  }
}

function assertFullSha(name, value) {
  if (!/^[0-9a-f]{40}$/i.test(value ?? '')) {
    throw new Error(`${name} must be a full 40-character Git SHA.`);
  }
}

function resolveCommit(cwd, ref) {
  return runGit(cwd, ['rev-parse', `${ref}^{commit}`]);
}

export function verifyCheckoutAtSource({ cwd = process.cwd(), sourceSha }) {
  assertFullSha('source_sha', sourceSha);
  const head = resolveCommit(cwd, 'HEAD');
  const source = resolveCommit(cwd, sourceSha);

  if (head !== source) {
    throw new Error(`Checkout mismatch: expected source ${source}, got HEAD ${head}.`);
  }

  return { source_sha: source, head_sha: head };
}

export function verifyRemoteRef({
  cwd = process.cwd(),
  expectedSha,
  remote = 'origin',
  branch = 'main',
  fetch = false
}) {
  assertFullSha('expected_sha', expectedSha);

  const remoteRef = `${remote}/${branch}`;
  if (fetch) {
    runGit(cwd, [
      'fetch',
      remote,
      `+refs/heads/${branch}:refs/remotes/${remote}/${branch}`
    ]);
  }

  const actual = resolveCommit(cwd, remoteRef);
  const expected = resolveCommit(cwd, expectedSha);

  if (actual !== expected) {
    throw new Error(`${remoteRef} mismatch: expected ${expected}, got ${actual}.`);
  }

  return { remote_ref: remoteRef, remote_sha: actual };
}

export function verifyIndexCommit({
  cwd = process.cwd(),
  sourceSha,
  indexCommitSha,
  allowedPaths = INDEX_PATHS
}) {
  assertFullSha('source_sha', sourceSha);
  assertFullSha('index_commit_sha', indexCommitSha);

  const source = resolveCommit(cwd, sourceSha);
  const indexCommit = resolveCommit(cwd, indexCommitSha);

  if (indexCommit === source) {
    return {
      source_sha: source,
      index_commit_sha: indexCommit,
      changed_files: [],
      mode: 'no-index-change'
    };
  }

  const parentLine = runGit(cwd, ['rev-list', '--parents', '-n', '1', indexCommit]);
  const parts = parentLine.split(/\s+/);
  const parents = parts.slice(1);

  if (parents.length !== 1) {
    throw new Error(
      `Index commit ${indexCommit} must have exactly one parent; found ${parents.length}.`
    );
  }

  if (parents[0] !== source) {
    throw new Error(
      `Index commit parent mismatch: expected source ${source}, got ${parents[0]}.`
    );
  }

  const changedFiles = runGit(cwd, [
    'diff-tree',
    '--no-commit-id',
    '--name-only',
    '-r',
    indexCommit
  ])
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

  if (changedFiles.length === 0) {
    throw new Error(`Index commit ${indexCommit} has no changed files.`);
  }

  const allowed = new Set(allowedPaths);
  const forbidden = changedFiles.filter((file) => !allowed.has(file));
  if (forbidden.length) {
    throw new Error(
      `Index commit modifies files outside the release index allowlist: ${forbidden.join(', ')}`
    );
  }

  return {
    source_sha: source,
    index_commit_sha: indexCommit,
    changed_files: changedFiles,
    mode: 'index-commit'
  };
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith('--')) {
      throw new Error(`Unexpected argument: ${token}`);
    }

    const key = token.slice(2);
    if (key === 'fetch') {
      options.fetch = true;
      continue;
    }

    const value = rest[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}`);
    }

    options[key] = value;
    index += 1;
  }

  return { command, options };
}

function printUsage() {
  console.error('Usage:');
  console.error('  node scripts/verify-release-source.mjs checkout --source <sha>');
  console.error(
    '  node scripts/verify-release-source.mjs remote --expected <sha> [--remote origin] [--branch main] [--fetch]'
  );
  console.error(
    '  node scripts/verify-release-source.mjs index --source <sha> --index-commit <sha>'
  );
}

function main(argv = process.argv.slice(2)) {
  const { command, options } = parseArgs(argv);
  let result;

  if (command === 'checkout') {
    if (!options.source) throw new Error('checkout requires --source <sha>.');
    result = verifyCheckoutAtSource({ sourceSha: options.source });
  } else if (command === 'remote') {
    if (!options.expected) throw new Error('remote requires --expected <sha>.');
    result = verifyRemoteRef({
      expectedSha: options.expected,
      remote: options.remote ?? 'origin',
      branch: options.branch ?? 'main',
      fetch: options.fetch ?? false
    });
  } else if (command === 'index') {
    if (!options.source || !options['index-commit']) {
      throw new Error('index requires --source <sha> --index-commit <sha>.');
    }
    result = verifyIndexCommit({
      sourceSha: options.source,
      indexCommitSha: options['index-commit']
    });
  } else {
    printUsage();
    throw new Error(`Unknown command: ${command ?? '(none)'}`);
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
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
