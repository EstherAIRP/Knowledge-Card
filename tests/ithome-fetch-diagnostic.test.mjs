import test from 'node:test';
import { chromium } from 'playwright';

const targets = [
  'https://ithelp.ithome.com.tw/articles/10379767',
  'https://ithelp.ithome.com.tw/m/articles/10379767'
];

const browserHeaders = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'accept-language': 'zh-TW,zh;q=0.9,en;q=0.8',
  'cache-control': 'no-cache',
  'pragma': 'no-cache',
  'upgrade-insecure-requests': '1'
};

function summarizeText(text = '') {
  return {
    length: text.length,
    sample: text.slice(0, 500).replace(/\s+/g, ' ').trim()
  };
}

test('diagnose iThome body fetch paths', async () => {
  for (const url of targets) {
    for (const [mode, headers] of [
      ['plain_fetch', {}],
      ['browser_headers_fetch', browserHeaders]
    ]) {
      try {
        const response = await fetch(url, {
          headers,
          redirect: 'follow',
          signal: AbortSignal.timeout(30000)
        });
        const body = await response.text();
        console.log('ITHOME_DIAG', JSON.stringify({
          mode,
          url,
          status: response.status,
          final_url: response.url,
          content_type: response.headers.get('content-type'),
          ...summarizeText(body)
        }));
      } catch (error) {
        console.log('ITHOME_DIAG', JSON.stringify({
          mode,
          url,
          error: error?.message || String(error),
          code: error?.code || null
        }));
      }
    }
  }

  for (const readerUrl of [
    'https://r.jina.ai/http://ithelp.ithome.com.tw/articles/10379767',
    'https://r.jina.ai/https://ithelp.ithome.com.tw/articles/10379767'
  ]) {
    try {
      const response = await fetch(readerUrl, {
        headers: { 'user-agent': browserHeaders['user-agent'] },
        signal: AbortSignal.timeout(30000)
      });
      const body = await response.text();
      console.log('ITHOME_DIAG', JSON.stringify({
        mode: 'jina_reader',
        url: readerUrl,
        status: response.status,
        final_url: response.url,
        content_type: response.headers.get('content-type'),
        ...summarizeText(body)
      }));
    } catch (error) {
      console.log('ITHOME_DIAG', JSON.stringify({
        mode: 'jina_reader',
        url: readerUrl,
        error: error?.message || String(error)
      }));
    }
  }

  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch (channelError) {
    try {
      browser = await chromium.launch({ headless: true });
    } catch (bundledError) {
      console.log('ITHOME_DIAG', JSON.stringify({
        mode: 'playwright',
        error: 'browser_launch_failed',
        channel_error: channelError?.message || String(channelError),
        bundled_error: bundledError?.message || String(bundledError)
      }));
      return;
    }
  }

  try {
    const context = await browser.newContext({
      userAgent: browserHeaders['user-agent'],
      locale: 'zh-TW',
      viewport: { width: 1365, height: 1800 },
      extraHTTPHeaders: {
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8'
      }
    });
    const page = await context.newPage();

    for (const url of targets) {
      try {
        const response = await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 30000
        });
        await page.waitForTimeout(3000);
        const bodyText = await page.locator('body').innerText().catch(() => '');
        console.log('ITHOME_DIAG', JSON.stringify({
          mode: 'playwright',
          url,
          status: response?.status() ?? null,
          final_url: page.url(),
          title: await page.title(),
          ...summarizeText(bodyText)
        }));
      } catch (error) {
        console.log('ITHOME_DIAG', JSON.stringify({
          mode: 'playwright',
          url,
          error: error?.message || String(error),
          final_url: page.url()
        }));
      }
    }
    await context.close();
  } finally {
    await browser.close();
  }
});
