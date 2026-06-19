import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { isAllowedFolder, listFiles, saveFile } from '@/lib/documentos-storage';

type FolderType = 'documentacao' | 'legislacao';

const DEFAULT_MAX_UPLOAD_BYTES = 500 * 1024 * 1024;

function getMaxUploadBytesByFolder(folder: FolderType): number {
  return DEFAULT_MAX_UPLOAD_BYTES;
}

function sanitizeFilename(filename: string): string {
  // Remove caracteres perigosos mas mantém acentos
  return filename.replace(/[<>:"|?*]/g, '_').replace(/\.\./g, '_');
}

function isAllowedExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  const allowed = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.jpg', '.jpeg', '.png'];
  return allowed.includes(ext);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = formData.get('folder') as FolderType | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum ficheiro fornecido' },
        { status: 400 }
      );
    }

    if (!isAllowedFolder(folder)) {
      return NextResponse.json(
        { error: 'Pasta inválida. Use: documentacao ou legislacao' },
        { status: 400 }
      );
    }

    // Validar tamanho (documentação/legislação: 500 MB)
    const maxSize = getMaxUploadBytesByFolder(folder);
    const maxSizeMb = (maxSize / 1024 / 1024).toFixed(0);
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `Ficheiro muito grande. Máximo: ${maxSizeMb} MB. Tamanho: ${(file.size / 1024 / 1024).toFixed(2)} MB` },
        { status: 400 }
      );
    }

    // Validar extensão
    if (!isAllowedExtension(file.name)) {
      return NextResponse.json(
        { error: 'Tipo de ficheiro não permitido. Use: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const savedName = await saveFile(folder, sanitizeFilename(file.name), bytes, file.type);

    return NextResponse.json({
      success: true,
      filename: savedName,
      originalName: file.name,
      size: file.size,
      folder,
      message: 'Ficheiro carregado com sucesso',
    });
  } catch (error: any) {
    console.error('Erro no upload:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar ficheiro', details: error.message },
      { status: 500 }
    );
  }
}

// Listar ficheiros de uma pasta
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') as FolderType | null;

    if (!isAllowedFolder(folder)) {
      return NextResponse.json(
        { error: 'Pasta inválida' },
        { status: 400 }
      );
    }

    const files = await listFiles(folder);
    return NextResponse.json({ files });
  } catch (error: any) {
    console.error('Erro ao listar ficheiros:', error);
    return NextResponse.json(
      { error: 'Erro ao listar ficheiros', details: error.message },
      { status: 500 }
    );
  }
}
