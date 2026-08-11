import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  canonicalizeSource,
  compareUserOwnedState,
  parseCardDocument,
  resolveIngestion
} from '../scripts/lib/knowledge.mjs';

test('GitHub repository URL variants resolve to one identity', () => {
  const variants = [
    'https://github.com/Intuition-Lab/personal-model',
    'https://www.github.com/Intuition-Lab/personal-model/',
    'https://github.com/Intuition-Lab/personal-model.git',
    'https://github.com/Intuition-Lab/personal-model?tab=readme-ov-file#readme'
  ];

  const resolved = variants.map(canonicalizeSource);
  for (const item of resolved) {
    assert.equal(item.identity, 'github:intuition-lab/personal-model');
    assert.equal(item.canonicalUrl, 'https://github.com/Intuition-Lab/personal-model');
    assert.equal(item.id, 'github-intuition-lab-personal-model');
  }
});

test('non-GitHub canonicalization removes tracking but preserves meaningful query parameters', () => {
  const item = canonicalizeSource('https://www.example.com/article/?id=42&utm_source=threads&fbclid=abc#section');
  assert.equal(item.canonicalUrl, 'https://example.com/article?id=42');
  assert.match(item.identity, /^url:https:\/\/example\.com\/article\?id=42$/);
  assert.match(item.id, /^example-com-article-[a-f0-9]{8}$/);
});

test('resolver detects an existing card by stable source identity', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'knowledge-card-test-'));
  const yearDir = path.join(root, '2026');
  fs.mkdirSync(yearDir, { recursive: true });
  const cardPath = path.join(yearDir, 'personal-model.md');
  fs.writeFileSync(cardPath, `---\nid: github-intuition-lab-personal-model\ncanonical_url: https://github.com/Intuition-Lab/personal-model\nsource:\n  identity: github:intuition-lab/personal-model\n---\n# Test\n`, 'utf8');

  const result = resolveIngestion('https://github.com/Intuition-Lab/personal-model?tab=readme-ov-file', root, 2026);
  assert.equal(result.mode, 'update');
  assert.equal(result.id, 'github-intuition-lab-personal-model');
  assert.ok(result.existing_path.endsWith('personal-model.md'));

  fs.rmSync(root, { recursive: true, force: true });
});

test('ownership comparison rejects changes to user overrides and user notes', () => {
  const before = parseCardDocument(`---\nid: demo\ncreated_at: 2026-08-11\nclassification:\n  categories:\n    user:\n      - Agent\n  tags:\n    user: null\nrelevance:\n  user:\n    overall: 5\nactions:\n  user: null\nstatus:\n  user: null\n---\n# Demo\n\n## 使用者備註\n\nkeep me\n\n## 更新紀錄\n\nold\n`);

  const after = parseCardDocument(`---\nid: demo\ncreated_at: 2026-08-11\nclassification:\n  categories:\n    user:\n      - LLM\n  tags:\n    user: null\nrelevance:\n  user:\n    overall: 4\nactions:\n  user: null\nstatus:\n  user: null\n---\n# Demo\n\n## 使用者備註\n\nchanged\n\n## 更新紀錄\n\nold\n`);

  const errors = compareUserOwnedState(before, after);
  assert.ok(errors.some((message) => message.includes('classification.categories.user')));
  assert.ok(errors.some((message) => message.includes('relevance.user')));
  assert.ok(errors.some((message) => message.includes('使用者備註')));
});
