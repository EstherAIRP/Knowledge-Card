import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const REQUIRED_FILES = [
  'README.md',
  'AGENTS.md',
  'prompts/RUNTIME.md',
  'docs/index.md',
  'docs/DOCUMENTATION.md',
  'docs/AUTHORITY_MAP.md',
  'docs/INGESTION.md',
  'docs/THREADS_INGESTION.md',
  'docs/AUTOMATION.md',
  'docs/RELATIONS.md',
  'docs/CONCEPTS.md',
  'docs/WEBSITE.md',
  'schema/knowledge-card.schema.json',
  'schema/threads-continuation-judgement.schema.json',
  'config/taxonomy.yaml',
  'profile/public-profile.yaml'
];

const FORBIDDEN_FILES = [
  'docs/INDEX.md',
  'docs/THREADS_PHASE7_RECOVERY.md'
];

const GOVERNANCE_MARKDOWN = [
  'README.md',
  'docs/DOCUMENTATION.md',
  'docs/AUTHORITY_MAP.md',
  'docs/INGESTION.md',
  'docs/THREADS_INGESTION.md',
  'docs/AUTOMATION.md',
  'docs/RELATIONS.md',
  'docs/CONCEPTS.md',
  'docs/WEBSITE.md'
];

function read(root, relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function relativeDisplay(root, absolutePath) {
  return path.relative(root, absolutePath).split(path.sep).join('/');
}

function localLinkTarget(rawTarget) {
  let target = String(rawTarget || '').trim();
  if (!target) return null;
  if (target.startsWith('<') && target.endsWith('>')) target = target.slice(1, -1).trim();
  target = target.match(/^\S+/)?.[0] || target;

  if (/^(?:https?:|mailto:|tel:|javascript:)/i.test(target) || target.startsWith('#')) {
    return null;
  }

  target = target.split('#', 1)[0].split('?', 1)[0];
  if (!target) return null;

  try {
    return decodeURIComponent(target);
  } catch {
    return target;
  }
}

function checkMarkdownLinks(root, relativePath, errors) {
  const source = read(root, relativePath);
  const sourcePath = path.join(root, relativePath);
  const docsRoot = path.join(root, 'docs');
  const sourceIsDocs = relativePath.startsWith('docs/');
  const linkPattern = /\[[^\]]*\]\(([^)\n]+)\)/g;

  for (const match of source.matchAll(linkPattern)) {
    const target = localLinkTarget(match[1]);
    if (!target) continue;

    const resolved = target.startsWith('/')
      ? path.resolve(root, `.${target}`)
      : path.resolve(path.dirname(sourcePath), target);

    if (sourceIsDocs) {
      const relativeToDocs = path.relative(docsRoot, resolved);
      if (relativeToDocs.startsWith('..') || path.isAbsolute(relativeToDocs)) {
        errors.push(`${relativePath}: repository file links outside docs/ must use an absolute GitHub URL: ${match[1]}`);
        continue;
      }
    }

    if (!fs.existsSync(resolved)) {
      errors.push(`${relativePath}: broken local Markdown link ${match[1]} → ${relativeDisplay(root, resolved)}`);
    }
  }
}

export function checkDocumentationGovernance({ root = process.cwd() } = {}) {
  const errors = [];

  for (const relativePath of REQUIRED_FILES) {
    if (!fs.existsSync(path.join(root, relativePath))) {
      errors.push(`Missing required documentation/contract file: ${relativePath}`);
    }
  }

  for (const relativePath of FORBIDDEN_FILES) {
    if (fs.existsSync(path.join(root, relativePath))) {
      errors.push(`Deprecated/conflicting documentation path must not exist: ${relativePath}`);
    }
  }

  const docsDir = path.join(root, 'docs');
  if (fs.existsSync(docsDir)) {
    const indexVariants = fs.readdirSync(docsDir).filter((name) => name.toLowerCase() === 'index.md');
    if (indexVariants.length !== 1 || indexVariants[0] !== 'index.md') {
      errors.push(`docs/ must contain exactly one lowercase index.md; found: ${indexVariants.join(', ') || 'none'}`);
    }
  }

  const requiredReadableFiles = GOVERNANCE_MARKDOWN.filter((relativePath) => fs.existsSync(path.join(root, relativePath)));
  for (const relativePath of requiredReadableFiles) {
    checkMarkdownLinks(root, relativePath, errors);
  }

  if (fs.existsSync(path.join(root, 'package.json'))) {
    const packageJson = JSON.parse(read(root, 'package.json'));
    if (packageJson.scripts?.['docs:check'] !== 'node scripts/check-documentation.mjs') {
      errors.push('package.json must expose docs:check as "node scripts/check-documentation.mjs".');
    }
  }

  if (fs.existsSync(path.join(root, 'README.md'))) {
    const readme = read(root, 'README.md');
    for (const requiredText of [
      'docs/DOCUMENTATION.md',
      'docs/AUTHORITY_MAP.md',
      'npm run ingest:dispatch -- <URL>',
      'npm run docs:check',
      'remote-ingest.yml',
      'update-relations.yml',
      'rebuild-relations.yml'
    ]) {
      if (!readme.includes(requiredText)) {
        errors.push(`README.md must reference current repository contract/capability: ${requiredText}`);
      }
    }
    if (/Resolve a URL before ingestion:/i.test(readme) || /URL\s*\n\s*(?:→|->)\s*npm run ingest:resolve/i.test(readme)) {
      errors.push('README.md still presents ingest:resolve as the primary ingestion entry; use ingest:dispatch and describe ingest:resolve as low-level/debug only.');
    }
  }

  if (fs.existsSync(path.join(root, 'docs/DOCUMENTATION.md'))) {
    const router = read(root, 'docs/DOCUMENTATION.md');
    for (const requiredText of [
      'AUTHORITY_MAP.md',
      'INGESTION.md',
      'THREADS_INGESTION.md',
      'threads-continuation-judgement.schema.json',
      'scripts/check-documentation.mjs'
    ]) {
      if (!router.includes(requiredText)) {
        errors.push(`docs/DOCUMENTATION.md is missing required authority/navigation reference: ${requiredText}`);
      }
    }
  }

  if (fs.existsSync(path.join(root, 'docs/AUTHORITY_MAP.md'))) {
    const authority = read(root, 'docs/AUTHORITY_MAP.md');
    for (let phase = 1; phase <= 5; phase += 1) {
      const pattern = new RegExp(`Phase ${phase}[^\\n]*COMPLETE`);
      if (!pattern.test(authority)) {
        errors.push(`docs/AUTHORITY_MAP.md must mark Phase ${phase} COMPLETE after the governance refactor.`);
      }
    }
    if (!authority.includes('scripts/check-documentation.mjs')) {
      errors.push('docs/AUTHORITY_MAP.md must record the documentation guardrail implementation.');
    }
  }

  for (const workflow of ['.github/workflows/validate.yml', '.github/workflows/deploy-pages.yml']) {
    if (fs.existsSync(path.join(root, workflow)) && !read(root, workflow).includes('npm run docs:check')) {
      errors.push(`${workflow} must run npm run docs:check.`);
    }
  }

  const remoteWorkflowPath = '.github/workflows/remote-ingest.yml';
  if (fs.existsSync(path.join(root, remoteWorkflowPath))) {
    const remoteWorkflow = read(root, remoteWorkflowPath);
    for (const requiredText of [
      'statuses: write',
      "context='remote-ingest/run'",
      '${{ github.run_id }}',
      'Publish remote ingestion final status'
    ]) {
      if (!remoteWorkflow.includes(requiredText)) {
        errors.push(`${remoteWorkflowPath} is missing the Remote Ingest request-to-run correlation invariant: ${requiredText}`);
      }
    }
  }

  if (fs.existsSync(path.join(root, 'docs/AUTOMATION.md')) && !read(root, 'docs/AUTOMATION.md').includes('npm run docs:check')) {
    errors.push('docs/AUTOMATION.md must document the documentation governance check.');
  }

  return errors;
}

export function runDocumentationGovernanceCheck(options = {}) {
  const errors = checkDocumentationGovernance(options);
  if (errors.length) {
    console.error(`Documentation governance check failed with ${errors.length} error(s):`);
    for (const error of errors) console.error(`- ${error}`);
    return false;
  }
  console.log('Documentation governance check passed.');
  return true;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
  if (!runDocumentationGovernanceCheck()) process.exitCode = 1;
}
