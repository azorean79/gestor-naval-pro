import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    const hoje = new Date();
    const daqui30Dias = new Date();
    daqui30Dias.setDate(hoje.getDate() + 30);

    const notificacoes: Array<{
      id: string;
      tipo: string;
      titulo: string;
      mensagem: string;
      prioridade: string;
      dataCriacao: string;
      lida: boolean;
      dados: any;
    }> = [];

    // 1. EXPIRAÇÃO DE CERTIFICADOS (30 dias antes)
    const certificados = await prisma.certificado.findMany({
      where: {
        dataValidade: {
          not: null,
        },
      },
    });

    certificados.forEach(certificado => {
      if (certificado.dataValidade) {
        const dataValidade = new Date(certificado.dataValidade);
        const diasRestantes = Math.ceil((dataValidade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        if (diasRestantes <= 30 && diasRestantes > 0) {
          notificacoes.push({
            id: `certificado-${certificado.id}`,
            tipo: 'certificado_expiracao',
            titulo: 'Certificado próximo da expiração',
            mensagem: `O certificado ${certificado.tipoEquipamento} da marca ${certificado.marca} expira em ${diasRestantes} dias`,
            prioridade: diasRestantes <= 7 ? 'alta' : 'media',
            dataCriacao: new Date().toISOString(),
            lida: false,
            dados: {
              certificadoId: certificado.id,
              tipoEquipamento: certificado.tipoEquipamento,
              marca: certificado.marca,
              modelos: certificado.modelos,
              diasRestantes
            }
          });
        }
      }
    });

    // 2. ALERTAS DE STOCK BAIXO
    const stockItems = await prisma.itemStock.findMany();

    stockItems.forEach(item => {
      if (item.quantidadeMinima && item.quantidadeAtual <= item.quantidadeMinima) {
        notificacoes.push({
          id: `stock-${item.id}`,
          tipo: 'stock_baixo',
          titulo: 'Stock baixo',
          mensagem: `O item ${item.nome} está com stock baixo: ${item.quantidadeAtual} ${item.unidade} (mínimo: ${item.quantidadeMinima})`,
          prioridade: item.quantidadeAtual <= (item.quantidadeMinima * 0.5) ? 'alta' : 'media',
          dataCriacao: new Date().toISOString(),
          lida: false,
          dados: {
            itemId: item.id,
            nome: item.nome,
            quantidadeAtual: item.quantidadeAtual,
            quantidadeMinima: item.quantidadeMinima,
            unidade: item.unidade
          }
        });
      }
    });

    // 3. LEMBRETES DE INSPEÇÕES
    // Inspeções de jangadas
    const jangadas = await prisma.jangada.findMany({
      where: {
        proximaInspecao: {
          not: null,
        },
      },
    });

    jangadas.forEach(jangada => {
      if (jangada.proximaInspecao) {
        const dataInspecao = new Date(jangada.proximaInspecao);
        const diasRestantes = Math.ceil((dataInspecao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        if (diasRestantes <= 30 && diasRestantes > 0) {
          notificacoes.push({
            id: `inspecao-jangada-${jangada.id}`,
            tipo: 'inspecao_jangada',
            titulo: 'Inspeção de jangada pendente',
            mensagem: `A jangada ${jangada.numero} (${jangada.nome}) precisa de inspeção em ${diasRestantes} dias`,
            prioridade: diasRestantes <= 7 ? 'alta' : 'media',
            dataCriacao: new Date().toISOString(),
            lida: false,
            dados: {
              jangadaId: jangada.id,
              numero: jangada.numero,
              nome: jangada.nome,
              diasRestantes
            }
          });
        }
      }
    });

    // Inspeções de navios
    const navios = await prisma.navio.findMany({
      where: {
        proximaInspecao: {
          not: null,
        },
      },
    });

    navios.forEach(navio => {
      if (navio.proximaInspecao) {
        const dataInspecao = new Date(navio.proximaInspecao);
        const diasRestantes = Math.ceil((dataInspecao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        if (diasRestantes <= 30 && diasRestantes > 0) {
          notificacoes.push({
            id: `inspecao-navio-${navio.id}`,
            tipo: 'inspecao_navio',
            titulo: 'Inspeção de navio pendente',
            mensagem: `O navio ${navio.nome} precisa de inspeção em ${diasRestantes} dias`,
            prioridade: diasRestantes <= 7 ? 'alta' : 'media',
            dataCriacao: new Date().toISOString(),
            lida: false,
            dados: {
              navioId: navio.id,
              nome: navio.nome,
              tipo: navio.tipo,
              diasRestantes
            }
          });
        }
      }
    });

    // Inspeções de cilindros
    const cilindros = await prisma.cilindro.findMany({
      where: {
        proximoTesteHidraulico: {
          not: null,
        },
      },
    });

    cilindros.forEach(cilindro => {
      if (cilindro.proximoTesteHidraulico) {
        const dataInspecao = new Date(cilindro.proximoTesteHidraulico);
        const diasRestantes = Math.ceil((dataInspecao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        if (diasRestantes <= 30 && diasRestantes > 0) {
          notificacoes.push({
            id: `teste-hidraulico-cilindro-${cilindro.id}`,
            tipo: 'teste_hidraulico_cilindro',
            titulo: 'Teste hidráulico de cilindro pendente',
            mensagem: `O cilindro ${cilindro.numeroSerie} precisa de teste hidráulico em ${diasRestantes} dias`,
            prioridade: diasRestantes <= 7 ? 'alta' : 'media',
            dataCriacao: new Date().toISOString(),
            lida: false,
            dados: {
              cilindroId: cilindro.id,
              numeroSerie: cilindro.numeroSerie,
              tipoSistemaInsuflacao: cilindro.tipoSistemaInsuflacao,
              diasRestantes
            }
          });
        }
      }
    });

    // 4. ORDENS DE SERVIÇO PRÓXIMAS DO VENCIMENTO
    const ordens = await prisma.ordemServico.findMany({
      where: {
        dataPrevistaEntrega: {
          gte: hoje,
          lte: daqui30Dias,
        },
        status: {
          in: ['recebido', 'em_andamento'],
        },
      },
    });

    ordens.forEach(ordem => {
      const dataConclusao = new Date(ordem.dataPrevistaEntrega!);
      const diasRestantes = Math.ceil((dataConclusao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

      notificacoes.push({
        id: `ordem-${ordem.id}`,
        tipo: 'ordem_vencimento',
        titulo: 'Ordem próxima do vencimento',
        mensagem: `A ordem ${ordem.numero} vence em ${diasRestantes} dias`,
        prioridade: diasRestantes <= 7 ? 'alta' : 'media',
        dataCriacao: new Date().toISOString(),
        lida: false,
        dados: {
          ordemId: ordem.id,
          numero: ordem.numero,
          cliente: ordem.clienteNome,
          status: ordem.status,
          diasRestantes
        }
      });
    });

    // Ordenar por prioridade e data
    notificacoes.sort((a, b) => {
      const prioridadeOrder = { alta: 3, media: 2, baixa: 1 };
      if (prioridadeOrder[a.prioridade as keyof typeof prioridadeOrder] !== prioridadeOrder[b.prioridade as keyof typeof prioridadeOrder]) {
        return prioridadeOrder[b.prioridade as keyof typeof prioridadeOrder] - prioridadeOrder[a.prioridade as keyof typeof prioridadeOrder];
      }
      return new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime();
    });

    return NextResponse.json({ notificacoes });

  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}