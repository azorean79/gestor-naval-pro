import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface EditedQuadroData {
  editedData: {
    numeroSerie: string
    marca: string
    modelo: string
    capacidade: number
    dataFabricacao?: string
    dataInspecao?: string
    cilindros: Array<{
      tipo: string
      pressao: number
      dataProximoTeste: string
    }>
    componentes: {
      interiores: string[]
      exteriores: string[]
      pack: string[]
    }
  }
  rawData: any
}

export async function POST(request: NextRequest) {
  try {
    const { editedData, rawData }: EditedQuadroData = await request.json();

    console.log('Saving edited quadro data:', editedData);

    // Process jangada data with edited information
    let jangada = await prisma.jangada.findFirst({
      where: { numeroSerie: editedData.numeroSerie }
    });

    // Find or create marca
    let marcaId = null;
    if (editedData.marca && editedData.marca !== 'Desconhecido') {
      let marca = await prisma.marcaJangada.findFirst({
        where: { nome: { equals: editedData.marca, mode: 'insensitive' } }
      });
      if (!marca) {
        marca = await prisma.marcaJangada.create({
          data: { nome: editedData.marca }
        });
      }
      marcaId = marca.id;
    }

    // Find or create modelo
    let modeloId = null;
    if (editedData.modelo && editedData.modelo !== 'Desconhecido' && marcaId) {
      let modelo = await prisma.modeloJangada.findFirst({
        where: {
          nome: { equals: editedData.modelo, mode: 'insensitive' },
          marcaId: marcaId
        }
      });
      if (!modelo) {
        modelo = await prisma.modeloJangada.create({
          data: {
            nome: editedData.modelo,
            marcaId: marcaId
          }
        });
      }
      modeloId = modelo.id;
    }

    // Find lotacao
    let lotacaoId = null;
    if (editedData.capacidade) {
      let lotacao = await prisma.lotacaoJangada.findFirst({
        where: { capacidade: editedData.capacidade }
      });
      if (!lotacao) {
        lotacao = await prisma.lotacaoJangada.create({
          data: { capacidade: editedData.capacidade }
        });
      }
      lotacaoId = lotacao.id;
    }

    // Prepare data for jangada
    const jangadaData: any = {
      numeroSerie: editedData.numeroSerie,
      tipo: editedData.marca || 'Jangada',
      status: 'ativo',
      estado: 'instalada',
    };

    if (marcaId) jangadaData.marca = { connect: { id: marcaId } };
    if (modeloId) jangadaData.modelo = { connect: { id: modeloId } };
    if (lotacaoId) jangadaData.lotacao = { connect: { id: lotacaoId } };
    if (editedData.dataFabricacao) {
      jangadaData.dataFabricacao = new Date(editedData.dataFabricacao);
    }
    if (editedData.dataInspecao) {
      jangadaData.dataInspecao = new Date(editedData.dataInspecao);
    }

    if (!jangada) {
      // Create new jangada
      jangada = await prisma.jangada.create({
        data: jangadaData,
        include: {
          marca: true,
          modelo: true,
          lotacao: true
        }
      });
    } else {
      // Update existing jangada
      jangada = await prisma.jangada.update({
        where: { id: jangada.id },
        data: jangadaData,
        include: {
          marca: true,
          modelo: true,
          lotacao: true
        }
      });
    }

    // Process navio and cliente associations from raw data
    if (rawData.jangada.navio || rawData.jangada.cliente) {
      try {
        let navioId = null;
        let clienteId = null;

        // Find or create cliente
        if (rawData.jangada.cliente) {
          let cliente = await prisma.cliente.findFirst({
            where: { nome: { equals: rawData.jangada.cliente, mode: 'insensitive' } }
          });
          if (!cliente) {
            cliente = await prisma.cliente.create({
              data: {
                nome: rawData.jangada.cliente,
                tipo: 'cliente',
                delegacao: 'Açores',
                tecnico: 'Julio Correia'
              }
            });
          }
          clienteId = cliente.id;
        }

        // Find or create navio
        if (rawData.jangada.navio) {
          let navio = await prisma.navio.findFirst({
            where: { nome: { equals: rawData.jangada.navio, mode: 'insensitive' } }
          });
          if (!navio) {
            navio = await prisma.navio.create({
              data: {
                nome: rawData.jangada.navio,
                tipo: 'pesca-costeiro',
                bandeira: 'Portugal',
                status: 'ativo',
                delegacao: 'Açores',
                tecnico: 'Julio Correia',
                clienteId: clienteId
              }
            });
          } else if (clienteId && !navio.clienteId) {
            await prisma.navio.update({
              where: { id: navio.id },
              data: { clienteId: clienteId }
            });
          }
          navioId = navio.id;
        }

        // Associate jangada with navio and cliente
        const updateData: any = {};
        if (navioId) updateData.navioId = navioId;
        if (clienteId) updateData.clienteId = clienteId;

        if (Object.keys(updateData).length > 0) {
          await prisma.jangada.update({
            where: { id: jangada.id },
            data: updateData
          });
        }

      } catch (error: any) {
        console.error('Erro ao processar associações navio/cliente:', error);
      }
    }

    // Process componentes do pack from raw data
    if (rawData.componentes?.pack && rawData.componentes.pack.length > 0) {
      try {
        for (const componente of rawData.componentes.pack) {
          if (componente.nome && componente.validade) {
            const parseDate = (dateStr: string) => {
              const match = dateStr.match(/^(\d{2})\/(\d{4})$/);
              if (match) {
                const month = parseInt(match[1]) - 1;
                const year = parseInt(match[2]);
                return new Date(year, month, 1);
              }
              return new Date(dateStr);
            };

            const dataValidade = parseDate(componente.validade);
            if (!isNaN(dataValidade.getTime())) {
              await prisma.componentePack.create({
                data: {
                  jangadaId: jangada.id,
                  nome: componente.nome,
                  descricao: componente.tipo || '',
                  quantidade: componente.quantidade || 1,
                  estado: 'ok',
                  dataValidade: dataValidade,
                  dataInstalacao: new Date(),
                  observacoes: `Importado do quadro de inspeção - ${componente.tipo || 'Componente do pack'}`
                }
              });
            }
          }
        }
      } catch (error: any) {
        console.error('Erro ao processar componentes do pack:', error);
      }
    }

    // Process cilindros with edited data
    if (editedData.cilindros && editedData.cilindros.length > 0) {
      try {
        for (const cilindroData of editedData.cilindros) {
          let cilindro = await prisma.cilindro.findFirst({
            where: { numeroSerie: `EDITED-${jangada.numeroSerie}-${cilindroData.tipo}` }
          });

          const cilindroInfo: any = {
            numeroSerie: `EDITED-${jangada.numeroSerie}-${cilindroData.tipo}`,
            tipo: cilindroData.tipo || 'CO2',
            capacidade: cilindroData.pressao || 0,
            status: 'ativo'
          };

          if (!cilindro) {
            cilindro = await prisma.cilindro.create({
              data: cilindroInfo
            });
          } else {
            cilindro = await prisma.cilindro.update({
              where: { id: cilindro.id },
              data: cilindroInfo
            });
          }

          // Associate cylinder with liferaft
          await prisma.jangada.update({
            where: { id: jangada.id },
            data: { cilindroId: cilindro.id }
          });
        }
      } catch (error: any) {
        console.error('Erro ao processar cilindros:', error);
      }
    }

    // Create certificate
    let certificado = null;
    try {
      certificado = await prisma.certificado.create({
        data: {
          numero: `CERT-${jangada.numeroSerie}-${Date.now()}`,
          tipo: 'CERTIFICADO_INSPECAO',
          entidadeEmissora: 'OREY',
          jangadaId: jangada.id,
          dataEmissao: new Date(),
          dataValidade: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
        }
      });
    } catch (error: any) {
      console.error('Erro ao criar certificado:', error);
    }

    return NextResponse.json({
      success: true,
      jangada,
      certificado,
      message: 'Dados salvos com sucesso'
    });

  } catch (error: any) {
    console.error('Error saving edited quadro data:', error);
    return NextResponse.json(
      {
        error: 'Erro ao salvar dados editados',
        details: error.message || 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}