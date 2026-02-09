import { NextRequest, NextResponse } from 'next/server';
import { analyzeQuadroInspecao } from '@/lib/simple-analyzer';
import { prisma } from '@/lib/prisma';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

interface QuadroImportResult {
  success: boolean;
  fileName: string;
  jangada?: any;
  componentes?: any[];
  cilindro?: any;
  testes?: any[];
  errors: string[];
  warnings: string[];
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('Request method:', request.method);
    console.log('Content-Type:', request.headers.get('content-type'));

    let files: File[] = [];
    let jsonData: any = null;

    // Check content type to determine how to parse
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      // Handle JSON upload
      jsonData = await request.json();
      console.log('JSON data received');
      if (jsonData.fileData) {
        const buffer = Buffer.from(jsonData.fileData, 'base64');
        const mockFile = {
          name: jsonData.fileName || 'uploaded-file.xlsx',
          type: jsonData.fileType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          arrayBuffer: async () => buffer
        } as unknown as File;
        files = [mockFile];
        console.log(`JSON upload: ${mockFile.name}, size: ${buffer.length} bytes`);
      }
    } else {
      // Handle FormData upload
      const formData = await request.formData();

      // Support multiple files
      for (const [key, value] of formData.entries()) {
        if (key === 'file' || key === 'files' || key.startsWith('file')) {
          if (value instanceof File) {
            files.push(value);
          }
        }
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Validate all files are Excel
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
        return NextResponse.json(
          { error: `Ficheiro ${file.name} não é Excel. Apenas .xlsx e .xls são suportados.` },
          { status: 400 }
        );
      }
    }

    // Process all files
    const results: QuadroImportResult[] = await Promise.all(
      files.map(async (file) => {
        const result: QuadroImportResult = {
          success: false,
          fileName: file.name,
          errors: [],
          warnings: []
        };

        try {
          const buffer = Buffer.from(await file.arrayBuffer());

          console.log(`Processing file: ${file.name}, size: ${buffer.length} bytes`);

          // Analyze with analyzer
          const analysis = await analyzeQuadroInspecao(buffer, file.type);

          console.log(`=== ANALYSIS RESULT FOR ${file.name} ===`);
          console.log('Analysis result:', JSON.stringify(analysis, null, 2));
          console.log('=====================================');

          // Log specific parts for debugging
          console.log('Jangada data:', analysis.jangada);
          console.log('Componentes:', analysis.componentes);
          console.log('Cilindros:', analysis.cilindros);

          // Process jangada data
          if (analysis.jangada?.numeroSerie) {
            console.log('Processing jangada data:', analysis.jangada);
            try {
              // Find or create jangada
              let jangada = await prisma.jangada.findFirst({
                where: { numeroSerie: analysis.jangada.numeroSerie }
              });

              // Find or create marca
              let marcaId = null;
              if (analysis.jangada.marca) {
                let marca = await prisma.marcaJangada.findFirst({
                  where: { nome: { equals: analysis.jangada.marca, mode: 'insensitive' } }
                });
                if (!marca) {
                  marca = await prisma.marcaJangada.create({
                    data: { nome: analysis.jangada.marca }
                  });
                }
                marcaId = marca.id;
              }

              // Find or create modelo
              let modeloId = null;
              if (analysis.jangada.modelo && marcaId) {
                let modelo = await prisma.modeloJangada.findFirst({
                  where: {
                    nome: { equals: analysis.jangada.modelo, mode: 'insensitive' },
                    marcaId: marcaId
                  }
                });
                if (!modelo) {
                  modelo = await prisma.modeloJangada.create({
                    data: {
                      nome: analysis.jangada.modelo,
                      marcaId: marcaId
                    }
                  });
                }
                modeloId = modelo.id;
              }

              // Find lotacao
              let lotacaoId = null;
              if (analysis.jangada.lotacao) {
                let lotacao = await prisma.lotacaoJangada.findFirst({
                  where: { capacidade: analysis.jangada.lotacao }
                });
                if (!lotacao) {
                  lotacao = await prisma.lotacaoJangada.create({
                    data: { capacidade: analysis.jangada.lotacao }
                  });
                }
                lotacaoId = lotacao.id;
              }

              // Prepare data for jangada
              const jangadaData: any = {
                numeroSerie: analysis.jangada.numeroSerie,
                tipo: analysis.jangada.marca || 'Jangada',
                status: 'ativo',
                estado: 'instalada',
              };

              if (marcaId) jangadaData.marcaId = marcaId;
              if (modeloId) jangadaData.modeloId = modeloId;
              if (lotacaoId) jangadaData.lotacaoId = lotacaoId;
              if (analysis.jangada.dataFabricacao) {
                jangadaData.dataFabricacao = new Date(analysis.jangada.dataFabricacao);
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
                result.warnings.push('Jangada criada automaticamente');
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
                result.warnings.push('Jangada atualizada com dados do quadro');
              }

              result.jangada = jangada;
              result.success = true;

              // Process navio and cliente associations
              if (analysis.jangada.navio || analysis.jangada.cliente) {
                try {
                  let navioId = null;
                  let clienteId = null;

                  // Find or create cliente
                  if (analysis.jangada.cliente) {
                    let cliente = await prisma.cliente.findFirst({
                      where: { nome: { equals: analysis.jangada.cliente, mode: 'insensitive' } }
                    });
                    if (!cliente) {
                      cliente = await prisma.cliente.create({
                        data: {
                          nome: analysis.jangada.cliente,
                          tipo: 'cliente',
                          delegacao: 'Açores',
                          tecnico: 'Julio Correia'
                        }
                      });
                      result.warnings.push(`Cliente "${analysis.jangada.cliente}" criado automaticamente`);
                    }
                    clienteId = cliente.id;
                  }

                  // Find or create navio
                  if (analysis.jangada.navio) {
                    let navio = await prisma.navio.findFirst({
                      where: { nome: { equals: analysis.jangada.navio, mode: 'insensitive' } }
                    });
                    if (!navio) {
                      navio = await prisma.navio.create({
                        data: {
                          nome: analysis.jangada.navio,
                          tipo: 'pesca-costeiro', // Default type
                          bandeira: 'Portugal',
                          status: 'ativo',
                          delegacao: 'Açores',
                          tecnico: 'Julio Correia',
                          clienteId: clienteId
                        }
                      });
                      result.warnings.push(`Navio "${analysis.jangada.navio}" criado automaticamente`);
                    } else if (clienteId && !navio.clienteId) {
                      // Update navio with cliente if not set
                      await prisma.navio.update({
                        where: { id: navio.id },
                        data: { clienteId: clienteId }
                      });
                      result.warnings.push(`Navio "${analysis.jangada.navio}" associado ao cliente`);
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
                    result.warnings.push('Jangada associada ao navio e/ou cliente');
                  }

                } catch (error: any) {
                  result.errors.push(`Erro ao processar associações navio/cliente: ${error.message}`);
                }
              }

              // Process componentes do pack
              if (analysis.componentes?.pack && analysis.componentes.pack.length > 0) {
                try {
                  console.log('Processing pack components:', analysis.componentes.pack);
                  for (const componente of analysis.componentes.pack) {
                    if (componente.nome && componente.validade) {
                      // Parse date in MM/YYYY format
                      const parseDate = (dateStr: string) => {
                        const match = dateStr.match(/^(\d{2})\/(\d{4})$/);
                        if (match) {
                          const month = parseInt(match[1]) - 1; // JS months are 0-based
                          const year = parseInt(match[2]);
                          return new Date(year, month, 1); // First day of the month
                        }
                        return new Date(dateStr); // Fallback
                      };

                      const dataValidade = parseDate(componente.validade);
                      if (isNaN(dataValidade.getTime())) {
                        console.warn(`Invalid date for component ${componente.nome}: ${componente.validade}`);
                        continue; // Skip invalid dates
                      }

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
                  result.warnings.push(`${analysis.componentes.pack.length} componentes do pack criados`);
                } catch (error: any) {
                  result.errors.push(`Erro ao processar componentes do pack: ${error.message}`);
                }
              }

              // Process baterias
              if (analysis.componentes?.baterias && analysis.componentes.baterias.length > 0) {
                try {
                  console.log('Processing batteries:', analysis.componentes.baterias);
                  for (const bateria of analysis.componentes.baterias) {
                    if (bateria.nome) {
                      await prisma.componentePack.create({
                        data: {
                          jangadaId: jangada.id,
                          nome: bateria.nome,
                          descricao: bateria.tipo || 'Bateria',
                          quantidade: bateria.quantidade || 1,
                          estado: bateria.estado || 'ok',
                          dataValidade: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano padrão
                          dataInstalacao: new Date(),
                          observacoes: `Bateria importada do quadro de inspeção - ${bateria.tipo || 'Tipo não especificado'}`
                        }
                      });
                    }
                  }
                  result.warnings.push(`${analysis.componentes.baterias.length} baterias criadas`);
                } catch (error: any) {
                  result.errors.push(`Erro ao processar baterias: ${error.message}`);
                }
              }

              // Process cilindro
              if (analysis.cilindros && analysis.cilindros.length > 0) {
                try {
                  console.log('Processing cylinders:', analysis.cilindros);
                  const cilindroData = analysis.cilindros[0]; // Process first cylinder

                  let cilindro = await prisma.cilindro.findFirst({
                    where: { numeroSerie: cilindroData.numero }
                  });

                  const cilindroInfo: any = {
                    numeroSerie: cilindroData.numero,
                    tipo: cilindroData.tipo || 'CO2',
                    tara: cilindroData.tara,
                    pesoBruto: cilindroData.pesoBruto,
                    capacidade: cilindroData.cargaCO2,
                    capacidadeN2: cilindroData.cargaN2,
                    dataTeste: cilindroData.testeHidrostatico ? new Date(cilindroData.testeHidrostatico) : null,
                    status: cilindroData.estado || 'ativo'
                  };

                  if (!cilindro) {
                    cilindro = await prisma.cilindro.create({
                      data: cilindroInfo
                    });
                    result.warnings.push('Cilindro criado automaticamente');
                  } else {
                    cilindro = await prisma.cilindro.update({
                      where: { id: cilindro.id },
                      data: cilindroInfo
                    });
                    result.warnings.push('Cilindro atualizado');
                  }

                  // Associate cylinder with liferaft
                  await prisma.jangada.update({
                    where: { id: jangada.id },
                    data: { cilindroId: cilindro.id }
                  });

                  result.cilindro = cilindro;
                } catch (error: any) {
                  result.errors.push(`Erro ao processar cilindro: ${error.message}`);
                }
              }
              // Certificate processing commented out due to missing data structure
              /*
              if (analysis.jangada?.certificadoNumero) {
                try {
                  let certificado = await prisma.certificado.findFirst({
                    where: { numero: analysis.jangada.certificadoNumero }
                  });

                  const certificadoData: any = {
                    numero: analysis.certificado.numero,
                    tipo: analysis.certificado.tipo || 'CERTIFICADO_INSPECAO',
                    entidadeEmissora: analysis.certificado.entidade_emissora || 'OREY',
                    jangadaId: jangada.id
                  };

                  if (analysis.certificado.data_emissao) {
                    certificadoData.dataEmissao = new Date(analysis.certificado.data_emissao);
                  }

                  if (analysis.certificado.data_validade) {
                    certificadoData.dataValidade = new Date(analysis.certificado.data_validade);
                  }

                  if (!certificado) {
                    certificado = await prisma.certificado.create({
                      data: certificadoData
                    });
                    result.warnings.push('Certificado criado automaticamente');
                  } else {
                    certificado = await prisma.certificado.update({
                      where: { id: certificado.id },
                      data: certificadoData
                    });
                    result.warnings.push('Certificado atualizado');
                  }

                  result.certificado = certificado;
                } catch (error: any) {
                  result.errors.push(`Erro ao processar certificado: ${error.message}`);
                }
              }
              */
            } catch (error: any) {
              result.errors.push(`Erro ao processar jangada: ${error.message}`);
            }
          } else {
            result.errors.push('Número de série da jangada não identificado');
          }

          // Process componentes
          if (analysis.componentes) {
            result.componentes = [
              ...analysis.componentes.interiores,
              ...analysis.componentes.exteriores,
              ...analysis.componentes.pack,
              ...analysis.componentes.baterias
            ];
          }

          // Process testes
          if (analysis.testes) {
            result.testes = analysis.testes;
          }

        } catch (error: any) {
          console.error(`Error processing file ${file.name}:`, error);
          result.errors.push(`Erro ao processar arquivo ${file.name}: ${error.message}`);
        }

        return result;
      })
    );

    // Return single or multiple results
    if (files.length === 1) {
      const result = results[0];

      // Fetch pack components for the jangada
      let packComponents: any[] = [];
      if (result.jangada?.id) {
        packComponents = await prisma.componentePack.findMany({
          where: { jangadaId: result.jangada.id },
          orderBy: { createdAt: 'desc' }
        });
      }

      return NextResponse.json({
        success: result.success,
        jangada: result.jangada,
        componentes: {
          interiores: result.componentes || [],
          exteriores: [],
          pack: packComponents
        },
        cilindros: result.cilindro ? [result.cilindro] : [],
        certificado: null,
        errors: result.errors,
        warnings: result.warnings,
        confianca: 95
      });
    }

    return NextResponse.json({
      totalFiles: files.length,
      results,
      summary: {
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });

  } catch (error: any) {
    console.error('Error in quadro import:', error);
    return NextResponse.json(
      {
        error: 'Erro ao processar ficheiro',
        details: error.message || 'Erro desconhecido',
        stack: error.stack,
        suggestion: 'Verifique se o arquivo é um Excel válido (.xlsx ou .xls) e contém os dados esperados do quadro de inspeção OREY'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Use POST para importar quadro de inspeção.' });
}
