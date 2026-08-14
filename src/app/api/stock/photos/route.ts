import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

const photoCache = new Map<string, { url: string | null; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

let uploadedDirCache: Map<string, Set<string>> | null = null;

function getUploadedDirListing(uploadsDir: string): Set<string> {
  if (!uploadedDirCache) uploadedDirCache = new Map();
  if (uploadedDirCache.has(uploadsDir)) return uploadedDirCache.get(uploadsDir)!;
  const files = new Set<string>();
  try {
    if (fs.existsSync(uploadsDir)) {
      for (const f of fs.readdirSync(uploadsDir)) {
        files.add(f.toLowerCase());
      }
    }
  } catch (err) { console.error('[API Error] Erro ao listar diretório de uploads:', err); }
  uploadedDirCache.set(uploadsDir, files);
  return files;
}

function findPhotoUrl(referencia: string | null, codigoFabricante: string | null): string | null {
  const ref = String(referencia || "").trim();
  const brandSlug = slugify(codigoFabricante || "");
  if (!ref || !brandSlug) return null;

  const cacheKey = `${brandSlug}:${ref}`;
  const cached = photoCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.url;

  const uploadsDir = path.join(process.cwd(), "public", "uploads", brandSlug);
  const files = getUploadedDirListing(uploadsDir);
  if (files.size === 0) {
    photoCache.set(cacheKey, { url: null, ts: Date.now() });
    return null;
  }

  const extensions = [".jpg", ".jpeg", ".png", ".webp"];
  const namesToTry = Array.from(
    new Set([
      ref,
      ref.toLowerCase(),
      ref.toUpperCase(),
      slugify(ref),
    ].filter(Boolean))
  );

  for (const baseName of namesToTry) {
    for (const extension of extensions) {
      if (files.has(`${baseName}${extension}`.toLowerCase())) {
        const url = `/uploads/${brandSlug}/${baseName}${extension}`;
        photoCache.set(cacheKey, { url, ts: Date.now() });
        return url;
      }
    }
  }

  photoCache.set(cacheKey, { url: null, ts: Date.now() });
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids");
    if (!idsParam) {
      return NextResponse.json({ error: "Parâmetro 'ids' obrigatório." }, { status: 400 });
    }

    const ids = idsParam
      .split(",")
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => Number.isFinite(id) && id > 0);

    if (ids.length === 0) {
      return NextResponse.json({ error: "IDs inválidos." }, { status: 400 });
    }

    if (ids.length > 100) {
      return NextResponse.json({ error: "Máximo 100 IDs por请求." }, { status: 400 });
    }

    const items = await prisma.stock.findMany({
      where: { id: { in: ids } },
      select: { id: true, referencia: true, codigoFabricante: true },
    });

    const result: Record<number, string | null> = {};
    for (const item of items) {
      result[item.id] = findPhotoUrl(item.referencia, item.codigoFabricante);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao buscar fotos em batch:", error);
    return NextResponse.json({ error: "Erro ao buscar fotos." }, { status: 500 });
  }
}
