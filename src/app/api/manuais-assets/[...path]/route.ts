import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const MANUAIS_DIR = path.resolve(process.cwd(), "manuais");

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".pdf":
      return "application/pdf";
    case ".html":
      return "text/html; charset=utf-8";
    case ".txt":
      return "text/plain; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

function resolveSafePath(segments: string[]): string | null {
  const decodedSegments = segments.map((segment) => decodeURIComponent(segment || "").trim());

  if (!decodedSegments.length || decodedSegments.some((s) => !s || s === "." || s === "..")) {
    return null;
  }

  const targetPath = path.resolve(MANUAIS_DIR, ...decodedSegments);
  if (!targetPath.startsWith(MANUAIS_DIR + path.sep) && targetPath !== MANUAIS_DIR) {
    return null;
  }

  return targetPath;
}

export async function GET(_req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: rawPath } = await context.params;
    const safePath = resolveSafePath(Array.isArray(rawPath) ? rawPath : []);

    if (!safePath) {
      return NextResponse.json({ error: "Caminho inválido." }, { status: 400 });
    }

    const stat = await fs.stat(safePath);
    if (!stat.isFile()) {
      return NextResponse.json({ error: "Ficheiro não encontrado." }, { status: 404 });
    }

    const content = await fs.readFile(safePath);
    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": getContentType(safePath),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Ficheiro não encontrado." }, { status: 404 });
  }
}
