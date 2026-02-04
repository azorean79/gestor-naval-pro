import { NextRequest, NextResponse } from 'next/server';
import { analyzeQuadroInspecao } from '@/lib/gemini-analyzer';
import { prisma } from '@/lib/prisma';

interface QuadroImportResult {
  success: boolean;
  fileName: string;
  jangada?: any;
  componentes?: any[];
  cilindro?: any;
  testes?: any[];
  errors: string[];
  warnings: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY não configurado. Configure a chave da API no painel do Vercel. Obtenha gratuitamente em https://ai.google.dev/' },
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
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Validate all files are Excel
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
        return NextResponse.json(
          { error: `Ficheiro ${file.name} não é Excel. Apenas .xlsx e .xls são suportados.` },
          { status: 400 }
        );
      }
    }

    // Process all files
    const results: QuadroImportResult[] = await Promise.all(
      files.map(async (file) => {
        const result: QuadroImportResult = {
          success: false,
          fileName: file.name,
          errors: [],
          warnings: []
        };

        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          
          // Analyze with Gemini
          const analysis = await analyzeQuadroInspecao(buffer, file.type);

          // Process jangada data
          if (analysis.jangada?.numero_serie) {
            try {
              // Find or create jangada
              let jangada = await prisma.jangada.findFirst({
                where: { numeroSerie: analysis.jangada.numero_serie }
              });

              if (!jangada) {
                // Create new jangada
                jangada = await prisma.jangada.create({
                  data: {
                    numeroSerie: analysis.jangada.numero_serie,
                    tipo: analysis.jangada.marca || 'Jangada',
                    status: 'ativo',
                    estado: 'instalada',
                  }
                });
                result.warnings.push('Jangada criada automaticamente');
              }

              result.jangada = jangada;
              result.success = true;
            } catch (error: any) {
              result.errors.push(`Erro ao processar jangada: ${error.message}`);
            }
          } else {
            result.errors.push('Número de série da jangada não identificado');
          }

          // Process componentes substituidos
          if (analysis.componentes_substituidos && analysis.componentes_substituidos.length > 0) {
            result.componentes = analysis.componentes_substituidos;
          }

          // Process cilindro
          if (analysis.cilindro) {
            result.cilindro = analysis.cilindro;
          }

          // Process testes
          if (analysis.testes) {
            result.testes = analysis.testes;
          }

        } catch (error: any) {
          result.errors.push(`Erro ao processar: ${error.message}`);
        }

        return result;
      })
    );

    // Return single or multiple results
    if (files.length === 1) {
      const result = results[0];
      return NextResponse.json({
        success: result.success,
        jangada: result.jangada,
        componentes: result.componentes,
        cilindro: result.cilindro,
        testes: result.testes,
        errors: result.errors,
        warnings: result.warnings
      });
    }

    return NextResponse.json({
      totalFiles: files.length,
      results,
      summary: {
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });

  } catch (error: any) {
    console.error('Error in quadro import:', error);
    return NextResponse.json(
      { error: 'Erro ao processar ficheiro', details: error.message },
      { status: 500 }
    );
  }
}
