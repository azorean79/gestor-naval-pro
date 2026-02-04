import { NextRequest, NextResponse } from 'next/server';
import { analyzeQuadroInspecao, isQuadroInspecaoFile } from '@/lib/quadro-inspecao-analyzer';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';

interface QuadroImportResult {
  success: boolean;
  jangada?: any;
  componentes: {
    interiores: any[];
    exteriores: any[];
    pack: any[];
  };
  cilindros?: any[];
  certificado?: any;
  errors: string[];
  warnings: string[];
  confianca: number;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Check if it's an Excel file
    if (!file.name.toLowerCase().endsWith('.xlsx') && 
        !file.name.toLowerCase().endsWith('.xls')) {
      return NextResponse.json(
        { error: 'Apenas ficheiros Excel (.xlsx, .xls) são suportados' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Check sheet names to determine if it's a Quadro de Inspeção
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const isQuadro = isQuadroInspecaoFile(file.name, workbook.SheetNames);

    if (!isQuadro) {
      return NextResponse.json(
        { 
          error: 'Ficheiro não parece ser um Quadro de Inspeção da Jangada',
          suggestion: 'Verifique se o ficheiro contém "Quadro de Inspeção" ou "Inspection" no nome ou nas folhas'
        },
        { status: 400 }
      );
    }

    // Analyze the document
    const analysis = await analyzeQuadroInspecao(buffer, file.name);

    // Process the extraction results
    const result: QuadroImportResult = {
      success: false,
      componentes: {
        interiores: [],
        exteriores: [],
        pack: [],
      },
      errors: [],
      warnings: [],
      confianca: analysis.confianca,
    };

    // Validate extracted data
    if (!analysis.jangada?.numeroSerie) {
      result.errors.push('Número de série da jangada não foi identificado');
      return NextResponse.json({ result }, { status: 400 });
    }

    if (analysis.confianca < 40) {
      result.warnings.push(`Confiança da análise baixa (${analysis.confianca}%). Verifique os dados extraídos.`);
    }

    // Try to find or create the jangada
    try {
      let jangada = await prisma.jangada.findFirst({
        where: {
          numeroSerie: analysis.jangada.numeroSerie,
        },
      });

      if (!jangada) {
        // Create new jangada
        jangada = await prisma.jangada.create({
          data: {
            numeroSerie: analysis.jangada.numeroSerie,
            tipo: analysis.jangada.tipo || 'Jangada Pneumática',
            status: 'ativo',
            estado: 'instalada',
            tecnico: analysis.jangada.tecnico || 'Sistema IA',
          },
        });
        result.warnings.push('Jangada criada como nova entrada no sistema');
      }

      // Update jangada with extracted data
      jangada = await prisma.jangada.update({
        where: { id: jangada.id },
        data: {
          ...(analysis.jangada.marca && { marca: { connect: { nome: analysis.jangada.marca } } }),
          // ...(analysis.jangada.modelo && { modelo: { connect: { nome: analysis.jangada.modelo } } }), // TODO: Fix modelo connection (requires marcaId)
          ...(analysis.jangada.lotacao && { lotacao: { connect: { capacidade: parseInt(analysis.jangada.lotacao.toString()) } } }),
          ...(analysis.jangada.dataFabricacao && { dataFabricacao: new Date(parseDataPortuguesa(analysis.jangada.dataFabricacao)) }),
          ...(analysis.jangada.dataInspecao && { dataInspecao: new Date(parseDataPortuguesa(analysis.jangada.dataInspecao)) }),
          ...(analysis.jangada.dataProximaInspecao && { dataProximaInspecao: new Date(parseDataPortuguesa(analysis.jangada.dataProximaInspecao)) }),
          updatedAt: new Date(),
        },
      });

      result.jangada = jangada;

      // Create or update certificate if provided
      if (analysis.jangada.certificadoNumero) {
        try {
          let certificado = await prisma.certificado.findFirst({
            where: {
              numero: analysis.jangada.certificadoNumero,
            },
          });

          if (!certificado) {
            certificado = await prisma.certificado.create({
              data: {
                tipo: 'Inspeção Jangada',
                numero: analysis.jangada.certificadoNumero,
                dataEmissao: analysis.jangada.dataInspecao 
                  ? new Date(parseDataPortuguesa(analysis.jangada.dataInspecao))
                  : new Date(),
                dataValidade: analysis.jangada.dataProximaInspecao
                  ? new Date(parseDataPortuguesa(analysis.jangada.dataProximaInspecao))
                  : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                entidadeEmissora: 'OREY Técnica Naval',
                jangadaId: jangada.id,
              },
            });
            result.warnings.push('Certificado criado com base nos dados da inspeção');
          }

          result.certificado = certificado;
        } catch (error) {
          console.error('Error creating certificate:', error);
          result.warnings.push('Não foi possível criar o certificado');
        }
      }

      // Process all components and sync with stock
      const stockSyncResult = {
        totalComponents: 0,
        updates: [] as Array<{
          nome: string;
          action: 'created' | 'decreased' | 'error';
          quantidade?: number;
          error?: string;
        }>,
      };

      // Process interior components
      if (analysis.componentes.interiores?.length > 0) {
        for (const comp of analysis.componentes.interiores) {
          try {
            result.componentes.interiores.push(comp);
            stockSyncResult.totalComponents++;
            
            // Sync with stock - decrease quantity if component exists
            if (comp.quantidade > 0) {
              const stockItem = await prisma.stock.findFirst({
                where: {
                  nome: { contains: comp.nome, mode: 'insensitive' },
                },
              });

              if (stockItem) {
                const newQty = Math.max(0, stockItem.quantidade - comp.quantidade);
                await prisma.stock.update({
                  where: { id: stockItem.id },
                  data: { quantidade: newQty },
                });
                stockSyncResult.updates.push({
                  nome: comp.nome,
                  action: 'decreased',
                  quantidade: comp.quantidade,
                });
              }
            }
          } catch (error) {
            result.warnings.push(`Erro ao processar componente interior: ${comp.nome}`);
          }
        }
      }

      // Process exterior components
      if (analysis.componentes.exteriores?.length > 0) {
        for (const comp of analysis.componentes.exteriores) {
          try {
            result.componentes.exteriores.push(comp);
            stockSyncResult.totalComponents++;

            // Sync with stock
            if (comp.quantidade > 0) {
              const stockItem = await prisma.stock.findFirst({
                where: {
                  nome: { contains: comp.nome, mode: 'insensitive' },
                },
              });

              if (stockItem) {
                const newQty = Math.max(0, stockItem.quantidade - comp.quantidade);
                await prisma.stock.update({
                  where: { id: stockItem.id },
                  data: { quantidade: newQty },
                });
                stockSyncResult.updates.push({
                  nome: comp.nome,
                  action: 'decreased',
                  quantidade: comp.quantidade,
                });
              }
            }
          } catch (error) {
            result.warnings.push(`Erro ao processar componente exterior: ${comp.nome}`);
          }
        }
      }

      // Process pack components
      if (analysis.componentes.pack?.length > 0) {
        for (const comp of analysis.componentes.pack) {
          try {
            result.componentes.pack.push(comp);
            stockSyncResult.totalComponents++;

            // Sync with stock
            if (comp.quantidade > 0) {
              const stockItem = await prisma.stock.findFirst({
                where: {
                  nome: { contains: comp.nome, mode: 'insensitive' },
                },
              });

              if (stockItem) {
                const newQty = Math.max(0, stockItem.quantidade - comp.quantidade);
                await prisma.stock.update({
                  where: { id: stockItem.id },
                  data: { quantidade: newQty },
                });
                stockSyncResult.updates.push({
                  nome: comp.nome,
                  action: 'decreased',
                  quantidade: comp.quantidade,
                });
              }
            }
          } catch (error) {
            result.warnings.push(`Erro ao processar componente de pack: ${comp.nome}`);
          }
        }
      }

      result.cilindros = analysis.cilindros?.map(cil => ({
        numero: cil.numero,
        tipo: cil.tipo,
        pressao: cil.pressao,
        gas: cil.gas,
        validade: cil.validade,
        dataProximo_teste: cil.dataProximo_teste,
        tipoCabecaDisparo: cil.tipoCabecaDisparo,
        tipoValvulas: cil.tipoValvulas,
        tiposValvulas: cil.tiposValvulas || [],
      }));
      result.success = result.errors.length === 0;

      return NextResponse.json({
        success: result.success,
        jangada: result.jangada,
        componentes: result.componentes,
        cilindros: result.cilindros,
        certificado: result.certificado,
        errors: result.errors,
        warnings: result.warnings,
        confianca: result.confianca,
        stockSync: stockSyncResult,
      });
    } catch (processError) {
      console.error('Error processing quadro:', processError);
      result.errors.push(`Erro ao processar dados: ${processError instanceof Error ? processError.message : 'Unknown error'}`);
      return NextResponse.json({ result }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in quadro import:', error);
    return NextResponse.json(
      { error: 'Erro ao processar ficheiro' },
      { status: 500 }
    );
  }
}

// Helper function to parse Portuguese date format
function parseDataPortuguesa(dateString: string): Date {
  // Try DD/MM/YYYY
  const ddMmYyyyMatch = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (ddMmYyyyMatch) {
    const [, day, month, year] = ddMmYyyyMatch;
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
  }

  // Try MM/YYYY
  const mmYyyyMatch = dateString.match(/(\d{1,2})\/(\d{4})/);
  if (mmYyyyMatch) {
    const [, month, year] = mmYyyyMatch;
    return new Date(`${year}-${month.padStart(2, '0')}-01`);
  }

  return new Date();
}
