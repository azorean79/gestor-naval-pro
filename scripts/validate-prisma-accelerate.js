// Valida PRISMA_DATABASE_URL para Accelerate
const fs = require('fs');
const path = require('path');

function getEnvValue(key) {
  // Procura em .env.local, depois .env
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
  return true;
}

validatePrismaAccelerate();
