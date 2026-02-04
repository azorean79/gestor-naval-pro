import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface ClienteImport {
  nome: string;
  email?: string;
  telefone?: string;
  nif?: string;
  morada?: string;
  cidade?: string;
  codigo_postal?: string;
  pais?: string;
  tipo_cliente?: string;
  notas?: string;
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
    
    let data: ClienteImport[] = [];
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      const text = content.toString('utf-8');
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
      });
      data = parsed.data as ClienteImport[];
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const workbook = XLSX.read(content, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet) as ClienteImport[];
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
        if (!row.nome) {
          results.errors++;
          results.messages.push(`Linha ${i + 2}: Nome é obrigatório`);
          continue;
        }

        await prisma.cliente.create({
          data: {
            nome: row.nome,
            email: row.email || null,
            telefone: row.telefone || null,
            nif: row.nif || null,
            endereco: [row.morada, row.cidade, row.codigo_postal, row.pais]
              .filter(Boolean)
              .join(', ') || null,
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
    console.error('Erro ao importar clientes:', error);
    await prisma.$disconnect();
    return NextResponse.json(
      { error: 'Erro ao processar arquivo' },
      { status: 500 }
    );
  }
}
