const puppeteer = require('puppeteer');
const fs = require('fs');
(async () => {
  const out = [];
  let browser;
  try {
    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    page.on('console', msg => {
      try {
        out.push({ type: 'console', text: msg.text(), location: msg.location && msg.location() });
      } catch (e) {
        out.push({ type: 'console', text: msg.text() });
      }
    });

    page.on('pageerror', err => {
      out.push({ type: 'pageerror', message: err.message, stack: err.stack });
    });

    page.on('error', err => {
      out.push({ type: 'error', message: err.message });
    });

    const url = 'http://localhost:3000/stock';
    try {
      const res = await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
      out.unshift({ type: 'response', status: res ? res.status() : null, url });
    } catch (e) {
      out.push({ type: 'gotoError', message: e.message });
    }

    try {
      await page.screenshot({ path: '.tmp/stock.png', fullPage: true });
      out.push({ type: 'screenshot', path: '.tmp/stock.png' });
    } catch (e) {
      out.push({ type: 'screenshotError', message: e.message });
    }

    console.log(JSON.stringify(out, null, 2));
  } catch (err) {
    console.error('Fatal error:', err && err.message);
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
  }
})();
