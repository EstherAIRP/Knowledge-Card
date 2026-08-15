import fs from 'node:fs/promises';
import process from 'node:process';

const resultPath = process.argv[2] || process.env.REMOTE_INGEST_RESULT_PATH;
if (!resultPath) {
  console.error('Usage: node scripts/remote-ingest-result-check.mjs <result.json>');
  process.exit(2);
}

const result = JSON.parse(await fs.readFile(resultPath, 'utf8'));
if (result?.execution?.status !== 'success') {
  console.error(JSON.stringify({
    request_id: result?.request_id || null,
    status: result?.execution?.status || 'failure',
    classification: result?.failure?.classification || 'SOURCE_EXTRACTION_FAILED',
    code: result?.failure?.code || null,
    message: result?.failure?.message || null
  }));
  process.exit(1);
}

console.log(JSON.stringify({
  request_id: result.request_id,
  status: 'success',
  canonical_url: result?.result?.canonical_url || null,
  source_identity: result?.result?.source_identity || null,
  mode: result?.result?.mode || null
}));
