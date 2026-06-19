import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function vincularArtigoMarcas() {
  try {
    console.log('\n💊 VINCULANDO ARTIGO ÀS JANGADAS DE MARCA EV/EUROVINIL\n');
    console.log('================================================================================');

    // 1. Find the article in Stock
    const artigo = await prisma.stock.findUnique({
      where: { referencia: '30202051' }
    });

    if (!artigo) {
      console.log('❌ Artigo não encontrado no Stock (referência: 30202051)');
      return;
    }

    console.log('\n✅ Encontrado no Stock:');
    console.log(`   Nome: ${artigo.descricao}`);
    console.log(`   Referência: ${artigo.referencia}`);
    console.log(`   Quantidade: ${artigo.quantidade} unidades`);
    console.log(`   Preço: €${artigo.precoVenda}\n`);

    // 2. Find jangadas of brand EV or Eurovinil
    const jangadas = await prisma.jangada.findMany({
      where: {
        OR: [
          {
            brand: {
              contains: 'EV',
              mode: 'insensitive'
            }
          },
          {
            brand: {
              contains: 'EUROVINIL',
              mode: 'insensitive'
            }
          }
        ]
      }
    });

    console.log(`🔍 Encontradas ${jangadas.length} jangadas de marca EV/Eurovinil`);

    if (jangadas.length === 0) {
      console.log('⚠️  Nenhuma jangada EV ou Eurovinil encontrada!');
      return;
    }

    // 3. Link article to jangadas
    console.log(`\n⚡ Processando ${jangadas.length} jangadas...\n`);

    let adicionadas = 0;
    let jaExistentes = 0;

    for (let i = 0; i < jangadas.length; i++) {
      const jangada = jangadas[i];

      // Check if article already linked
      const temArtigo = await prisma.artigoJangada.findFirst({
        where: {
          jangadaId: jangada.id,
          referencia: '30202051'
        }
      });

      if (temArtigo) {
        jaExistentes++;
      } else {
        await prisma.artigoJangada.create({
          data: {
            name: 'Seasickness Tablets (Comprimidos)',
            jangadaId: jangada.id,
            referencia: '30202051',
            quantidade: 1
          }
        });
        adicionadas++;
      }

      // Progress logging
      if ((i + 1) % 10 === 0 || (i + 1) === jangadas.length) {
        console.log(`  Processadas: ${i + 1}/${jangadas.length}`);
      }
    }

    console.log('\n================================================================================');
    console.log('✅ RESUMO FINAL\n');
    console.log(`✅ Artigos adicionados: ${adicionadas}`);
    console.log(`ℹ️  Já existentes: ${jaExistentes}`);
    console.log(`📦 Total de jangadas com Seasickness Tablets: ${adicionadas + jaExistentes}/${jangadas.length}`);

    // Verification
    const verificacao = await prisma.artigoJangada.count({
      where: {
        referencia: '30202051'
      }
    });

    console.log(`\n🔍 Verificação: ${verificacao} jangadas têm Seasickness Tablets`);

    // Show examples
    const exemplos = await prisma.artigoJangada.findMany({
      where: { referencia: '30202051' },
      include: { Jangada: true },
      take: 5
    });

    if (exemplos.length > 0) {
      console.log(`\n📋 Exemplos de jangadas EV/Eurovinil com Seasickness Tablets:`);
      exemplos.forEach(ex => {
        console.log(`  • ${ex.Jangada.serial} (${ex.Jangada.brand} ${ex.Jangada.model})`);
      });
    }

    console.log('\n================================================================================');
    console.log('\n✅ Vinculação concluída com sucesso!\n');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

vincularArtigoMarcas();
