import { NextRequest, NextResponse } from 'next/server';
import { analyzeMultipleDocuments } from '@/lib/gemini-analyzer';

export async function POST(request: NextRequest) {
  try {
    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY não configurado. Configure a chave da API no painel do Vercel ou no ficheiro .env. Obtenha gratuitamente em https://ai.google.dev/' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    
    // Support multiple files
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === 'file' || key === 'files' || key.startsWith('file')) {
        if (value instanceof File) {
          files.push(value);
        }
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum ficheiro enviado' },
        { status: 400 }
      );
    }

    // Validate file types
    for (const file of files) {
      const filename = file.name.toLowerCase();
      if (!filename.endsWith('.pdf') && !filename.endsWith('.xlsx') && !filename.endsWith('.xls') && !filename.endsWith('.csv')) {
        return NextResponse.json(
          { error: `Formato inválido: ${file.name}. Use PDF, Excel (.xlsx/.xls) ou CSV.` },
          { status: 400 }
        );
      }
    }

    // Convert files to buffers and analyze
    const filesToAnalyze = await Promise.all(
      files.map(async (file) => ({
        buffer: Buffer.from(await file.arrayBuffer()),
        fileName: file.name,
        mimeType: file.type
      }))
    );

    const analyses = await analyzeMultipleDocuments(filesToAnalyze);

    // Process results
    const results = analyses.map((analysis, index) => ({
      fileName: files[index].name,
      documentType: analysis.type,
      confidence: analysis.confidence,
      data: analysis.data,
      raw_analysis: analysis.raw_analysis
    }));

    // Return single or multiple results based on input
    if (files.length === 1) {
      return NextResponse.json({
        documentType: results[0].documentType,
        confidence: results[0].confidence,
        data: results[0].data,
        analysis: results[0]
      });
    }

    return NextResponse.json({
      totalFiles: files.length,
      results
    });

  } catch (error: any) {
    console.error('Error in document analysis:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Erro ao analisar documento',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
