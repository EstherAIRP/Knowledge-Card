import path from 'node:path';
import process from 'node:process';
import { extractExternalSource } from './lib/source-extraction.mjs';
import { resolveIngestion } from './lib/knowledge.mjs';

const rawUrl = process.argv[2];
if (!rawUrl) {
  console.error('Usage: npm run ingest:extract -- <url>');
  process.exit(2);
}

try {
  const result = await extractExternalSource(rawUrl);
  const contentRoot = path.resolve('content/knowledge');
  const ingestion = result.source?.canonical_url
    ? resolveIngestion(result.source.canonical_url, contentRoot)
    : null;
  console.log(JSON.stringify({ ...result, ingestion }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    error: error?.code || 'SOURCE_EXTRACTION_FAILED',
    message: error instanceof Error ? error.message : String(error),
    partial: error?.partial || null
  }, null, 2));
  process.exit(1);
}
