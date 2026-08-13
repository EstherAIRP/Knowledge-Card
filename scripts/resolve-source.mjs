import path from 'node:path';
import process from 'node:process';
import { resolveIngestion } from './lib/knowledge.mjs';
import { resolveExternalSourceUrl } from './lib/source-resolution.mjs';

const rawUrl = process.argv[2];
if (!rawUrl) {
  console.error('Usage: npm run ingest:resolve -- <url>');
  process.exit(2);
}

try {
  const contentRoot = path.resolve('content/knowledge');
  const external = await resolveExternalSourceUrl(rawUrl);
  const result = resolveIngestion(external.canonical_url, contentRoot);

  console.log(JSON.stringify({
    ...result,
    input_url: rawUrl,
    resolved_input_url: external.canonical_url,
    url_resolution: external.provider
      ? {
          provider: external.provider,
          input_kind: external.input_kind,
          method: external.method,
          transient: external.transient,
          redirect_count: external.redirect_count
        }
      : null
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    error: error?.code || 'SOURCE_RESOLUTION_FAILED',
    message: error instanceof Error ? error.message : String(error)
  }, null, 2));
  process.exit(1);
}
