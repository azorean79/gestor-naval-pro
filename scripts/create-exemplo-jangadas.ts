import { prisma } from '../src/lib/prisma';
import { addDays } from 'date-fns';

async function main() {
  console.log('🔍 Criando jangadas de exemplo dos novos modelos...\n');

  // Buscar marcas
  const marcas = await prisma.marcaJangada.findMany({
    where: {
      nome: { in: ['CREWSAVER', 'EUROVINIL', 'RFD', 'DSB'] }
    }
  });

  if (marcas.length === 0) {
    console.log('❌ Marcas não encontradas');
    return;
  }

  console.log(`✅ Encontradas ${marcas.length} marcas: ${marcas.map(m => m.nome).join(', ')}\n`);

  // Buscar modelos dessas marcas
  const modelos = await prisma.modeloJangada.findMany({
    where: {
      marcaId: { in: marcas.map(m => m.id) }
    },
    include: {
      marca: true
    },
    take: 15  // Aumentar limite para pegar mais modelos
  });

  console.log(`✅ Encontrados ${modelos.length} modelos\n`);

  // Buscar um navio para associar
  const navio = await prisma.navio.findFirst();

  if (!navio) {
    console.log('❌ Nenhum navio encontrado. Crie um navio primeiro.');
    return;
  }

  console.log(`📦 Usando navio: ${navio.nome}\n`);

  const hoje = new Date();
  
  let count = 0;

  // Criar 1 jangada de cada modelo
  for (let i = 0; i < modelos.length; i++) {
    const modelo = modelos[i];
    // Distribuir datas entre 5 e 30 dias
    const diasAte = 5 + (i * 3); // 5, 8, 11, 14, 17, 20, 23, 26, 29...
    const dataInspecao = addDays(hoje, Math.min(diasAte, 30));

    // Extrair capacidade do nome do modelo se possível
    const capacidadeMatch = modelo.nome.match(/(\d+)P/);
    const capacidade = capacidadeMatch ? parseInt(capacidadeMatch[1]) : 6;

    const jangada = await prisma.jangada.create({
      data: {
        numeroSerie: `TESTE-${modelo.marca.nome.substring(0, 3)}-${modelo.nome.substring(0, 6)}-${i + 1}`,
        marca: { connect: { id: modelo.marcaId } },
        modelo: { connect: { id: modelo.id } },
        navio: { connect: { id: navio.id } },
        tipo: 'SOLAS',
        capacidade: capacidade,
        dataFabricacao: new Date(2024, 0, 1),
        dataProximaInspecao: dataInspecao,
        dataInspecao: addDays(hoje, -365), // última inspeção há 1 ano
        estado: 'BOM',
      }
    });

    console.log(`✅ Criada: S/N ${jangada.numeroSerie}`);
    console.log(`   Modelo: ${modelo.marca.nome} ${modelo.nome}`);
    console.log(`   Próxima inspeção: ${dataInspecao.toLocaleDateString('pt-PT')}`);
    console.log('');

    count++;
  }

  console.log(`\n✨ ${count} jangadas de teste criadas com inspeções próximas!`);
  console.log('\n💡 Agora você pode ver estas jangadas na sidebar da página /agenda');
  console.log('💡 Arraste-as para o calendário para criar agendamentos');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  });
