import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function vincularBateria() {
  try {
    console.log('\n🔋 VINCULANDO BATERIA (TOP LIGHT AND BATTERY) ÀS JANGADAS SURVIVA MKIV E LR07\n');
    console.log('================================================================================');

    // 1. Find the battery in Stock
    const bateria = await prisma.stock.findUnique({
      where: { referencia: '30202205' }
    });

    if (!bateria) {
      console.log('❌ Bateria não encontrada no Stock (referência: 30202205)');
      return;
    }

    console.log('\n✅ Encontrado no Stock:');
    console.log(`   Nome: ${bateria.descricao}`);
    console.log(`   Referência: ${bateria.referencia}`);
    console.log(`   Quantidade: ${bateria.quantidade} unidades`);
    console.log(`   Preço: €${bateria.precoVenda}\n`);

    // 2. Create or find Artigo entry
    let artigo = await prisma.artigo.findFirst({
      where: { referencia: '30202205' }
    });

    if (!artigo) {
      artigo = await prisma.artigo.create({
        data: {
          name: 'Top Light and Battery',
          referencia: '30202205',
          descricao: 'Bateria RL6 - Top Light and Battery'
        }
      });
      console.log('✅ Artigo criado: Top Light and Battery (ID: ' + artigo.id + ')');
    } else {
      console.log('✅ Artigo já existe: Top Light and Battery (ID: ' + artigo.id + ')');
    }

    // 3. Find jangadas of type Surviva MKIV and LR07
    const jangadasMKIV = await prisma.jangada.findMany({
      where: {
        OR: [
          {
            brand: {
              contains: 'Surviva MKIV',
              mode: 'insensitive'
            }
          },
          {
            model: {
              contains: 'Surviva MKIV',
              mode: 'insensitive'
            }
          }
        ]
      }
    });

    const jangadasLR07 = await prisma.jangada.findMany({
      where: {
        OR: [
          {
            brand: {
              contains: 'LR07',
              mode: 'insensitive'
            }
          },
          {
            model: {
              contains: 'LR07',
              mode: 'insensitive'
            }
          }
        ]
      }
    });

    const todasJangadas = [...jangadasMKIV, ...jangadasLR07];
    const jangadasUnicas = Array.from(new Map(todasJangadas.map(j => [j.id, j])).values());

    console.log(`\n🔍 Encontradas ${jangadasMKIV.length} jangadas Surviva MKIV`);
    console.log(`🔍 Encontradas ${jangadasLR07.length} jangadas LR07`);
    console.log(`📦 Total de jangadas: ${jangadasUnicas.length}\n`);

    if (jangadasUnicas.length === 0) {
      console.log('⚠️  Nenhuma jangada Surviva MKIV ou LR07 encontrada!');
      return;
    }

    // 4. Link battery to jangadas
    console.log('⚡ Processando jangadas...\n');

    let adicionadas = 0;
    let jaExistentes = 0;

    for (let i = 0; i < jangadasUnicas.length; i++) {
      const jangada = jangadasUnicas[i];

      // Check if battery already linked
      const temArtigo = await prisma.artigoJangada.findFirst({
        where: {
          jangadaId: jangada.id,
          referencia: '30202205'
        }
      });

      if (temArtigo) {
        jaExistentes++;
      } else {
        await prisma.artigoJangada.create({
          data: {
            name: 'Top Light and Battery',
            jangadaId: jangada.id,
            referencia: '30202205',
            quantidade: 1
          }
        });
        adicionadas++;
      }

      // Progress logging
      if ((i + 1) % 10 === 0 || (i + 1) === jangadasUnicas.length) {
        console.log(`  Processadas: ${i + 1}/${jangadasUnicas.length}`);
      }
    }

    console.log('\n================================================================================');
    console.log('✅ RESUMO FINAL\n');
    console.log(`✅ Baterias adicionadas: ${adicionadas}`);
    console.log(`ℹ️  Já existentes: ${jaExistentes}`);
    console.log(`📦 Total de jangadas com Top Light and Battery: ${adicionadas + jaExistentes}/${jangadasUnicas.length}`);

    // Verification
    const verificacao = await prisma.artigoJangada.count({
      where: {
        referencia: '30202205'
      }
    });

    console.log(`\n🔍 Verificação: ${verificacao} jangadas têm Top Light and Battery`);

    // Show examples
    const exemplos = await prisma.artigoJangada.findMany({
      where: { referencia: '30202205' },
      include: { Jangada: true },
      take: 5
    });

    if (exemplos.length > 0) {
      console.log(`\n📋 Exemplos de jangadas com Top Light and Battery:`);
      exemplos.forEach(ex => {
        console.log(`  • ${ex.Jangada.serial} (${ex.Jangada.brand} ${ex.Jangada.model})`);
      });
    }

    console.log('\n================================================================================');
    console.log('\n✅ Vinculação de Top Light and Battery concluída com sucesso!\n');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

vincularBateria();
