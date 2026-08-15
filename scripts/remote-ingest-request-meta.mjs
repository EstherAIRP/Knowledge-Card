import fs from 'node:fs';
import process from 'node:process';
import { parseRemoteIngestRequest } from './lib/execution/backend-contract.mjs';

const requestPath = process.argv[2];
const outputPath = process.argv[3] || process.env.GITHUB_OUTPUT;
if (!requestPath || !outputPath) {
  console.error('Usage: node scripts/remote-ingest-request-meta.mjs <request.json> <github-output-path>');
  process.exit(2);
}

const request = parseRemoteIngestRequest(fs.readFileSync(requestPath, 'utf8'));
fs.appendFileSync(outputPath, `request_id=${request.request_id}\n`);
fs.appendFileSync(outputPath, `artifact_name=remote-ingest-${request.request_id}\n`);
fs.appendFileSync(outputPath, `operation=${request.operation}\n`);
console.log(JSON.stringify({ request_id: request.request_id, operation: request.operation }));
