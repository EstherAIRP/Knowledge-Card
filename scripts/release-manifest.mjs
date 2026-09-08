import crypto from 'node:crypto';
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

function inspectIndexFile(root, relativePath) {
  const fullPath = path.resolve(root, relativePath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing release index: ${relativePath}`);
  }

  const stat = fs.statSync(fullPath);
  if (!stat.isFile() || stat.size === 0) {
    throw new Error(`Release index is empty or invalid: ${relativePath}`);
  }

  const bytes = fs.readFileSync(fullPath);
  try {
    JSON.parse(bytes.toString('utf8'));
  } catch (error) {
    throw new Error(`Cannot parse release index ${relativePath}: ${error.message}`);
  }

  return {
    sha256: sha256(bytes),
    bytes: bytes.length
  };
}

export function createIndexManifest({ root = process.cwd(), indexPaths = INDEX_PATHS } = {}) {
  const indexes = {};
  for (const relativePath of indexPaths) {
    indexes[relativePath] = inspectIndexFile(root, relativePath);
  }

  return {
    schema_version: 1,
    indexes
  };
}

export function verifyIndexManifest(
  manifest,
  { root = process.cwd(), indexPaths = INDEX_PATHS } = {}
) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('Release manifest must be an object.');
  }

  if (manifest.schema_version !== 1) {
    throw new Error(`Unsupported release manifest schema_version: ${manifest.schema_version}`);
  }

  if (!manifest.indexes || typeof manifest.indexes !== 'object' || Array.isArray(manifest.indexes)) {
    throw new Error('Release manifest indexes must be an object.');
  }

  const errors = [];
  for (const relativePath of indexPaths) {
    const expected = manifest.indexes[relativePath];
    if (!expected) {
      errors.push(`Manifest is missing index entry: ${relativePath}`);
      continue;
    }

    let actual;
    try {
      actual = inspectIndexFile(root, relativePath);
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
    if (!token.startsWith('--')) {
      throw new Error(`Unexpected argument: ${token}`);
    }

    const key = token.slice(2);
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
  console.error('  node scripts/release-manifest.mjs create [--root <dir>] [--output <file>]');
  console.error('  node scripts/release-manifest.mjs verify --manifest <file> [--root <dir>]');
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
    if (!options.manifest) {
      throw new Error('verify requires --manifest <file>.');
    }

    const manifest = readManifest(options.manifest);
    verifyIndexManifest(manifest, { root });
    console.log('Release index manifest verified.');
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
