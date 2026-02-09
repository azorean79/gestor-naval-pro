import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

async function resolverNaviosDuplicados() {
  console.log('\n' + '='.repeat(80));
  console.log('RESOLUCAO DE NAVIOS DUPLICADOS');
  console.log('='.repeat(80) + '\n');

  // Buscar navios com nomes duplicados (ignorar case)
  const navios = await prisma.navio.findMany();
  
  const naviosPorNome = new Map<string, typeof navios>();
  
  for (const navio of navios) {
    const nomeNormalizado = navio.nome.toUpperCase();
    if (!naviosPorNome.has(nomeNormalizado)) {
      naviosPorNome.set(nomeNormalizado, []);
    }
    naviosPorNome.get(nomeNormalizado)!.push(navio);
  }

  console.log(`Total de navios na BD: ${navios.length}`);
  console.log(`Nomes únicos: ${naviosPorNome.size}\n`);

  let duplicadosEncontrados = 0;
  let duplicadosResolvidos = 0;

  // Processar duplicados
  for (const [nomeNormalizado, naviosList] of naviosPorNome.entries()) {
    if (naviosList.length > 1) {
      duplicadosEncontrados += naviosList.length - 1;
      console.log(`\n[DUPLICADO] ${nomeNormalizado} (${naviosList.length} registros)`);
      
      // Manter o primeiro e mesclar os outros
      const navioManter = naviosList[0];
      console.log(`  Mantendo: ${navioManter.id} (${navioManter.nome})`);
      
      for (let i = 1; i < naviosList.length; i++) {
        const navioRemover = naviosList[i];
        console.log(`  Mesclando: ${navioRemover.id} (${navioRemover.nome})`);
        
        try {
          // Redirecionar certificados do navio a remover para o navio a manter
          await prisma.certificado.updateMany({
            where: { navioId: navioRemover.id },
            data: { navioId: navioManter.id }
          });
          
          console.log(`    ✓ Certificados redirecionados`);
          duplicadosResolvidos++;
          
          // Remover navio duplicado
          await prisma.navio.delete({
            where: { id: navioRemover.id }
          });
          
          console.log(`    ✓ Navio duplicado removido`);
        } catch (error: any) {
          console.log(`    ✗ Erro ao mesclar: ${error.message}`);
        }
      }
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('RESUMO');
  console.log(`${'='.repeat(80)}`);
  console.log(`Duplicados encontrados: ${duplicadosEncontrados}`);
  console.log(`Duplicados resolvidos: ${duplicadosResolvidos}`);

  // Verificar navios sem certificados
  const naviosVazios = await prisma.navio.findMany({
    include: {
      certificados: true,
      jangadas: true
    }
  });

  const semDados = naviosVazios.filter(n => n.certificados.length === 0 && n.jangadas.length === 0);
  console.log(`Navios sem certificados/jangadas: ${semDados.length}`);

  if (semDados.length > 0 && semDados.length <= 10) {
    console.log('\nNavios vazios:');
    for (const navio of semDados) {
      console.log(`  - ${navio.nome}`);
    }
  }
}

async function main() {
  try {
    await resolverNaviosDuplicados();
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
