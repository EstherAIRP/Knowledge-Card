import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const host = '127.0.0.1';
const port = 4173;
const siteBase = '/Knowledge-Card/';
const origin = `http://${host}:${port}`;
const graphUrl = `${origin}${siteBase}graph`;
const outputDir = path.resolve('artifacts/graph-ui');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const viewports = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 900, height: 800 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 }
];

function logStep(viewport, message) {
  process.stdout.write(`[graph-ui ${viewport.width}x${viewport.height}] ${message}\n`);
}

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

async function collectMetrics(page) {
  return page.evaluate(() => {
    const shell = document.querySelector('.knowledge-graph-shell');
    const explorer = document.querySelector('.graph-explorer');
    const canvas = document.querySelector('.knowledge-graph');
    const label = document.querySelector('.graph-node-label');
    const canvasRect = canvas?.getBoundingClientRect();
    const shellRect = shell?.getBoundingClientRect();
    const explorerRect = explorer?.getBoundingClientRect();
    const labelRect = label?.getBoundingClientRect();

    return {
      shellWidth: shellRect?.width ?? 0,
      explorerWidth: explorerRect?.width ?? 0,
      canvasWidth: canvasRect?.width ?? 0,
      canvasHeight: canvasRect?.height ?? 0,
      canvasTop: canvasRect?.top ?? 0,
      labelHeight: labelRect?.height ?? 0,
      horizontalOverflow:
        document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });
}

async function verifyViewport(browser, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => {
    const message = error.stack ?? error.message;
    pageErrors.push(message);
    process.stderr.write(`[graph-ui ${viewport.width}x${viewport.height}] pageerror: ${message}\n`);
  });

  try {
    logStep(viewport, '開啟 Knowledge Graph');
    await page.goto(graphUrl, { waitUntil: 'networkidle' });
    await page.locator('.knowledge-graph').waitFor({ state: 'visible' });

    const initial = await collectMetrics(page);
    assert.ok(
      initial.horizontalOverflow <= 1,
      `頁面出現水平溢出：${initial.horizontalOverflow}px`
    );
    assert.ok(initial.canvasWidth > 0, '圖譜畫布寬度必須大於 0');
    assert.ok(
      initial.canvasHeight >= (viewport.width <= 760 ? 400 : 470),
      `圖譜畫布高度不足：${initial.canvasHeight}px`
    );
    assert.ok(initial.labelHeight >= 10.5, `主要標籤顯示過小：${initial.labelHeight}px`);

    if (viewport.width >= 1440) {
      assert.ok(
        initial.shellWidth >= viewport.width * 0.9,
        `寬版頁面未充分使用視窗：${initial.shellWidth}px / ${viewport.width}px`
      );
    }

    assert.equal(
      await page.locator('.graph-filter-panel').count(),
      0,
      '篩選面板初始應收合'
    );

    logStep(viewport, '開啟篩選並驗證停靠／抽屜');
    const canvasTopBeforeFilter = initial.canvasTop;
    await page.locator('.graph-filter-trigger').click();

    if (initial.explorerWidth >= 940) {
      await page.locator('.graph-explorer--filters').waitFor({ state: 'visible' });
      const docked = await collectMetrics(page);
      assert.ok(
        docked.canvasWidth >= 640,
        `停靠篩選後畫布寬度不足：${docked.canvasWidth}px`
      );
    } else {
      await page.locator('.graph-filter-backdrop').waitFor({ state: 'visible' });
      const drawer = await collectMetrics(page);
      assert.ok(
        Math.abs(drawer.canvasTop - canvasTopBeforeFilter) <= 2,
        '抽屜不應將圖譜往下推'
      );
      await page.keyboard.press('Escape');
      await page.locator('.graph-filter-backdrop').waitFor({ state: 'detached' });
    }

    if (initial.explorerWidth >= 940) {
      await page.locator('.graph-filter-trigger').click();
    }

    logStep(viewport, '驗證搜尋空狀態與清除入口');
    const search = page.locator('.graph-search input[type="search"]');
    await search.fill('__NO_GRAPH_MATCH__');
    await page.locator('.graph-empty-state').waitFor({ state: 'visible' });
    const resultButton = page.locator('.graph-zoom-controls__result');
    assert.equal(await resultButton.isDisabled(), true, '零筆結果時結果定位應停用');
    await page.getByRole('button', { name: '清除搜尋' }).first().click();
    await page.locator('.graph-empty-state').waitFor({ state: 'detached' });

    logStep(viewport, '點選知識卡並驗證詳情面板');
    const firstCard = page.locator('.graph-node--card .graph-node-interactive').first();
    await firstCard.click();
    await page.waitForTimeout(150);
    const selectionState = await page.evaluate(() => ({
      pathname: window.location.pathname,
      selectedNodes: document.querySelectorAll('.graph-node--selected').length,
      inspectors: document.querySelectorAll('.graph-inspector').length,
      filterPanels: document.querySelectorAll('.graph-filter-panel').length,
      explorerClass: document.querySelector('.graph-explorer')?.className ?? ''
    }));
    assert.ok(
      selectionState.pathname.endsWith('/graph') || selectionState.pathname.endsWith('/graph/'),
      `節點點擊不應離開圖譜頁：${JSON.stringify(selectionState)}`
    );
    assert.equal(
      selectionState.selectedNodes,
      1,
      `節點點擊後應有一個選取節點：${JSON.stringify(selectionState)}`
    );
    assert.equal(
      selectionState.inspectors,
      1,
      `節點點擊後應顯示詳情面板：${JSON.stringify(selectionState)}`
    );
    const selectedMetrics = await collectMetrics(page);
    if (await page.locator('.graph-explorer--inspecting').count()) {
      assert.ok(
        selectedMetrics.canvasWidth >= 640,
        `停靠詳情後畫布寬度不足：${selectedMetrics.canvasWidth}px`
      );
    }

    if (await page.locator('.graph-inspector--drawer').count()) {
      await page.keyboard.press('Escape');
      await page.locator('.graph-inspector').waitFor({ state: 'detached' });
    } else {
      await page.locator('.graph-inspector__close').click();
    }

    const screenshotPath = path.join(
      outputDir,
      `${viewport.width}x${viewport.height}.png`
    );
    assert.deepEqual(pageErrors, [], `頁面不應出現 runtime 例外：${pageErrors.join('\n')}`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    logStep(viewport, `截圖：${screenshotPath}`);
  } catch (error) {
    const failurePath = path.join(
      outputDir,
      `failure-${viewport.width}x${viewport.height}.png`
    );
    await page.screenshot({ path: failurePath, fullPage: true }).catch(() => {});
    throw error;
  } finally {
    await context.close();
  }
}

await mkdir(outputDir, { recursive: true });

const preview = spawn(
  npmCommand,
  ['run', 'docs:preview', '--', '--host', host, '--port', String(port)],
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
  await waitForPreview(graphUrl, preview);
  browser = await chromium.launch();

  for (const viewport of viewports) {
    await verifyViewport(browser, viewport);
  }

  process.stdout.write('Knowledge Graph browser verification passed.\n');
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
