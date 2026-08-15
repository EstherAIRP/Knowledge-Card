import process from 'node:process';
import { runLocalIngestion } from './lib/execution/local-backend.mjs';
import { createRemoteIngestPlan } from './lib/execution/remote-backend.mjs';

function parseArgs(argv) {
  const positional = [];
  const flags = new Map();
  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const [name, ...valueParts] = arg.slice(2).split('=');
      flags.set(name, valueParts.length ? valueParts.join('=') : true);
    } else {
      positional.push(arg);
    }
  }
  return {
    url: positional[0] || null,
    backend: String(flags.get('backend') || 'auto'),
    requestId: flags.get('request-id') === true ? null : flags.get('request-id') || null
  };
}

function print(value) {
  console.log(JSON.stringify(value, null, 2));
}

const args = parseArgs(process.argv.slice(2));
if (!args.url) {
  console.error('Usage: npm run ingest:dispatch -- <url> [--backend=auto|local|remote] [--request-id=<id>]');
  process.exit(2);
}
if (!['auto', 'local', 'remote'].includes(args.backend)) {
  console.error(`Unsupported backend mode: ${args.backend}`);
  process.exit(2);
}

if (args.backend === 'remote') {
  print({
    status: 'REMOTE_EXECUTION_REQUIRED',
    remote: createRemoteIngestPlan(args.url, { requestId: args.requestId })
  });
  process.exit(75);
}

const local = await runLocalIngestion(args.url);
if (local.execution.status === 'success') {
  print(local);
  process.exit(0);
}

if (args.backend === 'auto' && local.failure?.classification === 'LOCAL_EXECUTION_UNAVAILABLE') {
  print({
    status: 'REMOTE_EXECUTION_REQUIRED',
    local,
    remote: createRemoteIngestPlan(args.url, { requestId: args.requestId })
  });
  process.exit(75);
}

print(local);
process.exit(1);
