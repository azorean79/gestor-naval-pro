import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "node:fs";
import path from "node:path";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await context.params;
    const woId = parseInt(rawId);
    const formData = await req.formData();
    const fieldName = formData.get("fieldName") as string;
    const file = formData.get("file") as File;

    if (!fieldName || !file) {
      return NextResponse.json({ error: "Campo ou ficheiro ausente." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Salvar no diretório de uploads da OT
    const uploadDir = path.join(process.cwd(), "public", "uploads", "workorders", String(woId));
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Gerar nome único ou baseado no campo
    const fileName = `${fieldName}_${Date.now()}.jpg`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/workorders/${woId}/${fileName}`;
    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Erro no upload de foto da checklist:", error);
    return NextResponse.json({ error: "Erro interno no upload." }, { status: 500 });
  }
}
