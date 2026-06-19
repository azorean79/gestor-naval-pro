import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { listAuditoriaFiles, saveAuditoriaFile, sanitizeFilename, upsertAuditoriaDocumentMetadata } from "@/lib/auditorias-storage";

const ALLOWED_CATEGORIES = [
  "calibracao",
  "tecnicos-rfd",
  "tecnicos-dsb",
  "tecnicos-zodiac",
  "estacao-servico",
] as const;

type CategoryType = (typeof ALLOWED_CATEGORIES)[number];

const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".txt",
  ".jpg",
  ".jpeg",
  ".png",
] as const;

function isAllowedCategory(value: string | null): value is CategoryType {
  return Boolean(value && ALLOWED_CATEGORIES.includes(value as CategoryType));
}

function isAllowedExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number]);
}

function getCategoryDir(category: CategoryType) {
  return category;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("categoria");

    if (!isAllowedCategory(category)) {
      return NextResponse.json(
        {
          error:
            "Categoria inválida. Use: calibracao, tecnicos-rfd, tecnicos-dsb, tecnicos-zodiac ou estacao-servico",
        },
        { status: 400 }
      );
    }

    const result = await listAuditoriaFiles(getCategoryDir(category));

    return NextResponse.json({
      files: result.map((file) => ({
        name: file.name,
        originalName: file.originalName || file.name,
        size: file.size,
        modified: file.modified,
        uploadedAt: file.uploadedAt || file.modified,
        directUrl: file.url || null,
        categoria: category,
      })),
    });
  } catch (error: any) {
    console.error("Erro ao listar documentos de auditoria:", error);
    return NextResponse.json(
      { error: "Erro ao listar documentos", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const payload = await request.json().catch(() => null) as {
        action?: string;
        categoria?: string;
        storedName?: string;
        originalName?: string;
        uploadedAt?: string;
      } | null;

      if (payload?.action === "registerBlobUpload") {
        if (!isAllowedCategory(payload.categoria || null)) {
          return NextResponse.json(
            {
              error:
                "Categoria inválida. Use: calibracao, tecnicos-rfd, tecnicos-dsb, tecnicos-zodiac ou estacao-servico",
            },
            { status: 400 }
          );
        }

        const storedName = sanitizeFilename(String(payload.storedName || ""));
        if (!storedName || !isAllowedExtension(storedName)) {
          return NextResponse.json(
            { error: "Nome/tipo de ficheiro inválido para registo." },
            { status: 400 }
          );
        }

        const originalName = String(payload.originalName || storedName).trim() || storedName;
        const uploadedAt = payload.uploadedAt || new Date().toISOString();

        await upsertAuditoriaDocumentMetadata(`${payload.categoria}/${storedName}`, originalName, uploadedAt);

        return NextResponse.json({
          success: true,
          filename: storedName,
          originalName,
          uploadedAt,
          categoria: payload.categoria,
          message: "Metadados de upload registados com sucesso",
        });
      }
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const category = formData.get("categoria") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum ficheiro fornecido" }, { status: 400 });
    }

    if (!isAllowedCategory(category)) {
      return NextResponse.json(
        {
          error:
            "Categoria inválida. Use: calibracao, tecnicos-rfd, tecnicos-dsb, tecnicos-zodiac ou estacao-servico",
        },
        { status: 400 }
      );
    }

    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `Ficheiro muito grande. Máximo: 500 MB.` },
        { status: 400 }
      );
    }

    if (!isAllowedExtension(file.name)) {
      return NextResponse.json(
        {
          error:
            "Tipo de ficheiro não permitido. Use: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG",
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const stored = await saveAuditoriaFile(
      getCategoryDir(category),
      sanitizeFilename(file.name),
      bytes,
      file.type,
      file.name
    );

    return NextResponse.json({
      success: true,
      filename: stored.name,
      originalName: stored.originalName || file.name,
      uploadedAt: stored.uploadedAt,
      categoria: category,
      message: "Documento carregado com sucesso",
    });
  } catch (error: any) {
    console.error("Erro no upload de documentos de auditoria:", error);
    return NextResponse.json(
      { error: "Erro ao carregar documento", details: error.message },
      { status: 500 }
    );
  }
}
