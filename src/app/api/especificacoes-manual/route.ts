import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    // Salva no arquivo especificacoes-manual.json
    const filePath = path.join(process.cwd(), 'especificacoes-manual.json');
    let arr = [];
    if (fs.existsSync(filePath)) {
      arr = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    arr.push(data);
    fs.writeFileSync(filePath, JSON.stringify(arr, null, 2));
    return NextResponse.json({ success: true, message: 'Especificação salva.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Retorna todas as especificações manuais
  const filePath = path.join(process.cwd(), 'especificacoes-manual.json');
  if (!fs.existsSync(filePath)) {
    return NextResponse.json([]);
  }
  const arr = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return NextResponse.json(arr);
}
