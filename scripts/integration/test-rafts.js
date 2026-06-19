// Simple integration test: POST a jangada, then GET and verify it's present
(async () => {
  try {
    const base = process.env.BASE_URL || 'http://localhost:3000';
    const serial = 'INT-TEST-' + Date.now();
    const payload = {
      brand: 'TestBrand',
      model: 'T1',
      serial,
      dataFabrico: '2026-03-01',
      packType: 'SOLAS',
      capacity: 10,
      owner: 'IntegrationTest',
      artigos: '[]',
      tuboIdentificacao: 'TUBO-INT-001'
    };

    console.log('Posting jangada to', base + '/api/jangadas');
    const postRes = await fetch(base + '/api/jangadas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!postRes.ok) {
      const txt = await postRes.text();
      console.error('POST failed', postRes.status, txt);
      process.exit(2);
    }
    const created = await postRes.json();
    console.log('Created jangada id=', created.id, 'serial=', created.serial);

    // Now GET list and ensure the created serial exists
    const getRes = await fetch(base + '/api/jangadas');
    if (!getRes.ok) {
      console.error('GET /api/rafts failed', getRes.status);
      process.exit(3);
    }
    const list = await getRes.json();
    const found = list.find ? list.find((r) => r.serial === serial) : (list.some ? list.some((r) => r.serial === serial) : false);
    if (found) {
      console.log('Integration test passed — jangada found in GET list.');
      process.exit(0);
    }
    console.error('Integration test failed — created jangada NOT found in GET list.');
    process.exit(4);
  } catch (err) {
    console.error('Integration test error:', err);
    process.exit(1);
  }
})();
