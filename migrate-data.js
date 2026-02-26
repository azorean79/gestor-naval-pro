const { PrismaClient } = require('@prisma/client');

async function migrateData() {
  const prisma = new PrismaClient();

  try {
    console.log('Iniciando migração de dados do localStorage para Prisma...');

    // Migrar Jangadas
    console.log('Migrando jangadas...');
    const jangadasData = localStorage.getItem('jangadas_data');
    if (jangadasData) {
      const jangadas = JSON.parse(jangadasData);
      for (const jangada of jangadas) {
        await prisma.jangada.create({
          data: {
            numero: jangada.numeroSerie || `JNG-${Date.now()}`,
            nome: jangada.numeroSerie || 'Jangada',
            proprietario: jangada.proprietario || 'Não informado',
            numeroSerie: jangada.numeroSerie,
            marca: jangada.marca,
            modelo: jangada.modelo,
            lotacao: jangada.capacidade,
            dataFabricacao: jangada.dataFabricacao ? new Date(jangada.dataFabricacao) : null,
            tipoPack: jangada.tipoPack,
            status: jangada.status || 'ativo',
            ilha: 'São Miguel', // Default
            ultimaInspecao: jangada.dataInspecao ? new Date(jangada.dataInspecao) : null,
            proximaInspecao: jangada.dataProximaInspecao ? new Date(jangada.dataProximaInspecao) : null,
            observacoes: jangada.observacoes
          }
        });
      }
      console.log(`✓ Migradas ${jangadas.length} jangadas`);
    }

    // Migrar Clientes
    console.log('Migrando clientes...');
    const clientesData = localStorage.getItem('gestor-naval-clientes');
    if (clientesData) {
      const clientes = JSON.parse(clientesData);
      for (const cliente of clientes) {
        await prisma.cliente.create({
          data: {
            nome: cliente.nome,
            tipo: cliente.tipo || 'pessoa_fisica',
            nif: cliente.nif,
            email: cliente.email,
            telefone: cliente.telefone,
            morada: cliente.endereco,
            status: 'ativo',
            ilha: cliente.delegacao === 'Açores' ? 'São Miguel' : cliente.delegacao,
            dataNascimento: cliente.dataNascimento ? new Date(cliente.dataNascimento) : null,
            profissao: cliente.profissao,
            empresa: cliente.empresa,
            observacoes: cliente.observacoes
          }
        });
      }
      console.log(`✓ Migrados ${clientes.length} clientes`);
    }

    // Migrar Navios
    console.log('Migrando navios...');
    const naviosData = localStorage.getItem('navios_data');
    if (naviosData) {
      const navios = JSON.parse(naviosData);
      for (const navio of navios) {
        await prisma.navio.create({
          data: {
            nome: navio.nome,
            imo: navio.imo,
            mmsi: navio.mmsi,
            matricula: navio.matricula,
            bandeira: navio.bandeira,
            ilha: navio.ilha,
            portoEscala: navio.portoEscala,
            tipo: navio.tipo,
            comprimento: navio.comprimento,
            largura: navio.largura,
            calado: navio.calado,
            capacidade: navio.capacidade,
            proprietario: navio.proprietario,
            armador: navio.armador,
            status: navio.status || 'ativo',
            ultimaInspecao: navio.ultimaInspecao ? new Date(navio.ultimaInspecao) : null,
            proximaInspecao: navio.proximaInspecao ? new Date(navio.proximaInspecao) : null,
            observacoes: navio.observacoes
          }
        });
      }
      console.log(`✓ Migrados ${navios.length} navios`);
    }

    // Migrar Inspeções
    console.log('Migrando inspeções...');
    const inspecoesData = localStorage.getItem('inspecoes_data');
    if (inspecoesData) {
      const inspecoes = JSON.parse(inspecoesData);
      for (const inspecao of inspecoes) {
        await prisma.inspecao.create({
          data: {
            equipamentoId: inspecao.equipamentoId,
            equipamentoNome: inspecao.equipamentoNome,
            clienteId: inspecao.clienteId,
            clienteNome: inspecao.clienteNome,
            tipoInspecao: inspecao.tipoInspecao,
            tecnico: inspecao.tecnico,
            dataInspecao: new Date(inspecao.dataInspecao),
            status: inspecao.status,
            checklist: JSON.stringify(inspecao.checklist || []),
            observacoesGerais: inspecao.observacoesGerais,
            dataConclusao: inspecao.dataConclusao ? new Date(inspecao.dataConclusao) : null
          }
        });
      }
      console.log(`✓ Migradas ${inspecoes.length} inspeções`);
    }

    console.log('✅ Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar apenas se estiver no Node.js (não no browser)
if (typeof window === 'undefined') {
  migrateData();
}