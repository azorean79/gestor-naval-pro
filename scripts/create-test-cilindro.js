const http = require('http');

const payload = {
  numeroSerie: 'CIL-20260225-LEAF',
  pesoBruto: 12.5,
  tara: 3.4,
  quantidadeCO2: 5,
  quantidadeN2: 0,
  testeHidraulico: '2024-01-01',
  proximoTesteHidraulico: '2026-01-01',
  tipoSistemaInsuflacao: 'leafield',
  tipo: 'CO2+N2',
  status: 'ativo',
  localizacao: 'Armazem A',
  proprietario: 'Empresa X',
  observacoes: 'Criado por script de teste via agent'
};

const data = JSON.stringify(payload);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/cilindros',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  },
  timeout: 30000
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log('HEADERS', res.headers);
    try {
      console.log('BODY', JSON.parse(body));
    } catch (e) {
      console.log('BODY', body);
    }
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.error('REQ ERROR', err.message);
  process.exit(2);
});

req.write(data);
req.end();
