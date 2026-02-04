import { prisma } from '@/lib/prisma';
import { COMPONENTES_JANGADA, COMPONENTES_PACK } from '@/lib/jangada-options';

export interface ComponenteStock {
  nome: string;
  quantidadeNecessaria: number;
}

/**
 * Extrai componentes necessários para uma jangada baseada no tipo e pack
 */
export function getComponentesNecessarios(
  tipo: string,
  tipoPack?: string,
  componentesJangada?: string[],
  componentesPack?: string[],
  componentesSelecionados?: Record<string, { incluido: boolean; quantidade?: number; validade?: string; referencia?: string; pilhas?: number }>
): ComponenteStock[] {
  const componentes: ComponenteStock[] = [];

  // Usar componentesSelecionados se disponível (novo formato)
  if (componentesSelecionados) {
    Object.entries(componentesSelecionados).forEach(([nome, config]) => {
      if (config.incluido && config.quantidade && config.quantidade > 0) {
        componentes.push({
          nome,
          quantidadeNecessaria: config.quantidade,
        });

        // Adicionar pilhas se for lanterna estanque e tiver pilhas especificadas
        if (nome === 'Lanterna Estanque' && config.pilhas && config.pilhas > 0) {
          componentes.push({
            nome: 'Pilhas para Lanterna',
            quantidadeNecessaria: config.pilhas,
          });
        }
      }
    });
  } else {
    // Fallback para o formato antigo
    // Componentes base da jangada
    if (componentesJangada && componentesJangada.length > 0) {
      componentesJangada.forEach(componente => {
        componentes.push({
          nome: componente,
          quantidadeNecessaria: 1, // Cada componente é usado uma vez por jangada
        });
      });
    }

    // Componentes do pack
    if (tipoPack && componentesPack && componentesPack.length > 0) {
      componentesPack.forEach(componente => {
        componentes.push({
          nome: componente,
          quantidadeNecessaria: 1, // Cada componente do pack é usado uma vez
        });
      });
    }
  }

  return componentes;
}

/**
 * Verifica se há stock suficiente para os componentes necessários
 */
export async function verificarStockComponentes(componentes: ComponenteStock[]): Promise<{
  disponivel: boolean;
  itensInsuficientes: { nome: string; disponivel: number; necessario: number }[];
}> {
  const itensInsuficientes: { nome: string; disponivel: number; necessario: number }[] = [];

  for (const componente of componentes) {
    const itemStock = await prisma.stock.findFirst({
      where: {
        nome: componente.nome,
        status: 'ativo',
      },
    });

    if (!itemStock) {
      itensInsuficientes.push({
        nome: componente.nome,
        disponivel: 0,
        necessario: componente.quantidadeNecessaria,
      });
    } else if (itemStock.quantidade < componente.quantidadeNecessaria) {
      itensInsuficientes.push({
        nome: componente.nome,
        disponivel: itemStock.quantidade,
        necessario: componente.quantidadeNecessaria,
      });
    }
  }

  return {
    disponivel: itensInsuficientes.length === 0,
    itensInsuficientes,
  };
}

/**
 * Decrementa o stock dos componentes após criação da jangada
 */
export async function decrementarStockComponentes(
  componentes: ComponenteStock[],
  responsavel: string = 'Sistema'
): Promise<void> {
  for (const componente of componentes) {
    const itemStock = await prisma.stock.findFirst({
      where: {
        nome: componente.nome,
        status: 'ativo',
      },
    });

    if (itemStock) {
      // Decrementar quantidade
      await prisma.stock.update({
        where: { id: itemStock.id },
        data: {
          quantidade: itemStock.quantidade - componente.quantidadeNecessaria,
        },
      });

      // Registrar movimentação
      await prisma.movimentacaoStock.create({
        data: {
          stockId: itemStock.id,
          tipo: 'saida',
          quantidade: componente.quantidadeNecessaria,
          motivo: 'Criação de jangada',
          responsavel,
        },
      });
    }
  }
}

/**
 * Incrementa o stock dos componentes
 */
export async function incrementarStockComponentes(
  componentes: ComponenteStock[],
  responsavel: string = 'Sistema',
  motivo: string = 'Adição de componentes ao stock'
): Promise<void> {
  for (const componente of componentes) {
    const itemStock = await prisma.stock.findFirst({
      where: {
        nome: componente.nome,
        status: 'ativo',
      },
    });

    if (itemStock) {
      // Incrementar quantidade
      await prisma.stock.update({
        where: { id: itemStock.id },
        data: {
          quantidade: itemStock.quantidade + componente.quantidadeNecessaria,
        },
      });

      // Registrar movimentação
      await prisma.movimentacaoStock.create({
        data: {
          stockId: itemStock.id,
          tipo: 'entrada',
          quantidade: componente.quantidadeNecessaria,
          motivo,
          responsavel,
        },
      });
    } else {
      // Criar item se não existir
      const novoItem = await prisma.stock.create({
        data: {
          nome: componente.nome,
          categoria: 'Componentes Jangada',
          quantidade: componente.quantidadeNecessaria,
          quantidadeMinima: 1,
          status: 'ativo',
        },
      });

      // Registrar movimentação inicial
      await prisma.movimentacaoStock.create({
        data: {
          stockId: novoItem.id,
          tipo: 'entrada',
          quantidade: componente.quantidadeNecessaria,
          motivo,
          responsavel,
        },
      });
    }
  }
}

/**
 * Cria itens de stock para componentes que não existem
 */
export async function criarItensStockPadrao(): Promise<void> {
  const componentesExistentes = [
    ...COMPONENTES_JANGADA,
    ...COMPONENTES_PACK,
  ];

  for (const componente of componentesExistentes) {
    const itemExistente = await prisma.stock.findFirst({
      where: { nome: componente },
    });

    if (!itemExistente) {
      await prisma.stock.create({
        data: {
          nome: componente,
          categoria: 'Componentes Jangada',
          quantidade: 0,
          quantidadeMinima: 1,
          status: 'ativo',
        },
      });
    }
  }
}