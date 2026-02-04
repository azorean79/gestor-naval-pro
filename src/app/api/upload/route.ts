import { NextRequest, NextResponse } from 'next/server';
import { uploadMultipleFiles } from '@/lib/supabase-storage';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    
    // Suporta múltiplos ficheiros
    const files: File[] = [];
    for (const [key, value] of data.entries()) {
      if (key === 'file' || key === 'files' || key.startsWith('file')) {
        if (value instanceof File) {
          files.push(value);
        }
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // Verificar tipos e tamanhos
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ 
          error: `Arquivo ${file.name} não é uma imagem` 
        }, { status: 400 });
      }

      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ 
          error: `Arquivo ${file.name} muito grande. Máximo 5MB` 
        }, { status: 400 });
      }
    }

    // Upload para Supabase Storage
    const urls = await uploadMultipleFiles(files, 'uploads', 'stock');

    // Se for um único ficheiro, retorna formato compatível
    if (files.length === 1) {
      return NextResponse.json({
        success: true,
        url: urls[0],
        fileName: files[0].name
      });
    }

    // Múltiplos ficheiros
    return NextResponse.json({
      success: true,
      files: urls.map((url, index) => ({
        url,
        fileName: files[index].name
      }))
    });

  } catch (error: any) {
    console.error('Erro ao fazer upload:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}