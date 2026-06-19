import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const where: any = {};
  if (searchParams.get("fileName")) where.fileName = { contains: searchParams.get("fileName"), mode: "insensitive" };
  if (searchParams.get("certificadoNumero")) where.certificadoNumero = { contains: searchParams.get("certificadoNumero"), mode: "insensitive" };
  if (searchParams.get("raftSerial")) where.raftSerial = { contains: searchParams.get("raftSerial"), mode: "insensitive" };
  if (searchParams.get("shipName")) where.shipName = { contains: searchParams.get("shipName"), mode: "insensitive" };
  if (searchParams.get("dataInspecao")) where.dataInspecao = { contains: searchParams.get("dataInspecao"), mode: "insensitive" };
  if (searchParams.get("dataProxInspecao")) where.dataProxInspecao = { contains: searchParams.get("dataProxInspecao"), mode: "insensitive" };
  if (searchParams.get("emergencyPackType")) where.emergencyPackType = { contains: searchParams.get("emergencyPackType"), mode: "insensitive" };
  if (searchParams.get("isMaisRecente")) where.isMaisRecente = searchParams.get("isMaisRecente") === "true";

  const certificados = await prisma.certificadoExtraido.findMany({
    where,
    include: { jangada: true, jangadasAtivas: true, validities: true }
  });
  return NextResponse.json(certificados);
}
