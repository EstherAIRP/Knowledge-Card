import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';
import { loadCards } from './lib/knowledge.mjs';

const host = '127.0.0.1';
const port = 4174;
const siteBase = '/Knowledge-Card/';
const origin = `http://${host}:${port}`;
const vitepressCli = path.resolve('node_modules/vitepress/bin/vitepress.js');

const cards = loadCards(path.resolve('content/knowledge'));
assert.ok(cards.length > 0, 'Layout verification requires at least one Knowledge Card.');

const conceptIndex = JSON.parse(readFileSync(path.resolve('data/concepts.json'), 'utf8'));
assert.ok(conceptIndex.concepts?.length > 0, 'Layout verification requires at least one Concept.');

const sampleCardId = cards[0].data.id;
const sampleConceptId = conceptIndex.concepts[0].id;

const pages = [
  {
    name: 'radar',
    url: `${origin}${siteBase}`,
    shell: '.radar-shell',
    maxToken: '--kc-layout-standard'
  },
  {
    name: 'knowledge',
    url: `${origin}${siteBase}knowledge/${sampleCardId}`,
    shell: '.VPDoc .container',
    maxToken: '--kc-layout-standard',
    reading: true
  },
  {
    name: 'concept',
    url: `${origin}${siteBase}concepts/${sampleConceptId}`,
    shell: '.VPDoc .container',
    maxToken: '--kc-layout-standard'
  },
  {
    name: 'graph',
    url: `${origin}${siteBase}graph`,
    shell: '.knowledge-graph-shell',
    maxToken: '--kc-layout-wide'
  }
];

const viewports = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 }
];

async function waitForPreview(url, preview, timeoutMs = 30_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (preview.exitCode !== null) {
      throw new Error(`VitePress preview exited early with code ${preview.exitCode}.`);
    }

    try {
      const response = await fetch(url, { redirect: 'follow' });
      if (response.ok) return;
    } catch {
      // Preview server is still starting.
    }

    await delay(250);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function collectMetrics(page, spec) {
  return page.evaluate(({ shellSelector, maxToken, reading }) => {
    const rootStyle = getComputedStyle(document.documentElement);
    const shell = document.querySelector(shellSelector);
    const shellRect = shell?.getBoundingClientRect();
    const readingNode = reading
      ? document.querySelector('.vp-doc > h1, .vp-doc > h2, .vp-doc > p')
      : null;
    const readingRect = readingNode?.getBoundingClientRect();
    const gutterProbe = document.createElement('div');
    gutterProbe.style.position = 'absolute';
    gutterProbe.style.visibility = 'hidden';
    gutterProbe.style.width = 'var(--kc-page-gutter)';
    document.body.appendChild(gutterProbe);
    const pageGutter = Number.parseFloat(getComputedStyle(gutterProbe).width) || 0;
    gutterProbe.remove();

    return {
      shellWidth: shellRect?.width ?? 0,
      shellLeft: shellRect?.left ?? 0,
      shellRight: shellRect?.right ?? 0,
      maxWidth: Number.parseFloat(rootStyle.getPropertyValue(maxToken)) || 0,
      pageGutter,
      readingWidth: readingRect?.width ?? 0,
      readingMax: Number.parseFloat(rootStyle.getPropertyValue('--kc-reading-max')) || 0,
      horizontalOverflow:
        document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  }, {
    shellSelector: spec.shell,
    maxToken: spec.maxToken,
    reading: Boolean(spec.reading)
  });
}

async function verifyPage(browser, viewport, spec) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];

  page.on('pageerror', (error) => {
    errors.push(error.stack ?? error.message);
  });

  try {
    await page.goto(spec.url, { waitUntil: 'networkidle' });
    await page.locator(spec.shell).first().waitFor({ state: 'visible' });

    const metrics = await collectMetrics(page, spec);

    assert.ok(metrics.shellWidth > 0, `${spec.name}: shell width must be positive`);
    const expectedShellWidth = Math.min(
      metrics.maxWidth,
      viewport.width - (metrics.pageGutter * 2)
    );
    assert.ok(
      Math.abs(metrics.shellWidth - expectedShellWidth) <= 2,
      `${spec.name}: shell ${metrics.shellWidth}px does not match expected ${expectedShellWidth}px`
    );
    assert.ok(
      metrics.horizontalOverflow <= 1,
      `${spec.name}: horizontal overflow ${metrics.horizontalOverflow}px`
    );
    assert.ok(
      metrics.shellLeft >= -1 && metrics.shellRight <= viewport.width + 1,
      `${spec.name}: shell must stay inside viewport`
    );

    if (spec.reading) {
      assert.ok(metrics.readingWidth > 0, 'knowledge: readable Markdown node not found');
      assert.ok(
        metrics.readingWidth <= metrics.readingMax + 2,
        `knowledge: reading width ${metrics.readingWidth}px exceeds ${metrics.readingMax}px`
      );
    }

    assert.deepEqual(errors, [], `${spec.name}: runtime errors: ${errors.join('\n')}`);
    process.stdout.write(
      `[layout-ui ${viewport.width}x${viewport.height}] ${spec.name}: ${Math.round(metrics.shellWidth)}px\n`
    );
  } finally {
    await context.close();
  }
}

const preview = spawn(
  process.execPath,
  [vitepressCli, 'preview', 'docs', '--host', host, '--port', String(port)],
  {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe']
  }
);

preview.stdout.on('data', (chunk) => process.stdout.write(`[vitepress] ${chunk}`));
preview.stderr.on('data', (chunk) => process.stderr.write(`[vitepress] ${chunk}`));

let browser;
try {
  await waitForPreview(pages[0].url, preview);
  browser = await chromium.launch();

  for (const viewport of viewports) {
    for (const spec of pages) {
      await verifyPage(browser, viewport, spec);
    }
  }

  process.stdout.write('Site layout browser verification passed.\n');
} finally {
  await browser?.close();
  if (preview.exitCode === null) {
    preview.kill('SIGTERM');
    await Promise.race([
      new Promise((resolve) => preview.once('exit', resolve)),
      delay(2_000)
    ]);
  }
}
