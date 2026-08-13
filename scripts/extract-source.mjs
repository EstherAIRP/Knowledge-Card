import process from 'node:process';
import { extractExternalSource } from './lib/source-extraction.mjs';

const rawUrl = process.argv[2];
if (!rawUrl) {
  console.error('Usage: npm run ingest:extract -- <url>');
  process.exit(2);
}

try {
  const result = await extractExternalSource(rawUrl);
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    error: error?.code || 'SOURCE_EXTRACTION_FAILED',
    message: error instanceof Error ? error.message : String(error)
  }, null, 2));
  process.exit(1);
}
