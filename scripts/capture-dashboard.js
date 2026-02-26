const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function waitForServer(url, timeout = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return true;
    } catch (e) {
      // ignore
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

;(async () => {
  const url = 'http://localhost:3000/dashboard';
  console.log('Waiting for', url);
  const ok = await waitForServer('http://localhost:3000');
  if (!ok) {
    console.error('Server not responding at http://localhost:3000');
    process.exit(2);
  }

  const outDir = path.resolve(__dirname, '..', 'test-results');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({ args: ['--no-sandbox'], defaultViewport: { width: 1280, height: 800 } });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    const screenshotPath = path.join(outDir, 'dashboard.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    const html = await page.content();
    fs.writeFileSync(path.join(outDir, 'dashboard.html'), html, 'utf8');
    console.log('Saved', screenshotPath, 'and dashboard.html');
  } catch (err) {
    console.error('Capture failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
