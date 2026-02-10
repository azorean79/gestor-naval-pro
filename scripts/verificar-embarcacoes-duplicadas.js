const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('../prisma/app/generated-prisma-client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) return;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

loadEnvFile(path.join(__dirname, '..', '.env.local'));
loadEnvFile(path.join(__dirname, '..', '.env'));

process.env.DATABASE_URL = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient();

/**
 * Normaliza texto removendo acentos e convertendo para minúsculas
 */
function normalizar(texto) {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

async function main() {
  console.log('🔍 Verificando embarcações duplicadas...\n');
  
  // Buscar todas as embarcações com atividade associada (inspeções, certificados, jangadas)
  const embarcacoes = await prisma.navio.findMany({
    select: {
      id: true,
      nome: true,
      matricula: true,
      tipo: true,
      delegacao: true,
      createdAt: true,
      _count: {
        select: {
          inspecoes: true,
          certificados: true,
          jangadas: true,
        },
      },
    },
    orderBy: {
      nome: 'asc',
    },
  });

  console.log(`📊 Total de embarcações na base de dados: ${embarcacoes.length}\n`);
  
  // Agrupar por nome normalizado
  const grupos = {};
  
  for (const navio of embarcacoes) {
    const nomeNormalizado = normalizar(navio.nome);
    
    if (!grupos[nomeNormalizado]) {
      grupos[nomeNormalizado] = [];
    }
    
    grupos[nomeNormalizado].push(navio);
  }
  
  // Encontrar duplicados
  const duplicados = Object.entries(grupos).filter(([_, navios]) => navios.length > 1);
  
  if (duplicados.length === 0) {
    console.log('✅ Nenhuma embarcação duplicada encontrada!\n');
    return;
  }
  
  console.log(`⚠️  Encontrados ${duplicados.length} grupos de embarcações duplicadas:\n`);
  console.log('═'.repeat(100));
  
  let totalDuplicadas = 0;
  
  for (const [nomeNormalizado, navios] of duplicados) {
    console.log(`\n🔴 Grupo: "${navios[0].nome}" (${navios.length} registos)`);
    console.log('─'.repeat(100));
    
    navios.forEach((navio, index) => {
      const criacao = new Date(navio.createdAt).toLocaleDateString('pt-PT', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      
      const totalAtividades = 
        navio._count.inspecoes + 
        navio._count.certificados + 
        navio._count.jangadas;
      
      const temAtividades = totalAtividades > 0;
      const indicador = temAtividades ? '🟢' : '⚪';
      const atividadesTexto = temAtividades 
        ? `${navio._count.inspecoes} insp, ${navio._count.certificados} cert, ${navio._count.jangadas} jang`
        : 'sem atividades';
      
      console.log(`  ${indicador} ${index + 1}. ID: ${String(navio.id).padEnd(5)} | Nome: "${navio.nome.padEnd(35)}" | Matrícula: ${(navio.matricula || 'N/A').padEnd(18)} | ${(navio.delegacao || 'N/A').padEnd(15)} | ${atividadesTexto.padEnd(45)} | Criado: ${criacao}`);
    });
    
    totalDuplicadas += navios.length - 1; // Conta apenas os extras (menos 1 original)
  }
  
  console.log('\n' + '═'.repeat(100));
  console.log(`\n📊 Resumo:`);
  console.log(`   Total de grupos duplicados: ${duplicados.length}`);
  console.log(`   Total de registos duplicados (extras): ${totalDuplicadas}`);
  console.log(`   Espaço desperdiçado: ${totalDuplicadas} registos\n`);
  
  // Sugestão de limpeza
  console.log('💡 Sugestões:');
  console.log('   🟢 = Embarcação com atividades (inspeções, certificados, jangadas)');
  console.log('   ⚪ = Embarcação sem atividades');
  console.log('   1. Revisar manualmente cada grupo');
  console.log('   2. MANTER embarcações com mais atividades (🟢)');
  console.log('   3. Transferir atividades dos duplicados para o navio principal');
  console.log('   4. Remover duplicados após transferência\n');
  
  // Gerar SQL para remoção (comentado para segurança)
  console.log('📝 SQL para consolidar duplicados (CUIDADO - revisar antes de executar):\n');
  console.log('-- ATENÇÃO: Este SQL vai TRANSFERIR dados e APAGAR registos!');
  console.log('-- Faça backup da base de dados antes de executar!');
  console.log('-- Recomendação: Execute em transação para poder fazer rollback se necessário\n');
  console.log('BEGIN;\n');
  
  for (const [nomeNormalizado, navios] of duplicados) {
    // Calcular total de atividades para cada navio
    const naviosComAtividades = navios.map(n => ({
      ...n,
      totalAtividades: n._count.inspecoes + n._count.certificados + n._count.jangadas
    }));
    
    // Prioridade: navio com mais atividades > mais antigo
    const comAtividades = naviosComAtividades.filter(n => n.totalAtividades > 0);
    
    let manter;
    let paraRemover;
    
    if (comAtividades.length === 1) {
      // Se só um tem atividades, manter esse
      manter = comAtividades[0];
      paraRemover = naviosComAtividades.filter(n => n.id !== manter.id);
    } else if (comAtividades.length > 1) {
      // Se vários têm atividades, manter o com mais atividades, ou o mais antigo em caso de empate
      const ordenados = [...comAtividades].sort((a, b) => {
        if (b.totalAtividades !== a.totalAtividades) {
          return b.totalAtividades - a.totalAtividades; // Mais atividades primeiro
        }
        return new Date(a.createdAt) - new Date(b.createdAt); // Mais antigo primeiro
      });
      manter = ordenados[0];
      paraRemover = naviosComAtividades.filter(n => n.id !== manter.id);
    } else {
      // Se nenhum tem atividades, manter o mais antigo
      const ordenados = [...naviosComAtividades].sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      manter = ordenados[0];
      paraRemover = ordenados.slice(1);
    }
    
    if (paraRemover.length > 0) {
      const atividadesTexto = manter.totalAtividades > 0 
        ? `${manter._count.inspecoes} insp, ${manter._count.certificados} cert, ${manter._count.jangadas} jang`
        : 'sem atividades';
      
      console.log(`-- ════════════════════════════════════════════════════════════════════`);
      console.log(`-- Grupo: "${manter.nome}"`);
      console.log(`-- MANTER: ID ${manter.id} (${atividadesTexto})`);
      console.log(`-- REMOVER: ${paraRemover.length} duplicado(s)\n`);
      
      // Para cada duplicado, transferir todas as relações
      for (const duplicado of paraRemover) {
        const dupAtividades = duplicado.totalAtividades > 0
          ? `${duplicado._count.inspecoes} insp, ${duplicado._count.certificados} cert, ${duplicado._count.jangadas} jang`
          : 'sem atividades';
        
        console.log(`-- Duplicado ID ${duplicado.id} (${dupAtividades})`);
        
        // Transferir inspeções
        if (duplicado._count.inspecoes > 0) {
          console.log(`UPDATE "Inspecao" SET "navioId" = '${manter.id}' WHERE "navioId" = '${duplicado.id}';`);
        }
        
        // Transferir certificados
        if (duplicado._count.certificados > 0) {
          console.log(`UPDATE "Certificado" SET "navioId" = '${manter.id}' WHERE "navioId" = '${duplicado.id}';`);
        }
        
        // Transferir jangadas
        if (duplicado._count.jangadas > 0) {
          console.log(`UPDATE "Jangada" SET "navioId" = '${manter.id}' WHERE "navioId" = '${duplicado.id}';`);
        }
        
        // Transferir agendamentos
        console.log(`UPDATE "Agendamento" SET "navioId" = '${manter.id}' WHERE "navioId" = '${duplicado.id}';`);
        
        // Transferir faturas
        console.log(`UPDATE "Fatura" SET "navioId" = '${manter.id}' WHERE "navioId" = '${duplicado.id}';`);
        
        // Transferir notificações
        console.log(`UPDATE "Notificacao" SET "navioId" = '${manter.id}' WHERE "navioId" = '${duplicado.id}';`);
      }
      
      // Apagar os duplicados
      const ids = paraRemover.map(n => `'${n.id}'`).join(', ');
      console.log(`\n-- Remover duplicados após transferência`);
      console.log(`DELETE FROM "Navio" WHERE id IN (${ids});`);
      console.log();
    }
  }
  
  console.log('\n-- Finalizar transação (se tudo estiver correto)');
  console.log('COMMIT;');
  console.log('\n-- Se algo correu mal, execute: ROLLBACK;\n');
  
  console.log('═'.repeat(100));
  console.log('\n✅ Script de verificação concluído!');
  console.log('\n⚠️  IMPORTANTE:');
  console.log('   1. Revise CUIDADOSAMENTE todo o SQL gerado acima');
  console.log('   2. Faça BACKUP completo da base de dados');
  console.log('   3. Execute o SQL num ambiente de teste primeiro');
  console.log('   4. Copie o SQL (desde BEGIN até COMMIT) e execute-o no cliente PostgreSQL');
  console.log('   5. Se tudo estiver correto, confirme com COMMIT');
  console.log('   6. Se algo estiver errado, execute ROLLBACK para reverter\n');
}

main()
  .catch((err) => {
    console.error('❌ Erro:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
