import path from 'node:path';
import process from 'node:process';
import { resolveIngestion } from './lib/knowledge.mjs';

const rawUrl = process.argv[2];
if (!rawUrl) {
  console.error('Usage: npm run ingest:resolve -- <url>');
  process.exit(2);
}

try {
  const contentRoot = path.resolve('content/knowledge');
  const result = resolveIngestion(rawUrl, contentRoot);
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    error: 'SOURCE_RESOLUTION_FAILED',
    message: error instanceof Error ? error.message : String(error)
  }, null, 2));
  process.exit(1);
}
