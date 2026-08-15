import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const sourcePath = new URL('./dev-phase8d-doc-sync.mjs', import.meta.url);
let source = fs.readFileSync(sourcePath, 'utf8');
const oldLine = "runtime = replaceOnce(runtime, 'runner = remote-ingest-v3', 'runner = remote-ingest-v4', 'runtime runner');";
const newLine = "runtime = runtime.replaceAll('remote-ingest-v3', 'remote-ingest-v4');";
if (!source.includes(oldLine)) {
  throw new Error('Phase 8D sync patch anchor missing.');
}
source = source.replace(oldLine, newLine);
const tempPath = path.join(os.tmpdir(), `phase8d-doc-sync-${process.pid}.mjs`);
fs.writeFileSync(tempPath, source, 'utf8');
try {
  await import(`${pathToFileURL(tempPath).href}?run=${Date.now()}`);
} finally {
  fs.rmSync(tempPath, { force: true });
}
