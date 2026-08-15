import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createGitHubModelsThreadsContinuationRanker,
  DEFAULT_THREADS_CONTINUATION_GITHUB_MODEL,
  GITHUB_MODELS_CHAT_ENDPOINT
} from '../scripts/lib/execution/github-models-ranker.mjs';

test('managed GitHub Models ranker requires a token', () => {
  const ranker = createGitHubModelsThreadsContinuationRanker({
    token: null,
    fetchImpl: async () => {
      throw new Error('should not run');
    }
  });
  assert.equal(ranker, null);
});

test('managed GitHub Models ranker enforces JSON mode and provenance', async () => {
  let capturedUrl = null;
  let capturedInit = null;

  const ranker = createGitHubModelsThreadsContinuationRanker({
    token: 'fixture-token',
    model: 'openai/gpt-4.1',
    fetchImpl: async (url, init) => {
      capturedUrl = url;
      capturedInit = init;
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            choices: [{
              message: {
                content: JSON.stringify({
                  selected_shortcodes: ['PART2'],
                  root_only: false,
                  confidence: 0.98,
                  complete: true,
                  rationale: 'The reply continues the promised article body.',
                  candidate_labels: [
                    { shortcode: 'PART2', label: 'continuation', confidence: 0.99 }
                  ]
                })
              }
            }]
          };
        }
      };
    }
  });

  assert.equal(typeof ranker, 'function');
  const result = await ranker({
    rootPost: { shortcode: 'ROOT' },
    candidates: [],
    prompt: { system: 'system', user: 'user' }
  });

  const body = JSON.parse(capturedInit.body);
  assert.equal(capturedUrl, GITHUB_MODELS_CHAT_ENDPOINT);
  assert.equal(capturedInit.headers.authorization, 'Bearer fixture-token');
  assert.equal(capturedInit.headers.accept, 'application/vnd.github+json');
  assert.equal(body.model, 'openai/gpt-4.1');
  assert.deepEqual(body.response_format, { type: 'json_object' });
  assert.equal(body.temperature, 0);
  assert.equal(result._ranker.method, 'github_models_chat');
  assert.equal(result._ranker.provider, 'github_models');
  assert.equal(result._ranker.model, 'openai/gpt-4.1');
});

test('managed GitHub Models ranker has a repository default model', () => {
  assert.equal(DEFAULT_THREADS_CONTINUATION_GITHUB_MODEL, 'openai/gpt-4.1');
});
