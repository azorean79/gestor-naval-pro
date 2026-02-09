// Validação avançada do PRISMA_DATABASE_URL e conectividade
const fs = require('fs');
const path = require('path');
const https = require('https');

function getEnvValue(key) {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const match = content.match(new RegExp(`${key}\s*=\s*([^"]+|"[^"]+")`));
      if (match) {
        let value = match[1].replace(/^"|"$/g, '');
        return value;
      }
    }
  }
  return null;
}

function validatePrismaAccelerate() {
  const prismaUrl = getEnvValue('PRISMA_DATABASE_URL');
  if (!prismaUrl) {
    console.log('❌ PRISMA_DATABASE_URL não encontrado em .env ou .env.local');
    return false;
  }
  if (!prismaUrl.startsWith('prisma+postgres://')) {
    console.log('❌ Connection string inválido: deve começar com prisma+postgres://');
    return false;
  }
  if (!prismaUrl.includes('api_key=')) {
    console.log('❌ Connection string inválido: api_key ausente');
    return false;
  }
  console.log('✅ Connection string Accelerate válido!');
  return prismaUrl;
}

function testAccelerateConnectivity(prismaUrl) {
  // Extrai o host do connection string
  const hostMatch = prismaUrl.match(/prisma\+postgres:\/\/([^\/\?]+)/);
  if (!hostMatch) {
    console.log('❌ Não foi possível extrair o host do connection string.');
    return;
  }
  const host = hostMatch[1];
  const options = {
    hostname: host,
    port: 443,
    method: 'GET',
    path: '/',
    timeout: 5000
  };
  const req = https.request(options, (res) => {
    console.log(`Conectividade Accelerate: status ${res.statusCode}`);
    if (res.statusCode === 200 || res.statusCode === 403) {
      console.log('✅ Conexão com Accelerate possível (status 200 ou 403).');
    } else {
      console.log('❌ Conexão com Accelerate falhou.');
    }
  });
  req.on('error', (e) => {
    console.log('❌ Erro de conexão com Accelerate:', e.message);
  });
  req.end();
}

const prismaUrl = validatePrismaAccelerate();
if (prismaUrl) {
  testAccelerateConnectivity(prismaUrl);
}
