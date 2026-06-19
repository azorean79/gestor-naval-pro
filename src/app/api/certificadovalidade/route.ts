import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const where: any = {};
  if (searchParams.get("certificadoId")) where.certificadoId = Number(searchParams.get("certificadoId"));
  if (searchParams.get("item")) where.item = { contains: searchParams.get("item"), mode: "insensitive" };
  if (searchParams.get("validade")) where.validade = { contains: searchParams.get("validade"), mode: "insensitive" };
  if (searchParams.get("rowNumber")) where.rowNumber = Number(searchParams.get("rowNumber"));

  const validades = await prisma.certificadoValidade.findMany({
    where,
    include: { certificado: true }
  });
  return NextResponse.json(validades);
}
