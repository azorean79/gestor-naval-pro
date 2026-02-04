import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { jangadas, clientes, navios } = await request.json();

    console.log('Iniciando migração de dados...');

    // Migrar Clientes primeiro (para ter as referências)
    if (clientes && Array.isArray(clientes)) {
      console.log(`Migrando ${clientes.length} clientes...`);
      for (const cliente of clientes) {
        await prisma.cliente.create({
          data: {
            nome: cliente.nome,
            email: cliente.email,
            telefone: cliente.telefone,
            endereco: cliente.endereco,
            nif: cliente.nif,
            delegacao: cliente.delegacao || 'Açores',
            tecnico: cliente.tecnico || 'Julio Correia',
          }
        });
      }
    }

    // Migrar Jangadas
    if (jangadas && Array.isArray(jangadas)) {
      console.log(`Migrando ${jangadas.length} jangadas...`);
      for (const jangada of jangadas) {
        // Find or create marca
        let marca = null;
        if (jangada.marca) {
          marca = await prisma.marcaJangada.findFirst({
            where: { nome: jangada.marca, ativo: true }
          });
          if (!marca) {
            marca = await prisma.marcaJangada.create({
              data: { nome: jangada.marca }
            });
          }
        }

        // Find or create modelo
        let modelo = null;
        if (marca && jangada.modelo) {
          modelo = await prisma.modeloJangada.findFirst({
            where: {
              nome: jangada.modelo,
              marcaId: marca.id,
              ativo: true
            }
          });
          if (!modelo) {
            modelo = await prisma.modeloJangada.create({
              data: {
                nome: jangada.modelo,
                marcaId: marca.id
              }
            });
          }
        }

        // Find or create lotacao
        let lotacao = null;
        if (jangada.capacidade) {
          lotacao = await prisma.lotacaoJangada.findFirst({
            where: { capacidade: jangada.capacidade, ativo: true }
          });
          if (!lotacao) {
            lotacao = await prisma.lotacaoJangada.create({
              data: { capacidade: jangada.capacidade }
            });
          }
        }

        await prisma.jangada.create({
          data: {
            numeroSerie: jangada.numeroSerie,
            marcaId: marca?.id,
            modeloId: modelo?.id,
            tipo: jangada.tipo,
            lotacaoId: lotacao?.id,
            tipoPack: jangada.tipoPack,
            itensTipoPack: jangada.itensTipoPack,
            dataFabricacao: jangada.dataFabricacao ? new Date(jangada.dataFabricacao) : null,
            dataInspecao: jangada.dataInspecao ? new Date(jangada.dataInspecao) : null,
            dataProximaInspecao: jangada.dataProximaInspecao ? new Date(jangada.dataProximaInspecao) : null,
            status: jangada.status || 'ativo',
            tecnico: jangada.tecnico || 'Julio Correia',
            proprietarioId: jangada.proprietarioId,
          }
        });
      }
    }

    // Migrar Navios
    if (navios && Array.isArray(navios)) {
      console.log(`Migrando ${navios.length} navios...`);
      for (const navio of navios) {
        await prisma.navio.create({
          data: {
            nome: navio.nome,
            tipo: navio.tipo,
            matricula: navio.matricula,
            bandeira: navio.bandeira || 'Portugal',
            comprimento: navio.comprimento,
            largura: navio.largura,
            calado: navio.calado,
            capacidade: navio.capacidade,
            anoConstrucao: navio.anoConstrucao,
            status: navio.status || 'ativo',
            dataInspecao: navio.dataInspecao ? new Date(navio.dataInspecao) : null,
            dataProximaInspecao: navio.dataProximaInspecao ? new Date(navio.dataProximaInspecao) : null,
            clienteId: navio.clienteId,
            proprietarioId: navio.proprietarioId,
            delegacao: navio.delegacao || 'Açores',
            tecnico: navio.tecnico || 'Julio Correia',
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migração concluída com sucesso!'
    });

  } catch (error) {
    console.error('Erro na migração:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}