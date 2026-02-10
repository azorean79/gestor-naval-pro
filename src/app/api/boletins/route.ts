import { NextRequest, NextResponse } from 'next/server';
// import fs from 'fs';
// import path from 'path';
// const pdfParse = require('pdf-parse');
import { aplicarBoletimExtraido } from '@/lib/boletins-aplicador'; // Supondo função de aplicação

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Arquivo não enviado.' }, { status: 400 });
    }
    // const arrayBuffer = await file.arrayBuffer();
    // const buffer = Buffer.from(arrayBuffer);
    // Extrair texto do PDF
    // const pdfData = await pdfParse(buffer);
    // Aqui pode chamar IA ou lógica para extrair dados relevantes do boletim
    // const resultado = await aplicarBoletimExtraido(pdfData.text);
    // return NextResponse.json({ success: true, resultado });
    return NextResponse.json({ success: false, error: 'Processamento de PDF desativado temporariamente para build.' }, { status: 503 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
