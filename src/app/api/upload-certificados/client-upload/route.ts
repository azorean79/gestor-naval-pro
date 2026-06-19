import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";

const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;

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
        const match = pathname.match(/^certificados-externos\/([^/]+)$/i);
        if (!match) {
          throw new Error("Path de upload inválido.");
        }

        const rawFilename = match[1];
        const safeFilename = sanitizeFilename(rawFilename);
        if (safeFilename !== rawFilename) {
          throw new Error("Nome de ficheiro inválido.");
        }

        if (!safeFilename.toLowerCase().endsWith(".pdf")) {
          throw new Error("Apenas ficheiros PDF são permitidos.");
        }

        return {
          allowedContentTypes: ["application/pdf"],
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: false,
          allowOverwrite: true,
        };
      },
      onUploadCompleted: async () => {
        return;
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    console.error("Erro ao gerar token de upload para certificados:", error);
    return NextResponse.json(
      { error: "Erro ao autorizar upload", details: String(error?.message || error) },
      { status: 400 }
    );
  }
}
