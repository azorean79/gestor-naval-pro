import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { canEditPath } from "@/lib/user-permissions";
import { getAccessContext } from "@/lib/access-control";
import prisma from "@/lib/prisma";
import {
  deleteAuditoriaFile,
  inferContentType,
  listAuditoriaFiles,
  readAuditoriaFile,
  saveAuditoriaFile,
  sanitizeFilename,
} from "@/lib/auditorias-storage";

const EVIDENCIAS_DIR_PREFIX = "coletes-evidencias";
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".pdf"]);

function buildRelativeDir(id: number) {
  return `${EVIDENCIAS_DIR_PREFIX}/${id}`;
}

function isAllowedExtension(filename: string) {
  return ALLOWED_EXTENSIONS.has(path.extname(filename).toLowerCase());
}

async function getValidatedColete(id: number) {
  const access = await getAccessContext();
  if (!access) {
    return { access: null, colete: null, error: NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 }) };
  }

  const colete = await prisma.colete.findUnique({
    where: { id },
    select: { id: true, serial: true, shipId: true },
  });

  if (!colete) {
    return { access, colete: null, error: NextResponse.json({ error: "Colete não encontrado." }, { status: 404 }) };
  }

  return { access, colete, error: null };
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const { error } = await getValidatedColete(id);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const name = String(searchParams.get("name") || "").trim();

  if (name) {
    const relativePath = `${buildRelativeDir(id)}/${sanitizeFilename(path.basename(name))}`;
    const file = await readAuditoriaFile(relativePath);
    if (!file) {
      return NextResponse.json({ error: "Evidência não encontrada." }, { status: 404 });
    }

    return new NextResponse(file.buffer, {
      status: 200,
      headers: {
        "Content-Type": file.contentType || inferContentType(file.name),
        "Content-Disposition": `inline; filename="${file.name}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const files = await listAuditoriaFiles(buildRelativeDir(id));
  const evidencias = files
    .slice()
    .sort((a, b) => String(b.uploadedAt || b.modified).localeCompare(String(a.uploadedAt || a.modified)))
    .map((file) => ({
      name: file.name,
      originalName: file.originalName || file.name,
      size: file.size,
      uploadedAt: String(file.uploadedAt || file.modified),
      url: file.url || `/api/coletes/${id}/evidencias?name=${encodeURIComponent(file.name)}`,
    }));

  return NextResponse.json({ evidencias });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const { access, error } = await getValidatedColete(id);
  if (error) return error;

  if (!access?.isAdmin && !canEditPath(access.permissions, "/equipamentos")) {
    return NextResponse.json({ error: "Sem permissão para adicionar evidências." }, { status: 403 });
  }

  const formData = await request.formData();
  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);
  if (files.length === 0) {
    const maybeSingle = formData.get("file");
    if (maybeSingle instanceof File) files.push(maybeSingle);
  }

  if (files.length === 0) {
    return NextResponse.json({ error: "Nenhum ficheiro fornecido." }, { status: 400 });
  }

  for (const file of files) {
    if (!isAllowedExtension(file.name)) {
      return NextResponse.json({ error: `Formato inválido: ${file.name}. Usa JPG, PNG, WEBP ou PDF.` }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: `Ficheiro muito grande: ${file.name}. Máximo 20 MB.` }, { status: 400 });
    }
  }

  const uploaded = [] as Array<{ name: string; originalName?: string; size: number; uploadedAt?: string; url?: string }>;
  for (const file of files) {
    const safeOriginal = sanitizeFilename(path.basename(file.name));
    const finalName = `${Date.now()}-${safeOriginal}`;
    const saved = await saveAuditoriaFile(buildRelativeDir(id), finalName, await file.arrayBuffer(), file.type, file.name);
    uploaded.push({
      name: saved.name,
      originalName: saved.originalName,
      size: saved.size,
      uploadedAt: String(saved.uploadedAt || saved.modified),
      url: saved.url || `/api/coletes/${id}/evidencias?name=${encodeURIComponent(saved.name)}`,
    });
  }

  return NextResponse.json({ evidencias: uploaded }, { status: 201 });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const { access, error } = await getValidatedColete(id);
  if (error) return error;

  if (!access?.isAdmin && !canEditPath(access.permissions, "/equipamentos")) {
    return NextResponse.json({ error: "Sem permissão para remover evidências." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const name = String(searchParams.get("name") || "").trim();
  if (!name) {
    return NextResponse.json({ error: "Nome do ficheiro em falta." }, { status: 400 });
  }

  const deleted = await deleteAuditoriaFile(`${buildRelativeDir(id)}/${sanitizeFilename(path.basename(name))}`);
  if (!deleted) {
    return NextResponse.json({ error: "Evidência não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
