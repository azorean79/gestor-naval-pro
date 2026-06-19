import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { deleteStoredFile, readStoredFile } from '@/lib/documentos-storage';

function sanitizeFilename(filename: string): string {
  // Prevenir path traversal
  return path.basename(filename);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ file: string }> }
) {
  const { file } = await context.params;
  try {
    const filename = sanitizeFilename(file);
    const stored = await readStoredFile('documentacao', filename);

    if (!stored) {
      return NextResponse.json(
        { error: 'Ficheiro não encontrado' },
        { status: 404 }
      );
    }

    return new NextResponse(stored.buffer, {
      headers: {
        'Content-Type': stored.contentType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(stored.filename)}"`,
      },
    });
  } catch (error: any) {
    console.error('Erro ao servir ficheiro:', error);
    return NextResponse.json(
      { error: 'Erro ao servir ficheiro', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ file: string }> }
) {
  const { file } = await context.params;
  try {
    const filename = sanitizeFilename(file);
    const deleted = await deleteStoredFile('documentacao', filename);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Ficheiro não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Documento eliminado com sucesso.' });
  } catch (error: any) {
    console.error('Erro ao eliminar ficheiro:', error);
    return NextResponse.json(
      { error: 'Erro ao eliminar ficheiro', details: error.message },
      { status: 500 }
    );
  }
}
