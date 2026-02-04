import { NextRequest, NextResponse } from 'next/server';
import { analyzeDocument, parseDate, parseCapacity } from '@/lib/document-analyzer';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key') {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY não configurado. Configure a chave da API no painel do Vercel ou no ficheiro .env. Obtenha em https://platform.openai.com/api-keys' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const filename = file.name.toLowerCase();
    if (!filename.endsWith('.pdf') && !filename.endsWith('.xlsx') && !filename.endsWith('.xls') && !filename.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload PDF, Excel (.xlsx/.xls), or CSV file.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Analyze document
    const analysis = await analyzeDocument(buffer, filename);

    if (analysis.type === 'unknown') {
      return NextResponse.json(
        { 
          error: 'Could not determine document type',
          analysis 
        },
        { status: 400 }
      );
    }

    const result: any = {
      documentType: analysis.type,
      analysis,
    };

    // Import data based on document type
    if (analysis.type === 'certificado' && analysis.navio) {
      try {
        // Check if navio already exists
        let navio = await prisma.navio.findFirst({
          where: {
            matricula: analysis.navio.matricula || undefined,
          },
        });

        if (!navio) {
          // Create new navio
          navio = await prisma.navio.create({
            data: {
              nome: analysis.navio.nome || 'Unknown',
              tipo: analysis.navio.tipo || '',
              matricula: analysis.navio.matricula || `MAT-${Date.now()}`,
              bandeira: analysis.navio.bandeira || 'Portugal',
              status: 'ativo',
              dataInspecao: parseDate(analysis.navio.dataInspecao),
              dataProximaInspecao: parseDate(analysis.navio.dataProximaInspecao),
            },
          });
        } else {
          // Update existing navio - create inspection record for history
          const oldNavio = navio; // Store old data for comparison

          navio = await prisma.navio.update({
            where: { id: navio.id },
            data: {
              nome: analysis.navio.nome || navio.nome,
              tipo: analysis.navio.tipo || navio.tipo,
              dataInspecao: parseDate(analysis.navio.dataInspecao) || navio.dataInspecao,
              dataProximaInspecao: parseDate(analysis.navio.dataProximaInspecao) || navio.dataProximaInspecao,
            },
          });

          // Create inspection record for history tracking
          const inspectionDate = parseDate(analysis.navio.dataInspecao) || new Date();
          const inspectionNumber = `IMP-NAV-${navio.matricula}-${inspectionDate.getFullYear()}-${String(inspectionDate.getMonth() + 1).padStart(2, '0')}`;

          const inspecao = await prisma.inspecao.create({
            data: {
              numero: inspectionNumber,
              tipoInspecao: 'extraordinaria', // Import from document
              dataInspecao: inspectionDate,
              dataProxima: parseDate(analysis.navio.dataProximaInspecao),
              resultado: 'aprovada', // Assuming successful import
              status: 'realizada',
              tecnico: 'Sistema de Importação IA',
              observacoes: `Certificado de navio importado automaticamente. Dados atualizados: ${analysis.navio.nome ? 'nome' : ''} ${analysis.navio.tipo ? 'tipo' : ''} ${analysis.navio.dataInspecao ? 'datas de inspeção' : ''}`,
              navioId: navio.id,
            },
          });

          // Create history record
          await prisma.historicoInspecao.create({
            data: {
              dataRealizada: inspectionDate,
              descricao: 'Importação automática de certificado via IA',
              resultado: 'Certificado atualizado com sucesso',
              tecnico: 'Sistema de Importação IA',
              observacoes: `Importado certificado do navio ${navio.nome} (${navio.matricula})`,
              custo: 0, // No cost for automated import
              dataPreviaProxima: parseDate(analysis.navio.dataProximaInspecao),
              inspecaoId: inspecao.id,
            },
          });
        }

        result.importedNavio = {
          id: navio.id,
          nome: navio.nome,
          matricula: navio.matricula,
          type: 'updated (histórico criado)',
        };
      } catch (error) {
        console.error('Error importing navio:', error);
        result.navioError = error instanceof Error ? error.message : 'Error importing navio';
      }
    } else if (analysis.type === 'quadro_inspecao' && analysis.jangada) {
      try {
        // Find navio by matricula
        let navio = null;
        if (analysis.jangada.navioMatricula) {
          navio = await prisma.navio.findFirst({
            where: {
              matricula: {
                contains: analysis.jangada.navioMatricula,
                mode: 'insensitive',
              },
            },
          });
        }

        // Check if jangada already exists
        let jangada = await prisma.jangada.findFirst({
          where: {
            numeroSerie: analysis.jangada.numeroSerie || undefined,
          },
        });

        if (!jangada) {
          // Find or create marca
          let marca = await prisma.marcaJangada.findFirst({
            where: { nome: analysis.jangada.marca || 'Desconhecida', ativo: true }
          });
          if (!marca && analysis.jangada.marca) {
            marca = await prisma.marcaJangada.create({
              data: { nome: analysis.jangada.marca }
            });
          }

          // Find or create modelo (associated with marca)
          let modelo = null;
          if (marca && analysis.jangada.modelo) {
            modelo = await prisma.modeloJangada.findFirst({
              where: {
                nome: analysis.jangada.modelo,
                marcaId: marca.id,
                ativo: true
              }
            });
            if (!modelo) {
              modelo = await prisma.modeloJangada.create({
                data: {
                  nome: analysis.jangada.modelo,
                  marcaId: marca.id
                }
              });
            }
          }

          // Find or create lotacao
          const capacidade = parseCapacity(analysis.jangada.capacidade?.toString());
          let lotacao = await prisma.lotacaoJangada.findFirst({
            where: { capacidade: capacidade || 8, ativo: true }
          });
          if (!lotacao && capacidade) {
            lotacao = await prisma.lotacaoJangada.create({
              data: { capacidade }
            });
          }

          // Create new jangada
          jangada = await prisma.jangada.create({
            data: {
              numeroSerie: analysis.jangada.numeroSerie || `SN-${Date.now()}`,
              marcaId: marca?.id,
              modeloId: modelo?.id,
              tipo: analysis.jangada.marca || 'Standard',
              lotacaoId: lotacao?.id,
              status: 'ativo',
              estado: 'instalada',
              dataInspecao: parseDate(analysis.jangada.dataInspecao),
              dataProximaInspecao: parseDate(analysis.jangada.dataProximaInspecao),
              navioId: navio?.id,
            },
            include: {
              marca: true,
              modelo: true,
            },
          });
        } else {
          // Update existing jangada - create inspection record for history
          const oldJangada = jangada; // Store old data for comparison

          jangada = await prisma.jangada.update({
            where: { id: jangada.id },
            data: {
              dataInspecao: parseDate(analysis.jangada.dataInspecao) || jangada.dataInspecao,
              dataProximaInspecao: parseDate(analysis.jangada.dataProximaInspecao) || jangada.dataProximaInspecao,
              navioId: navio?.id || jangada.navioId,
            },
            include: {
              marca: true,
              modelo: true,
            },
          });

          // Create inspection record for history tracking
          const inspectionDate = parseDate(analysis.jangada.dataInspecao) || new Date();
          const inspectionNumber = `IMP-${jangada.numeroSerie}-${inspectionDate.getFullYear()}-${String(inspectionDate.getMonth() + 1).padStart(2, '0')}`;

          const inspecao = await prisma.inspecao.create({
            data: {
              numero: inspectionNumber,
              tipoInspecao: 'extraordinaria', // Import from document
              dataInspecao: inspectionDate,
              dataProxima: parseDate(analysis.jangada.dataProximaInspecao),
              resultado: 'aprovada', // Assuming successful import
              status: 'realizada',
              tecnico: 'Sistema de Importação IA',
              observacoes: `Dados importados automaticamente do documento. ${analysis.componentes ? `Encontrados ${analysis.componentes.length} componentes.` : ''}`,
              jangadaId: jangada.id,
            },
          });

          // Create history record
          await prisma.historicoInspecao.create({
            data: {
              dataRealizada: inspectionDate,
              descricao: 'Importação automática de dados via IA',
              resultado: 'Dados atualizados com sucesso',
              tecnico: 'Sistema de Importação IA',
              observacoes: `Importado de documento: ${analysis.componentes ? `Componentes verificados: ${analysis.componentes.map(c => c.nome).join(', ')}` : 'Dados básicos atualizados'}`,
              custo: 0, // No cost for automated import
              dataPreviaProxima: parseDate(analysis.jangada.dataProximaInspecao),
              inspecaoId: inspecao.id,
            },
          });
        }

        // Fetch the jangada with relationships for the result
        const jangadaWithRelations = await prisma.jangada.findUnique({
          where: { id: jangada.id },
          include: {
            marca: true,
            modelo: true,
          },
        });

        result.importedJangada = {
          id: jangada.id,
          numeroSerie: jangada.numeroSerie,
          marca: jangadaWithRelations?.marca?.nome || 'Unknown',
          modelo: jangadaWithRelations?.modelo?.nome || 'Unknown',
          type: 'updated (histórico criado)',
          navioLinked: navio ? navio.nome : 'Not found',
        };

        // Sync components to stock if available
        if (analysis.componentes && analysis.componentes.length > 0) {
          const stockUpdates = [];
          
          for (const componente of analysis.componentes) {
            try {
              // Check if stock item exists
              let stockItem = await prisma.stock.findFirst({
                where: {
                  nome: {
                    equals: componente.nome,
                    mode: 'insensitive',
                  },
                },
              });

              if (!stockItem) {
                // Create new stock item
                stockItem = await prisma.stock.create({
                  data: {
                    nome: componente.nome,
                    descricao: `Componente de jangada ${analysis.jangada.marca} ${analysis.jangada.modelo}`,
                    categoria: 'Componentes de Jangada',
                    quantidade: componente.quantidade,
                    quantidadeMinima: 5,
                    status: 'ativo',
                    localizacao: 'Armazém Principal',
                  },
                });
                stockUpdates.push({ 
                  nome: componente.nome, 
                  action: 'created', 
                  quantidade: componente.quantidade 
                });
              } else {
                // Update quantity if needed (could be decrease if components were used)
                // For inspection reports, we typically track usage/replacement
                if (componente.estado === 'Substituído') {
                  // Decrease stock when component was replaced
                  const newQuantity = Math.max(0, stockItem.quantidade - componente.quantidade);
                  await prisma.stock.update({
                    where: { id: stockItem.id },
                    data: { 
                      quantidade: newQuantity,
                      updatedAt: new Date(),
                    },
                  });
                  
                  // Create movement record
                  await prisma.movimentacaoStock.create({
                    data: {
                      stockId: stockItem.id,
                      tipo: 'saida',
                      quantidade: componente.quantidade,
                      motivo: `Substituição em jangada ${jangada.numeroSerie}`,
                      responsavel: 'Sistema IA',
                    },
                  });
                  
                  stockUpdates.push({ 
                    nome: componente.nome, 
                    action: 'decreased', 
                    quantidade: newQuantity 
                  });
                }
              }
            } catch (stockError) {
              console.error(`Error syncing component ${componente.nome}:`, stockError);
              stockUpdates.push({ 
                nome: componente.nome, 
                action: 'error', 
                error: stockError instanceof Error ? stockError.message : 'Unknown error' 
              });
            }
          }
          
          result.stockSync = {
            totalComponents: analysis.componentes.length,
            updates: stockUpdates,
          };
        }
      } catch (error) {
        console.error('Error importing jangada:', error);
        result.jangadaError = error instanceof Error ? error.message : 'Error importing jangada';
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in document analysis:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error analyzing document',
        details: error,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
