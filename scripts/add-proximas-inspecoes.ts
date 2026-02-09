import { prisma } from '../src/lib/prisma';
import { addDays } from 'date-fns';

async function main() {
  console.log('🔍 Buscando marcas e modelos recém-criados...\n');

  // Buscar CREWSAVER e EUROVINIL
  const crewsaver = await prisma.marcaJangada.findFirst({
    where: { nome: 'CREWSAVER' }
  });

  const eurovinil = await prisma.marcaJangada.findFirst({
    where: { nome: 'EUROVINIL' }
  });

  if (!crewsaver && !eurovinil) {
    console.log('❌ Marcas CREWSAVER e EUROVINIL não encontradas');
    return;
  }

  // Buscar modelos SYNTESY
  const modelos = await prisma.modeloJangada.findMany({
    where: {
      OR: [
        { marcaId: crewsaver?.id },
        { 
          AND: [
            { marcaId: eurovinil?.id },
            { nome: { contains: 'SYNTESY' } }
          ]
        }
      ]
    },
    include: {
      marca: true
    }
  });

  if (modelos.length === 0) {
    console.log('❌ Nenhum modelo SYNTESY ou CREWSAVER encontrado');
    return;
  }

  console.log(`✅ Encontrados ${modelos.length} modelos:\n`);
  modelos.forEach(m => console.log(`   - ${m.marca.nome} ${m.nome}`));
  console.log('\n🔍 Buscando jangadas destes modelos...\n');

  // Buscar jangadas desses modelos
  const jangadas = await prisma.jangada.findMany({
    where: {
      modeloId: { in: modelos.map(m => m.id) }
    },
    take: 10,
    include: {
      navio: true,
      marca: true,
      modelo: true,
    }
  });

  if (jangadas.length === 0) {
    console.log('⚠️  Nenhuma jangada encontrada destes modelos');
    console.log('💡 Crie jangadas primeiro ou o script não terá dados para atualizar');
    return;
  }

  const hoje = new Date();
  const datasInspecao = [
    addDays(hoje, 5),   // daqui a 5 dias
    addDays(hoje, 10),  // daqui a 10 dias
    addDays(hoje, 15),  // daqui a 15 dias
    addDays(hoje, 20),  // daqui a 20 dias
    addDays(hoje, 25),  // daqui a 25 dias
    addDays(hoje, 28),  // daqui a 28 dias
  ];

  console.log('📅 Definindo datas de inspeção próximas:\n');

  for (let i = 0; i < Math.min(jangadas.length, datasInspecao.length); i++) {
    const jangada = jangadas[i];
    const dataInspecao = datasInspecao[i];

    const updated = await prisma.jangada.update({
      where: { id: jangada.id },
      data: {
        dataProximaInspecao: dataInspecao,
        // ...existing code...
      }
    });

    const marcaModelo = `${jangada.marca?.nome || 'N/A'} ${jangada.modelo?.nome || 'N/A'}`;
    const navio = jangada.navio?.nome || 'N/A';

    console.log(`✅ Jangada S/N ${jangada.numeroSerie}`);
    console.log(`   Modelo: ${marcaModelo}`);
    console.log(`   Navio: ${navio}`);
    console.log(`   Próxima inspeção: ${dataInspecao.toLocaleDateString('pt-PT')}`);
    console.log('');
  }

  console.log(`\n✨ ${Math.min(jangadas.length, datasInspecao.length)} jangadas atualizadas com inspeções próximas!`);
  console.log('\n💡 Agora você pode arrastá-las para o calendário na página /agenda');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  });
