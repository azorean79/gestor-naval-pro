import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { analyzeDocument, parseDate } from '@/lib/document-analyzer';

interface NavioImport {
  nome: string;
  matricula: string;
  imo?: string;
  tipo?: string;
  armador?: string;
  proprietario?: string;
  bandeira?: string;
  ano_construcao?: string;
  status?: string;
  porto_registo?: string;
  arqueacao_bruta?: string;
  arqueacao_liquida?: string;
  comprimento?: string;
  boca?: string;
  calado?: string;
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
    
    let data: NavioImport[] = [];
    const fileName = file.name.toLowerCase();
    
    // Check if file is a document (PDF/XLSX certificate)
    const isPotentialCertificate = fileName.endsWith('.pdf') || 
                                   (fileName.includes('certific') || fileName.includes('navio'));
    
    // Try to analyze as certificate first
    if (isPotentialCertificate) {
      try {
        const analysis = await analyzeDocument(Buffer.from(buffer), fileName);
        
        if (analysis.type === 'certificado' && analysis.navio) {
          // Process certificate data
          const nData = analysis.navio;
          
          if (!nData.nome || !nData.matricula) {
            return NextResponse.json(
              { error: 'Dados do certificado incompletos. Nome e matrícula do navio são obrigatórios.' },
              { status: 400 }
            );
          }

          // Check if navio already exists
          let navio = await prisma.navio.findFirst({
            where: { matricula: nData.matricula }
          });

          if (!navio) {
            // Create new navio
            navio = await prisma.navio.create({
              data: {
                nome: nData.nome,
                tipo: nData.tipo || 'Navio',
                matricula: nData.matricula,
                comprimento: nData.comprimento || undefined,
                largura: nData.largura || undefined,
                calado: nData.calado || undefined,
                anoConstrucao: nData.anoConstrucao || undefined,
                status: nData.status || 'ativo',
                dataInspecao: parseDate(nData.dataInspecao),
                dataProximaInspecao: parseDate(nData.dataProximaInspecao),
              },
            });
          } else {
            // Update existing navio with certificate data
            navio = await prisma.navio.update({
              where: { id: navio.id },
              data: {
                dataInspecao: parseDate(nData.dataInspecao) || navio.dataInspecao,
                dataProximaInspecao: parseDate(nData.dataProximaInspecao) || navio.dataProximaInspecao,
                status: nData.status || navio.status,
              }
            });
          }

          await prisma.$disconnect();
          return NextResponse.json({
            success: 1,
            errors: 0,
            type: 'certificado',
            navio: {
              nome: navio.nome,
              matricula: navio.matricula,
              tipo: navio.tipo,
              dataInspecao: navio.dataInspecao,
              dataProximaInspecao: navio.dataProximaInspecao,
            },
            mensagem: `Certificado importado com sucesso. Navio ${navio.nome} atualizado.`,
          });
        }
      } catch (error: any) {
        console.log('Não foi possível analisar como certificado estruturado, tentando CSV/XLSX standard:', error.message);
        // Fall through to standard CSV/XLSX processing
      }
    }
    
    // Parse based on file type for standard CSV/XLSX
    if (fileName.endsWith('.csv')) {
      const text = content.toString('utf-8');
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
      });
      data = parsed.data as NavioImport[];
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const workbook = XLSX.read(content, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet) as NavioImport[];
    } else if (fileName.endsWith('.pdf')) {
      // Para PDF, tentamos extrair texto e processar
      return NextResponse.json(
        { error: 'Importação de PDF requer processamento manual. Use CSV ou XLSX.' },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { error: 'Formato de arquivo não suportado. Use CSV, XLSX ou PDF.' },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      errors: 0,
      messages: [] as string[],
    };

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        if (!row.nome || !row.matricula) {
          results.errors++;
          results.messages.push(`Linha ${i + 2}: Nome e matrícula são obrigatórios`);
          continue;
        }

        await prisma.navio.create({
          data: {
            nome: row.nome || '',
            matricula: row.matricula || '',
            tipo: row.tipo || 'Navio',
            status: 'ativo',
          },
        });

        results.success++;
      } catch (error: any) {
        results.errors++;
        const errorMsg = error.message || 'Erro desconhecido';
        results.messages.push(`Linha ${i + 2}: ${errorMsg}`);
      }
    }

    await prisma.$disconnect();

    return NextResponse.json({
      success: results.success,
      errors: results.errors,
      messages: results.messages,
    });

  } catch (error) {
    console.error('Erro ao importar navios:', error);
    await prisma.$disconnect();
    return NextResponse.json(
      { error: 'Erro ao processar arquivo' },
      { status: 500 }
    );
  }
}
