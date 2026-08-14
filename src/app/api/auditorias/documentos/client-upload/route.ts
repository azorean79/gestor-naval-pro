import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_CATEGORIES = [
  "calibracao",
  "tecnicos-rfd",
  "tecnicos-dsb",
  "tecnicos-zodiac",
  "estacao-servico",
] as const;

const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx", "txt", "jpg", "jpeg", "png"] as const;
const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;

function isAllowedCategory(value: string): value is (typeof ALLOWED_CATEGORIES)[number] {
  return ALLOWED_CATEGORIES.includes(value as (typeof ALLOWED_CATEGORIES)[number]);
}

function isAllowedExtension(filename: string): boolean {
  const ext = filename.toLowerCase().split(".").pop();
  return Boolean(ext && ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number]));
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[<>:"|?*]/g, "_").replace(/\.\./g, "_");
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "BLOB_READ_WRITE_TOKEN não configurado no servidor." },
        { status: 503 }
      );
    }

    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const match = pathname.match(/^auditorias-documentos\/(calibracao|tecnicos-rfd|tecnicos-dsb|tecnicos-zodiac|estacao-servico)\/([^/]+)$/i);
        if (!match) {
          throw new Error("Path de upload inválido.");
        }

        const category = match[1].toLowerCase();
        const rawFilename = match[2];

        if (!isAllowedCategory(category)) {
          throw new Error("Categoria inválida.");
        }

        const safeFilename = sanitizeFilename(rawFilename);
        if (safeFilename !== rawFilename) {
          throw new Error("Nome de ficheiro inválido.");
        }

        if (!isAllowedExtension(safeFilename)) {
          throw new Error("Tipo de ficheiro não permitido.");
        }

        return {
          allowedContentTypes: [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain",
            "image/jpeg",
            "image/png",
          ],
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: false,
          allowOverwrite: false,
        };
      },
      onUploadCompleted: async () => {
        return;
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Erro ao gerar token de upload para auditorias:", error);
    return NextResponse.json(
      { error: "Erro ao autorizar upload", details: String((error as Error)?.message || error) },
      { status: 400 }
    );
  }
}
