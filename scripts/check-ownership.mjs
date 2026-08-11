import fs from 'node:fs';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { compareUserOwnedState, parseCardDocument } from './lib/knowledge.mjs';

const target = process.argv[2];
if (!target) {
  console.error('Usage: npm run validate:ownership -- <content/knowledge/...md>');
  process.exit(2);
}

if (!fs.existsSync(target)) {
  console.error(`Target does not exist: ${target}`);
  process.exit(2);
}

let beforeText;
try {
  beforeText = execFileSync('git', ['show', `HEAD:${target}`], { encoding: 'utf8' });
} catch {
  console.log(`Ownership check skipped: ${target} is new relative to HEAD.`);
  process.exit(0);
}

try {
  const before = parseCardDocument(beforeText, `HEAD:${target}`);
  const after = parseCardDocument(fs.readFileSync(target, 'utf8'), target);
  const errors = compareUserOwnedState(before, after);

  if (errors.length) {
    console.error(`User ownership check failed (${errors.length}):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log(`User ownership preserved: ${target}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
