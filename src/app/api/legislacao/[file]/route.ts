import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { deleteStoredFile, readStoredFile } from '@/lib/documentos-storage';

function sanitizeFilename(filename: string): string {
  return path.basename(filename);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ file: string }> }
) {
  const { file } = await context.params;
  try {
    const filename = sanitizeFilename(file);
    const stored = await readStoredFile('legislacao', filename);

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
  } catch (error: unknown) {
    console.error('Erro ao servir ficheiro:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Erro ao servir ficheiro', details },
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
    const deleted = await deleteStoredFile('legislacao', filename);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Ficheiro não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Legislação eliminada com sucesso.' });
  } catch (error: unknown) {
    console.error('Erro ao eliminar ficheiro:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Erro ao eliminar ficheiro', details },
      { status: 500 }
    );
  }
}
