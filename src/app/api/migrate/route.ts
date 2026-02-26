import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { jangadas, clientes, navios, inspecoes } = await request.json();

    console.log('Iniciando migração de dados...');

    // Migrar Jangadas
    if (jangadas && Array.isArray(jangadas)) {
      console.log(`Migrando ${jangadas.length} jangadas...`);
      for (const jangada of jangadas) {
        await prisma.jangada.create({
          data: ({
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
            ilha: 'São Miguel',
            ultimaInspecao: jangada.dataInspecao ? new Date(jangada.dataInspecao) : null,
            proximaInspecao: jangada.dataProximaInspecao ? new Date(jangada.dataProximaInspecao) : null,
            observacoes: jangada.observacoes
          } as any)
        });
      }
    }

    // Migrar Clientes
    if (clientes && Array.isArray(clientes)) {
      console.log(`Migrando ${clientes.length} clientes...`);
      for (const cliente of clientes) {
        await prisma.cliente.create({
          data: ({
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
          } as any)
        });
      }
    }

    // Migrar Navios
    if (navios && Array.isArray(navios)) {
      console.log(`Migrando ${navios.length} navios...`);
      for (const navio of navios) {
        await prisma.navio.create({
          data: ({
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
          } as any)
        });
      }
    }

    // Migrar Inspeções
    if (inspecoes && Array.isArray(inspecoes)) {
      console.log(`Migrando ${inspecoes.length} inspeções...`);
      for (const inspecao of inspecoes) {
        await prisma.inspecao.create({
          data: ({
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
          } as any)
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