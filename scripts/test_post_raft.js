const http = require('http');
const fetch = require('node-fetch');

const ports = [3000, 3001];

async function probe() {
  for (const port of ports) {
    try {
      const res = await fetch(`http://localhost:${port}/api/rafts`, { method: 'GET' });
      if (res.ok || res.status === 500) return port; // reachable
    } catch (e) {
      // ignore
    }
  }
  throw new Error('No responsive dev server on ports 3000/3001');
}

(async function() {
  try {
    const port = await probe();
    console.log('Using port', port);

    const sample = {
      brand: 'TestBrand',
      model: 'TB-1',
      serial: `TEST-${Date.now()}`,
      dataFabrico: '2024-01-01',
      packType: 'TypeA',
      capacity: 4,
      owner: 'TestOwner'
    };

    console.log('Posting sample jangada:', sample.serial);
    const postRes = await fetch(`http://localhost:${port}/api/rafts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sample),
    });
    const postText = await postRes.text();
    console.log('POST status', postRes.status, postText);

    // Try GET list
    const getRes = await fetch(`http://localhost:${port}/api/rafts`);
    const getText = await getRes.text();
    console.log('GET status', getRes.status, getText.slice(0, 1000));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
