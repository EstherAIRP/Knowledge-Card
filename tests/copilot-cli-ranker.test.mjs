import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import {
  buildCopilotCliArgs,
  buildCopilotCliEnvironment,
  classifyCopilotCliDiagnostic,
  createCopilotCliThreadsContinuationRanker,
  DEFAULT_THREADS_CONTINUATION_COPILOT_MODEL,
  THREADS_CONTINUATION_COPILOT_AGENT
} from '../scripts/lib/execution/copilot-cli-ranker.mjs';

test('managed Copilot ranker requires an Actions token', () => {
  const ranker = createCopilotCliThreadsContinuationRanker({
    token: null,
    invokeImpl: async () => '{}'
  });
  assert.equal(ranker, null);
});

test('Copilot invocation uses silent noninteractive agent with supported auto model selection', () => {
  assert.equal(DEFAULT_THREADS_CONTINUATION_COPILOT_MODEL, 'auto');
  assert.deepEqual(buildCopilotCliArgs(), [
    '-s',
    '--no-ask-user',
    `--agent=${THREADS_CONTINUATION_COPILOT_AGENT}`,
    '--model=auto'
  ]);
});

test('Copilot policy denial receives a specific managed-backend failure code', () => {
  assert.equal(
    classifyCopilotCliDiagnostic('Error: Access denied by policy settings. Your Copilot CLI policy setting may be preventing access.'),
    'THREADS_CONTINUATION_COPILOT_POLICY_DENIED'
  );
  assert.equal(
    classifyCopilotCliDiagnostic('Error: unexpected provider failure'),
    'THREADS_CONTINUATION_COPILOT_FAILED'
  );
});

test('Copilot child environment forwards only explicit runtime fields and Copilot token', () => {
  const env = buildCopilotCliEnvironment({
    token: 'fixture-token',
    tempDir: '/tmp/kc-copilot-test',
    baseEnv: {
      PATH: '/usr/bin',
      LANG: 'C.UTF-8',
      HTTPS_PROXY: 'http://proxy.example',
      GH_TOKEN: 'must-not-leak',
      GITHUB_TOKEN: 'must-not-leak',
      AWS_SECRET_ACCESS_KEY: 'must-not-leak'
    }
  });

  assert.equal(env.COPILOT_GITHUB_TOKEN, 'fixture-token');
  assert.equal(env.PATH, '/usr/bin');
  assert.equal(env.LANG, 'C.UTF-8');
  assert.equal(env.HTTPS_PROXY, 'http://proxy.example');
  assert.equal(env.GH_TOKEN, undefined);
  assert.equal(env.GITHUB_TOKEN, undefined);
  assert.equal(env.AWS_SECRET_ACCESS_KEY, undefined);
  assert.equal(env.HOME, '/tmp/kc-copilot-test');
  assert.match(env.COPILOT_HOME, /\.copilot$/);
});

test('managed Copilot ranker parses JSON-only judgement and preserves provenance', async () => {
  let invocation = null;
  const ranker = createCopilotCliThreadsContinuationRanker({
    token: 'fixture-token',
    model: 'auto',
    invokeImpl: async (input) => {
      invocation = input;
      return '```json\n{"selected_shortcodes":["PART2"],"root_only":false,"confidence":0.98,"complete":true,"rationale":"continuation","candidate_labels":[{"shortcode":"PART2","label":"continuation","confidence":0.99}]}\n```';
    }
  });

  const judgement = await ranker({
    prompt: {
      system: 'trusted classifier instructions',
      user: '{"root":{"shortcode":"ROOT"},"candidates":[]}'
    }
  });

  assert.equal(invocation.token, 'fixture-token');
  assert.equal(invocation.model, 'auto');
  assert.match(invocation.prompt, /trusted classifier instructions/);
  assert.match(invocation.prompt, /"shortcode":"ROOT"/);
  assert.deepEqual(judgement.selected_shortcodes, ['PART2']);
  assert.equal(judgement._ranker.method, 'github_copilot_cli');
  assert.equal(judgement._ranker.provider, 'github_copilot');
  assert.equal(judgement._ranker.model, 'auto');
  assert.equal(judgement._ranker.agent, THREADS_CONTINUATION_COPILOT_AGENT);
});

test('trusted Copilot agent profile disables all tools', async () => {
  const profileUrl = new URL('../.github/agents/threads-continuation-ranker.agent.md', import.meta.url);
  const profile = await fs.readFile(profileUrl, 'utf8');
  assert.match(profile, /^---[\s\S]*?tools:\s*\[\][\s\S]*?---/);
  assert.match(profile, /untrusted quoted data/i);
  assert.match(profile, /Return \*\*one JSON object only\*\*/);
});
