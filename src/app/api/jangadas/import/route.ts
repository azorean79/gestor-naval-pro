import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { analyzeDocument, parseDate } from '@/lib/document-analyzer';

interface JangadaImport {
  numero_serie: string;
  marca: string;
  modelo: string;
  tipo: string;
  capacidade: string;
  data_fabricacao?: string;
  navio_matricula: string;
  status?: string;
  estado?: string;
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

    const buffer = await file.arrayBuffer();
    const content = Buffer.from(buffer);
    
    let data: JangadaImport[] = [];
    const fileName = file.name.toLowerCase();
    
    // Check if file is inspection report or certificate (PDF/XLSX with structure)
    const isPotentialDocument = fileName.endsWith('.pdf') || 
                               (fileName.includes('inspec') || fileName.includes('certific') || fileName.includes('quadro'));
    
    // Try to analyze as document first
    if (isPotentialDocument) {
      try {
        const analysis = await analyzeDocument(Buffer.from(buffer), fileName);
        
        if (analysis.type === 'quadro_inspecao' && analysis.jangada) {
          // Process inspection report data
          const jData = analysis.jangada;
          
          if (!jData.numeroSerie || !jData.marca || !jData.navioMatricula) {
            return NextResponse.json(
              { error: 'Dados de inspeção incompletos. Número de série, marca e matrícula do navio são obrigatórios.' },
              { status: 400 }
            );
          }

          // Find navio by matricula
          const navio = await prisma.navio.findFirst({
            where: { matricula: jData.navioMatricula }
          });

          if (!navio) {
            return NextResponse.json(
              { error: `Navio com matrícula ${jData.navioMatricula} não encontrado` },
              { status: 404 }
            );
          }

          // Find or create marca
          let marca = await prisma.marcaJangada.findFirst({
            where: { nome: jData.marca, ativo: true }
          });
          if (!marca) {
            marca = await prisma.marcaJangada.create({
              data: { nome: jData.marca }
            });
          }

          // Find or create modelo
          let modelo = null;
          if (jData.modelo) {
            modelo = await prisma.modeloJangada.findFirst({
              where: {
                nome: jData.modelo,
                marcaId: marca.id,
                ativo: true
              }
            });
            if (!modelo) {
              modelo = await prisma.modeloJangada.create({
                data: {
                  nome: jData.modelo,
                  marcaId: marca.id
                }
              });
            }
          }

          // Find or create lotacao
          const capacidade = jData.capacidade || 8;
          let lotacao = await prisma.lotacaoJangada.findFirst({
            where: { capacidade, ativo: true }
          });
          if (!lotacao) {
            lotacao = await prisma.lotacaoJangada.create({
              data: { capacidade }
            });
          }

          // Check if jangada exists
          let jangada = await prisma.jangada.findFirst({
            where: { numeroSerie: jData.numeroSerie }
          });

          if (!jangada) {
            // Create new jangada
            jangada = await prisma.jangada.create({
              data: {
                numeroSerie: jData.numeroSerie,
                marcaId: marca.id,
                modeloId: modelo?.id,
                tipo: jData.tipo || '',
                lotacaoId: lotacao?.id,
                dataFabricacao: parseDate(jData.dataFabricacao),
                status: (jData.status as any) || 'ativo',
                estado: (jData.estado as any) || 'instalada',
                dataInspecao: parseDate(jData.dataInspecao),
                dataProximaInspecao: parseDate(jData.dataProximaInspecao),
                clienteId: navio.clienteId,
              },
            });
          } else {
            // Update existing jangada with inspection data
            jangada = await prisma.jangada.update({
              where: { id: jangada.id },
              data: {
                dataInspecao: parseDate(jData.dataInspecao) || jangada.dataInspecao,
                dataProximaInspecao: parseDate(jData.dataProximaInspecao) || jangada.dataProximaInspecao,
                status: (jData.status as any) || jangada.status,
                estado: (jData.estado as any) || jangada.estado,
              }
            });
          }

          // Import components if found
          let componentesImportados = 0;
          if (analysis.componentes && analysis.componentes.length > 0) {
            for (const comp of analysis.componentes) {
              try {
                // Create component inspection record
                await prisma.inspecaoComponente.create({
                  data: {
                    jangadaId: jangada.id,
                    nome: comp.nome,
                    quantidade: comp.quantidade,
                    estado: comp.estado,
                    validade: parseDate(comp.validade),
                    tipo: comp.tipo,
                    notas: comp.notas,
                  }
                });
                componentesImportados++;
              } catch (error: any) {
                console.error(`Erro ao importar componente ${comp.nome}:`, error.message);
              }
            }
          }

          await prisma.$disconnect();
          return NextResponse.json({
            success: 1,
            errors: 0,
            type: 'quadro_inspecao',
            jangada: {
              numeroSerie: jangada.numeroSerie,
              marca: marca.nome,
              modelo: modelo?.nome,
              capacidade
            },
            componentesImportados,
            mensagem: `Inspeção importada com sucesso. ${componentesImportados} componentes registrados.`,
          });
        } else if (analysis.type === 'certificado' && analysis.navio) {
          // Process certificate data
          return NextResponse.json({
            error: 'Este ficheiro é um certificado de navio. Use a rota /api/navios/import para certificados.',
            documentoDetectado: 'certificado'
          }, { status: 400 });
        }
      } catch (error: any) {
        console.log('Não foi possível analisar como documento estruturado, tentando CSV/XLSX standard:', error.message);
        // Fall through to standard CSV/XLSX processing
      }
    }

    if (fileName.endsWith('.csv')) {
      const text = content.toString('utf-8');
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
      });
      data = parsed.data as JangadaImport[];
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const workbook = XLSX.read(content, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet) as JangadaImport[];
    } else {
      return NextResponse.json(
        { error: 'Formato não suportado. Use CSV ou XLSX.' },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      errors: 0,
      messages: [] as string[],
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        if (!row.numero_serie || !row.marca || !row.navio_matricula) {
          results.errors++;
          results.messages.push(`Linha ${i + 2}: Número de série, marca e matrícula do navio são obrigatórios`);
          continue;
        }

        // Find navio by matricula
        const navio = await prisma.navio.findFirst({
          where: { matricula: row.navio_matricula }
        });

        if (!navio) {
          results.errors++;
          results.messages.push(`Linha ${i + 2}: Navio com matrícula ${row.navio_matricula} não encontrado`);
          continue;
        }

        // Find or create marca
        let marca = await prisma.marcaJangada.findFirst({
          where: { nome: row.marca, ativo: true }
        });
        if (!marca && row.marca) {
          marca = await prisma.marcaJangada.create({
            data: { nome: row.marca }
          });
        }

        // Find or create modelo (associated with marca)
        let modelo = null;
        if (marca && row.modelo) {
          modelo = await prisma.modeloJangada.findFirst({
            where: {
              nome: row.modelo,
              marcaId: marca.id,
              ativo: true
            }
          });
          if (!modelo) {
            modelo = await prisma.modeloJangada.create({
              data: {
                nome: row.modelo,
                marcaId: marca.id
              }
            });
          }
        }

        // Find or create lotacao
        const capacidade = parseInt(row.capacidade) || 8;
        let lotacao = await prisma.lotacaoJangada.findFirst({
          where: { capacidade: capacidade, ativo: true }
        });
        if (!lotacao) {
          lotacao = await prisma.lotacaoJangada.create({
            data: { capacidade }
          });
        }

        await prisma.jangada.create({
          data: {
            numeroSerie: row.numero_serie,
            marcaId: marca?.id,
            modeloId: modelo?.id,
            tipo: row.tipo || '',
            lotacaoId: lotacao?.id,
            dataFabricacao: row.data_fabricacao ? new Date(row.data_fabricacao) : null,
            status: (row.status as any) || 'ativo',
            estado: (row.estado as any) || 'instalada',
            clienteId: navio.clienteId,
          },
        });

        results.success++;
      } catch (error: any) {
        results.errors++;
        results.messages.push(`Linha ${i + 2}: ${error.message || 'Erro desconhecido'}`);
      }
    }

    await prisma.$disconnect();

    return NextResponse.json({
      success: results.success,
      errors: results.errors,
      messages: results.messages,
    });

  } catch (error) {
    console.error('Erro ao importar jangadas:', error);
    await prisma.$disconnect();
    return NextResponse.json(
      { error: 'Erro ao processar arquivo' },
      { status: 500 }
    );
  }
}
