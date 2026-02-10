// scripts/auto-seed-e-restore.js
// Automatiza o seed local e restaura o ambiente Accelerate

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const ENV_PATH = path.resolve(__dirname, '../.env');
const ENV_BACKUP_PATH = path.resolve(__dirname, '../.env.backup-auto-seed');
const ENV_LOCAL_PATH = path.resolve(__dirname, '../.env.local-seed');

// 1. Backup do .env atual
if (!fs.existsSync(ENV_BACKUP_PATH)) {
  fs.copyFileSync(ENV_PATH, ENV_BACKUP_PATH);
  console.log('Backup do .env criado:', ENV_BACKUP_PATH);
}

// 2. Troca DATABASE_URL para o PostgreSQL normal
defineLocalEnv();
fs.copyFileSync(ENV_LOCAL_PATH, ENV_PATH);
console.log('Arquivo .env trocado para ambiente local.');


// 3. Remove Prisma Client antigo e gera novo para ambiente local
removePrismaClient();
run('npx prisma generate', 'Gerando Prisma Client padrão...');

// 4. Executa o seed
run('node scripts/seed-dados-minimos.js', 'Executando seed...');

// 5. Restaura o .env original (Accelerate)
fs.copyFileSync(ENV_BACKUP_PATH, ENV_PATH);
console.log('Arquivo .env restaurado para Accelerate.');


// 6. Remove Prisma Client antigo e gera novo para Accelerate
removePrismaClient();
run('npx prisma generate', 'Gerando Prisma Client para Accelerate...');
function removePrismaClient() {
  const prismaClientPath = path.resolve(__dirname, '../node_modules/@prisma/client');
  if (fs.existsSync(prismaClientPath)) {
    fs.rmSync(prismaClientPath, { recursive: true, force: true });
    console.log('Pasta @prisma/client removida para garantir geração limpa.');
    // Garante que o pacote está instalado
    try {
      execSync('npm install @prisma/client', { stdio: 'inherit' });
    } catch (e) {
      console.error('Erro ao instalar @prisma/client');
      process.exit(1);
    }
  }
}

console.log('\n✅ Processo automatizado concluído!');

// Funções auxiliares
function run(cmd, msg) {
  console.log('\n' + msg);
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    console.error('Erro ao executar:', cmd);
    process.exit(1);
  }
}

function defineLocalEnv() {
  // O usuário deve criar um arquivo .env.local-seed com o DATABASE_URL do PostgreSQL normal
  if (!fs.existsSync(ENV_LOCAL_PATH)) {
    console.error('\nCrie um arquivo .env.local-seed com o DATABASE_URL do PostgreSQL normal (não Accelerate)!');
    process.exit(1);
  }
}
