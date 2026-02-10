import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { data, fileName, fileType } = await request.json();

    if (!data) {
      return NextResponse.json(
        { error: 'Dados não fornecidos' },
        { status: 400 }
      );
    }

    console.log('Saving extracted data:', { type: data.type, fileName, fileType });

    let result: any = { success: true, message: '' };
    let savedRecords = 0;

    // Process based on data type
    switch (data.type) {
      case 'jangada':
      case 'quadro_inspecao':
        if (data.jangada) {
          // Save or update jangada
          const jangadaData = await saveJangadaData(data.jangada, data.componentes, data.cilindros);
          result.message = `Jangada ${jangadaData.numeroSerie} salva com sucesso!`;
          savedRecords = 1;
        }
        break;

      case 'navio':
      case 'certificado':
        if (data.navio) {
          // Save or update navio
          const navioData = await saveNavioData(data.navio);
          result.message = `Navio ${navioData.nome} salvo com sucesso!`;
          savedRecords = 1;
        }
        break;

      case 'clientes_csv':
        if (data.clientes && data.clientes.length > 0) {
          savedRecords = await saveClientesData(data.clientes);
          result.message = `${savedRecords} clientes salvos com sucesso!`;
        }
        break;

      case 'navios_csv':
        if (data.navios && data.navios.length > 0) {
          savedRecords = await saveNaviosData(data.navios);
          result.message = `${savedRecords} navios salvos com sucesso!`;
        }
        break;

      case 'jangadas_csv':
        if (data.jangadas && data.jangadas.length > 0) {
          savedRecords = await saveJangadasData(data.jangadas);
          result.message = `${savedRecords} jangadas salvas com sucesso!`;
        }
        break;

      case 'stock_csv':
        if (data.stock && data.stock.length > 0) {
          savedRecords = await saveStockData(data.stock);
          result.message = `${savedRecords} itens de stock salvos com sucesso!`;
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Tipo de dados não suportado' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      savedRecords,
      data: result
    });

  } catch (error) {
    console.error('Error saving extracted data:', error);
    return NextResponse.json(
      {
        error: 'Erro ao salvar dados',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

async function saveJangadaData(jangadaData: any, componentes?: any[], cilindros?: any[]) {
  // Find or create marca
  let marcaId = null;
  if (jangadaData.marca) {
    let marca = await prisma.marcaJangada.findFirst({
      where: { nome: { equals: jangadaData.marca, mode: 'insensitive' } }
    });
    if (!marca) {
      marca = await prisma.marcaJangada.create({
        data: { nome: jangadaData.marca }
      });
    }
    marcaId = marca.id;
  }

  // Find or create modelo
  let modeloId = null;
  if (jangadaData.modelo && marcaId) {
    let modelo = await prisma.modeloJangada.findFirst({
      where: {
        nome: { equals: jangadaData.modelo, mode: 'insensitive' },
        marcaId: marcaId
      }
    });
    if (!modelo) {
      modelo = await prisma.modeloJangada.create({
        data: {
          nome: jangadaData.modelo,
          marcaId: marcaId
        }
      });
    }
    modeloId = modelo.id;
  }

  // Find lotacao
  let lotacaoId = null;
  if (jangadaData.capacidade) {
    let lotacao = await prisma.lotacaoJangada.findFirst({
      where: { capacidade: jangadaData.capacidade }
    });
    if (!lotacao) {
      lotacao = await prisma.lotacaoJangada.create({
        data: { capacidade: jangadaData.capacidade }
      });
    }
    lotacaoId = lotacao.id;
  }

  // Find navio by name if provided
  let navioId = null;
  if (jangadaData.navio) {
    let navio = await prisma.navio.findFirst({
      where: { nome: { equals: jangadaData.navio, mode: 'insensitive' } }
    });
    if (navio) {
      navioId = navio.id;
    }
  }

  // Save or update jangada
  const jangada = await prisma.jangada.upsert({
    where: { numeroSerie: jangadaData.numeroSerie },
    update: {
      marcaId,
      modeloId,
      lotacaoId,
      navioId,
      dataFabricacao: jangadaData.dataFabricacao ? new Date(jangadaData.dataFabricacao) : undefined,
      dataInspecao: jangadaData.dataInspecao ? new Date(jangadaData.dataInspecao) : undefined,
      tipoPack: jangadaData.tipoPack || undefined,
      peso: jangadaData.peso || undefined,
      capacidade: jangadaData.capacidade || undefined,
      dimensoes: jangadaData.dimensoes || undefined,
      numeroAprovacao: jangadaData.numeroAprovacao || undefined,
      status: 'ativo'
    },
    create: {
      numeroSerie: jangadaData.numeroSerie,
      marcaId,
      modeloId,
      lotacaoId,
      navioId,
      tipo: 'bote-salva-vidas',
      dataFabricacao: jangadaData.dataFabricacao ? new Date(jangadaData.dataFabricacao) : undefined,
      dataInspecao: jangadaData.dataInspecao ? new Date(jangadaData.dataInspecao) : undefined,
      tipoPack: jangadaData.tipoPack || undefined,
      peso: jangadaData.peso || undefined,
      capacidade: jangadaData.capacidade || undefined,
      dimensoes: jangadaData.dimensoes || undefined,
      numeroAprovacao: jangadaData.numeroAprovacao || undefined,
      status: 'ativo'
    }
  });

  // Save componentes if provided
  if (componentes && componentes.length > 0) {
    for (const componente of componentes) {
      // This would require more complex logic based on your component schema
      // For now, we'll skip component saving
    }
  }

  // Save cilindros if provided
  if (cilindros && cilindros.length > 0) {
    for (const cilindro of cilindros) {
      // This would require cilindro schema logic
      // For now, we'll skip cilindro saving
    }
  }

  return jangada;
}

async function saveNavioData(navioData: any) {
  // First try to find existing navio by matricula or nome
  let existingNavio = null;
  if (navioData.matricula) {
    existingNavio = await prisma.navio.findFirst({
      where: { matricula: navioData.matricula }
    });
  }
  if (!existingNavio && navioData.nome) {
    existingNavio = await prisma.navio.findFirst({
      where: { nome: navioData.nome }
    });
  }

  if (existingNavio) {
    // Update existing navio
    const navio = await prisma.navio.update({
      where: { id: existingNavio.id },
      data: {
        nome: navioData.nome,
        imo: navioData.imo,
        tipo: navioData.tipo,
        matricula: navioData.matricula,
        bandeira: navioData.bandeira,
        anoConstrucao: navioData.anoConstrucao,
        status: navioData.status || 'ativo'
      }
    });
    return navio;
  } else {
    // Create new navio
    const navio = await prisma.navio.create({
      data: {
        nome: navioData.nome,
        matricula: navioData.matricula,
        imo: navioData.imo,
        tipo: navioData.tipo,
        bandeira: navioData.bandeira || 'Portugal',
        anoConstrucao: navioData.anoConstrucao,
        status: navioData.status || 'ativo'
      }
    });
    return navio;
  }
}

async function saveClientesData(clientes: any[]) {
  let savedCount = 0;
  for (const cliente of clientes) {
    try {
      await prisma.cliente.upsert({
        where: { email: cliente.email },
        update: {
          nome: cliente.nome,
          telefone: cliente.telefone,
          endereco: cliente.endereco
        },
        create: {
          nome: cliente.nome,
          email: cliente.email,
          telefone: cliente.telefone,
          endereco: cliente.endereco
        }
      });
      savedCount++;
    } catch (error) {
      console.error('Error saving cliente:', cliente, error);
    }
  }
  return savedCount;
}

async function saveNaviosData(navios: any[]) {
  let savedCount = 0;
  for (const navio of navios) {
    try {
      await saveNavioData(navio);
      savedCount++;
    } catch (error) {
      console.error('Error saving navio:', navio, error);
    }
  }
  return savedCount;
}

async function saveJangadasData(jangadas: any[]) {
  let savedCount = 0;
  for (const jangada of jangadas) {
    try {
      await saveJangadaData(jangada);
      savedCount++;
    } catch (error) {
      console.error('Error saving jangada:', jangada, error);
    }
  }
  return savedCount;
}

async function saveStockData(stock: any[]) {
  let savedCount = 0;
  for (const item of stock) {
    try {
      // Find existing stock item by name and categoria (unique combination)
      const existingStock = await prisma.stock.findFirst({
        where: {
          nome: item.nome,
          categoria: item.categoria || 'componentes'
        }
      });

      if (existingStock) {
        // Update existing stock
        await prisma.stock.update({
          where: { id: existingStock.id },
          data: {
            quantidade: item.quantidade || 0,
            localizacao: item.localizacao,
            refOrey: item.refOrey,
            refFabricante: item.refFabricante
          }
        });
      } else {
        // Create new stock item
        await prisma.stock.create({
          data: {
            nome: item.nome,
            categoria: item.categoria || 'componentes',
            quantidade: item.quantidade || 0,
            localizacao: item.localizacao,
            refOrey: item.refOrey,
            refFabricante: item.refFabricante
          }
        });
      }
      savedCount++;
    } catch (error) {
      console.error('Error saving stock item:', item, error);
    }
  }
  return savedCount;
}