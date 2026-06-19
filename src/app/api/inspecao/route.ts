import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const where: any = {};
  if (searchParams.get("certificadoNumero")) where.certificadoNumero = { contains: searchParams.get("certificadoNumero"), mode: "insensitive" };
  if (searchParams.get("navioNome")) where.navioNome = { contains: searchParams.get("navioNome"), mode: "insensitive" };
  if (searchParams.get("jangadaSerial")) where.jangadaSerial = { contains: searchParams.get("jangadaSerial"), mode: "insensitive" };
  if (searchParams.get("dataInspecao")) where.dataInspecao = { contains: searchParams.get("dataInspecao"), mode: "insensitive" };
  if (searchParams.get("status")) where.status = { contains: searchParams.get("status"), mode: "insensitive" };

  const inspecoes = await prisma.inspecao.findMany({
    where,
    include: { artigos: true }
  });
  return NextResponse.json(inspecoes);
}
