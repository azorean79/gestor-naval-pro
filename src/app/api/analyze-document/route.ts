import { NextRequest, NextResponse } from 'next/server';
import { analyzeDocument } from '@/lib/document-analyzer';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('Analyze document request received');

    let files: File[] = [];
    let jsonData: any = null;

    // Check content type to determine how to parse
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      // Handle JSON upload
      jsonData = await request.json();
      console.log('JSON data received for analysis');
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

    // Validate file types
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'application/pdf' // .pdf
    ];

    for (const file of files) {
      if (!allowedTypes.includes(file.type) &&
          !file.name.toLowerCase().endsWith('.xlsx') &&
          !file.name.toLowerCase().endsWith('.xls') &&
          !file.name.toLowerCase().endsWith('.csv') &&
          !file.name.toLowerCase().endsWith('.pdf')) {
        return NextResponse.json(
          { error: `Tipo de arquivo não suportado: ${file.name}` },
          { status: 400 }
        );
      }
    }

    // Process the first file
    const file = files[0];
    const buffer = Buffer.from(await file.arrayBuffer());

    console.log(`Processing file: ${file.name}, size: ${buffer.length} bytes, type: ${file.type}`);

    // Analyze with document analyzer
    const analysis = await analyzeDocument(buffer, file.name);

    console.log('=== ANALYSIS RESULT ===');
    console.log('Type:', analysis.type);
    console.log('Confidence:', analysis.confidence);
    console.log('Data keys:', Object.keys(analysis));
    console.log('======================');

    return NextResponse.json({
      success: true,
      data: analysis,
      fileName: file.name,
      fileType: file.type
    });

  } catch (error) {
    console.error('Error analyzing document:', error);
    return NextResponse.json(
      {
        error: 'Erro ao analisar documento',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}