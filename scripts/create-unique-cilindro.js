#!/usr/bin/env node
const fetch = globalThis.fetch || require('node-fetch');
const numero = process.argv[2] || `CIL-${Date.now()}-TEST`;
const payload = {
  numeroSerie: numero,
  tipo: 'CO2+N2',
  tipoSistemaInsuflacao: 'leafield',
  pesoBruto: 12.5,
  tara: 2.3,
  status: 'operacional',
  observacoes: 'Teste automático'
};

(async ()=>{
  try {
    const res = await fetch('http://localhost:3000/api/cilindros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log('STATUS', res.status);
    const txt = await res.text();
    try { console.log(JSON.parse(txt)); } catch(e) { console.log(txt); }
  } catch (err) {
    console.error('ERROR', err && err.message ? err.message : err);
    process.exit(2);
  }
})();
