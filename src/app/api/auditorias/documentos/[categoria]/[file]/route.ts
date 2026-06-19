import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { deleteAuditoriaFile, readAuditoriaFile } from "@/lib/auditorias-storage";

const ALLOWED_CATEGORIES = [
  "calibracao",
  "tecnicos-rfd",
  "tecnicos-dsb",
  "tecnicos-zodiac",
  "estacao-servico",
] as const;

type CategoryType = (typeof ALLOWED_CATEGORIES)[number];

function isAllowedCategory(value: string): value is CategoryType {
  return ALLOWED_CATEGORIES.includes(value as CategoryType);
}

function sanitizeFilename(filename: string) {
  return path.basename(filename);
}

function resolveFilePath(category: string, file: string) {
  if (!isAllowedCategory(category)) return null;
  const safeFile = sanitizeFilename(file).replace(/\\/g, "/");
  return `${category}/${safeFile}`;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ categoria: string; file: string }> }
) {
  const { categoria, file } = await context.params;
  try {
    const filePath = resolveFilePath(categoria, file);
    if (!filePath) {
      return NextResponse.json({ error: "Categoria inválida" }, { status: 400 });
    }

    const fileData = await readAuditoriaFile(filePath);
    if (!fileData) {
      return NextResponse.json({ error: "Ficheiro não encontrado" }, { status: 404 });
    }

    return new NextResponse(fileData.buffer, {
      headers: {
        "Content-Type": fileData.contentType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(fileData.name)}"`,
      },
    });
  } catch (error: any) {
    console.error("Erro ao abrir documento de auditoria:", error);
    return NextResponse.json(
      { error: "Erro ao abrir documento", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ categoria: string; file: string }> }
) {
  const { categoria, file } = await context.params;
  try {
    const filePath = resolveFilePath(categoria, file);
    if (!filePath) {
      return NextResponse.json({ error: "Categoria inválida" }, { status: 400 });
    }

    const deleted = await deleteAuditoriaFile(filePath);
    if (!deleted) {
      return NextResponse.json({ error: "Ficheiro não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ message: "Documento eliminado com sucesso." });
  } catch (error: any) {
    console.error("Erro ao eliminar documento de auditoria:", error);
    return NextResponse.json(
      { error: "Erro ao eliminar documento", details: error.message },
      { status: 500 }
    );
  }
}
