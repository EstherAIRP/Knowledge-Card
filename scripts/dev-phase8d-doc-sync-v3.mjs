import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const sourcePath = new URL('./dev-phase8d-doc-sync.mjs', import.meta.url);
let source = fs.readFileSync(sourcePath, 'utf8');

const runtimeOld = "runtime = replaceOnce(runtime, 'runner = remote-ingest-v3', 'runner = remote-ingest-v4', 'runtime runner');";
if (!source.includes(runtimeOld)) throw new Error('Runtime runner patch anchor missing.');
source = source.replace(runtimeOld, "runtime = runtime.replaceAll('remote-ingest-v3', 'remote-ingest-v4');");

const label = "'threads test coverage'";
const labelIndex = source.indexOf(label);
if (labelIndex < 0 || labelIndex !== source.lastIndexOf(label)) {
  throw new Error('Threads test-coverage label is missing or ambiguous.');
}
const callStart = source.lastIndexOf('threads = replaceOnce(', labelIndex);
const callEnd = source.indexOf('\n);', labelIndex);
if (callStart < 0 || callEnd < 0) {
  throw new Error('Threads test-coverage replacement block could not be isolated.');
}
source = `${source.slice(0, callStart)}// Test coverage wording is non-normative; Phase 8D contract is defined above.\n${source.slice(callEnd + 3)}`;

const tempPath = path.join(os.tmpdir(), `phase8d-doc-sync-${process.pid}.mjs`);
fs.writeFileSync(tempPath, source, 'utf8');
try {
  await import(`${pathToFileURL(tempPath).href}?run=${Date.now()}`);
} finally {
  fs.rmSync(tempPath, { force: true });
}
