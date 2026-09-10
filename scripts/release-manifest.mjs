import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export const INDEX_PATHS = Object.freeze([
  'data/embeddings.json',
  'data/relations.json',
  'data/concepts.json'
]);

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function inspectBytes(bytes, relativePath) {
  if (!Buffer.isBuffer(bytes) || bytes.length === 0) {
    throw new Error(`Release index is empty or invalid: ${relativePath}`);
  }
  try {
    JSON.parse(bytes.toString('utf8'));
  } catch (error) {
    throw new Error(`Cannot parse release index ${relativePath}: ${error.message}`);
  }
  return { sha256: sha256(bytes), bytes: bytes.length };
}

function inspectIndexFile(root, relativePath) {
  const fullPath = path.resolve(root, relativePath);
  if (!fs.existsSync(fullPath)) throw new Error(`Missing release index: ${relativePath}`);
  const stat = fs.statSync(fullPath);
  if (!stat.isFile()) throw new Error(`Release index is empty or invalid: ${relativePath}`);
  return inspectBytes(fs.readFileSync(fullPath), relativePath);
}

function runGitText(cwd, args) {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim();
  } catch (error) {
    const stderr = error.stderr?.toString?.().trim();
    throw new Error(`git ${args.join(' ')} failed: ${stderr || error.message}`);
  }
}

function readGitBlob(cwd, commit, relativePath) {
  try {
    return execFileSync('git', ['show', `${commit}:${relativePath}`], {
      cwd,
      encoding: 'buffer',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 1024 * 1024 * 128
    });
  } catch (error) {
    const stderr = error.stderr?.toString?.().trim();
    throw new Error(
      `Cannot read release index ${relativePath} from Git commit ${commit}: ${stderr || error.message}`
    );
  }
}

function validateManifestShape(manifest) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('Release manifest must be an object.');
  }
  if (manifest.schema_version !== 1) {
    throw new Error(`Unsupported release manifest schema_version: ${manifest.schema_version}`);
  }
  if (!manifest.indexes || typeof manifest.indexes !== 'object' || Array.isArray(manifest.indexes)) {
    throw new Error('Release manifest indexes must be an object.');
  }
}

function compareManifest(manifest, inspect, indexPaths) {
  validateManifestShape(manifest);
  const errors = [];
  for (const relativePath of indexPaths) {
    const expected = manifest.indexes[relativePath];
    if (!expected) {
      errors.push(`Manifest is missing index entry: ${relativePath}`);
      continue;
    }

    let actual;
    try {
      actual = inspect(relativePath);
    } catch (error) {
      errors.push(error.message);
      continue;
    }

    if (actual.sha256 !== expected.sha256) {
      errors.push(
        `SHA-256 mismatch for ${relativePath}: expected ${expected.sha256}, got ${actual.sha256}`
      );
    }
    if (actual.bytes !== expected.bytes) {
      errors.push(
        `Byte-size mismatch for ${relativePath}: expected ${expected.bytes}, got ${actual.bytes}`
      );
    }
  }

  if (errors.length) {
    throw new Error(`Release index verification failed:\n- ${errors.join('\n- ')}`);
  }
  return true;
}

export function createIndexManifest({ root = process.cwd(), indexPaths = INDEX_PATHS } = {}) {
  const indexes = {};
  for (const relativePath of indexPaths) {
    indexes[relativePath] = inspectIndexFile(root, relativePath);
  }
  return { schema_version: 1, indexes };
}

export function verifyIndexManifest(
  manifest,
  { root = process.cwd(), indexPaths = INDEX_PATHS } = {}
) {
  return compareManifest(
    manifest,
    (relativePath) => inspectIndexFile(root, relativePath),
    indexPaths
  );
}

export function verifyIndexManifestAtGitCommit(
  manifest,
  { cwd = process.cwd(), commit, indexPaths = INDEX_PATHS } = {}
) {
  if (!commit) throw new Error('Git commit is required for release index verification.');
  const resolvedCommit = runGitText(cwd, ['rev-parse', `${commit}^{commit}`]);
  compareManifest(
    manifest,
    (relativePath) => inspectBytes(readGitBlob(cwd, resolvedCommit, relativePath), relativePath),
    indexPaths
  );
  return { commit: resolvedCommit, indexes: indexPaths.length };
}

export function readManifest(filePath) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read release manifest ${filePath}: ${error.message}`);
  }
  return parsed;
}

export function writeManifest(filePath, manifest) {
  const fullPath = path.resolve(filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
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

function printUsage() {
  console.error('Usage:');
  console.error('  node scripts/release-manifest.mjs create [--root <dir>] [--output <file>]');
  console.error('  node scripts/release-manifest.mjs verify --manifest <file> [--root <dir>]');
  console.error(
    '  node scripts/release-manifest.mjs verify-git --manifest <file> --commit <sha> [--root <dir>]'
  );
}

function main(argv = process.argv.slice(2)) {
  const { command, options } = parseArgs(argv);
  const root = options.root ? path.resolve(options.root) : process.cwd();

  if (command === 'create') {
    const manifest = createIndexManifest({ root });
    if (options.output) {
      writeManifest(options.output, manifest);
      console.log(`Release index manifest written: ${path.resolve(options.output)}`);
    } else {
      process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
    }
    return;
  }

  if (command === 'verify') {
    if (!options.manifest) throw new Error('verify requires --manifest <file>.');
    verifyIndexManifest(readManifest(options.manifest), { root });
    console.log('Release index manifest verified.');
    return;
  }

  if (command === 'verify-git') {
    if (!options.manifest || !options.commit) {
      throw new Error('verify-git requires --manifest <file> --commit <sha>.');
    }
    const result = verifyIndexManifestAtGitCommit(readManifest(options.manifest), {
      cwd: root,
      commit: options.commit
    });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  printUsage();
  throw new Error(`Unknown command: ${command ?? '(none)'}`);
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
