import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_FOLDERS = ["documentacao", "legislacao"] as const;
const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx", "txt", "jpg", "jpeg", "png"] as const;
const DEFAULT_MAX_UPLOAD_BYTES = 500 * 1024 * 1024;

function isAllowedFolder(folder: string): folder is (typeof ALLOWED_FOLDERS)[number] {
  return ALLOWED_FOLDERS.includes(folder as (typeof ALLOWED_FOLDERS)[number]);
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
        const match = pathname.match(/^documentos-tecnicos\/(documentacao|legislacao)\/([^/]+)$/i);
        if (!match) {
          throw new Error("Path de upload inválido.");
        }

        const folder = match[1].toLowerCase();
        const rawFilename = match[2];

        if (!isAllowedFolder(folder)) {
          throw new Error("Pasta inválida.");
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
          maximumSizeInBytes: DEFAULT_MAX_UPLOAD_BYTES,
          addRandomSuffix: false,
          allowOverwrite: false,
        };
      },
      onUploadCompleted: async () => {
        return;
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error: unknown) {
    console.error("Erro ao gerar token de upload:", error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Erro ao autorizar upload", details },
      { status: 400 }
    );
  }
}
