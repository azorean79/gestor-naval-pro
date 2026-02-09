// Testa conectividade com outros endpoints relevantes
const https = require('https');

const endpoints = [
  'https://accelerate.prisma-data.net/',
  'https://prisma.io/',
  'https://vercel.com/',
  'https://supabase.co/',
  'https://google.com/'
];

function testEndpoint(url) {
  const options = {
    method: 'GET',
    timeout: 5000
  };
  const req = https.request(url, options, (res) => {
    console.log(`${url} -> status ${res.statusCode}`);
    if (res.statusCode === 200 || res.statusCode === 403) {
      console.log('  ✅ Conexão possível');
    } else {
      console.log('  ❌ Conexão falhou');
    }
  });
  req.on('error', (e) => {
    console.log(`${url} -> ❌ Erro: ${e.message}`);
  });
  req.end();
}

endpoints.forEach(testEndpoint);
