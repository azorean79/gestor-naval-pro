import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function getInspecaoArtigoDelegate() {
  return (prisma as any).inspecaoArtigo ?? (prisma as any).InspecaoArtigo ?? null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const where: any = {};
  if (searchParams.get("referencia")) where.referencia = { contains: searchParams.get("referencia"), mode: "insensitive" };
  if (searchParams.get("descricao")) where.descricao = { contains: searchParams.get("descricao"), mode: "insensitive" };
  if (searchParams.get("inspecaoId")) where.inspecaoId = Number(searchParams.get("inspecaoId"));
  if (searchParams.get("stockId")) where.stockId = Number(searchParams.get("stockId"));

  const delegate = getInspecaoArtigoDelegate();
  if (!delegate) {
    return NextResponse.json([]);
  }

  const artigos = await delegate.findMany({
    where,
    include: { inspecao: true, stock: true },
  });

  return NextResponse.json(artigos);
}
