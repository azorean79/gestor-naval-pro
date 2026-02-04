import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface StockImport {
  nome: string;
  categoria: string;
  quantidade?: string;
  quantidade_minima?: string;
  preco_unitario?: string;
  fornecedor?: string;
  localizacao?: string;
  ref_orey?: string;
  ref_fabricante?: string;
  lote?: string;
  descricao?: string;
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
    
    let data: StockImport[] = [];
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      const text = content.toString('utf-8');
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
      });
      data = parsed.data as StockImport[];
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const workbook = XLSX.read(content, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet) as StockImport[];
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
        if (!row.nome || !row.categoria) {
          results.errors++;
          results.messages.push(`Linha ${i + 2}: Nome e categoria são obrigatórios`);
          continue;
        }

        // Build description with references
        let descricaoCompleta = row.descricao || '';
        const refs = [];
        if (row.ref_orey) refs.push(`Ref. Orey: ${row.ref_orey}`);
        if (row.ref_fabricante) refs.push(`Ref. Fabricante: ${row.ref_fabricante}`);
        if (row.lote) refs.push(`Lote: ${row.lote}`);
        if (refs.length > 0) {
          descricaoCompleta = refs.join(' | ') + (descricaoCompleta ? ` - ${descricaoCompleta}` : '');
        }

        const quantidade = parseInt(row.quantidade || '0');

        const stockItem = await prisma.stock.create({
          data: {
            nome: row.nome,
            categoria: row.categoria,
            descricao: descricaoCompleta || null,
            quantidade: quantidade,
            quantidadeMinima: parseInt(row.quantidade_minima || '1'),
            precoUnitario: row.preco_unitario ? parseFloat(row.preco_unitario) : null,
            fornecedor: row.fornecedor || null,
            localizacao: row.localizacao || null,
            status: 'ativo',
          },
        });

        // Create initial movement if quantity > 0
        if (quantidade > 0) {
          await prisma.movimentacaoStock.create({
            data: {
              stockId: stockItem.id,
              tipo: 'entrada',
              quantidade: quantidade,
              motivo: 'Importação em massa',
              responsavel: 'Sistema',
            },
          });
        }

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
    console.error('Erro ao importar stock:', error);
    await prisma.$disconnect();
    return NextResponse.json(
      { error: 'Erro ao processar arquivo' },
      { status: 500 }
    );
  }
}
