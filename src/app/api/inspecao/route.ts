import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const where: Prisma.InspecaoWhereInput = {};
  const certificadoNumero = searchParams.get("certificadoNumero"); if (certificadoNumero) where.certificadoNumero = { contains: certificadoNumero, mode: "insensitive" };
  const navioNome = searchParams.get("navioNome"); if (navioNome) where.navioNome = { contains: navioNome, mode: "insensitive" };
  const jangadaSerial = searchParams.get("jangadaSerial"); if (jangadaSerial) where.jangadaSerial = { contains: jangadaSerial, mode: "insensitive" };
  const dataInspecao = searchParams.get("dataInspecao"); if (dataInspecao) where.dataInspecao = { contains: dataInspecao, mode: "insensitive" };
  const status = searchParams.get("status"); if (status) where.status = { contains: status, mode: "insensitive" };

  const inspecoes = await prisma.inspecao.findMany({
    where,
    include: { artigos: true }
  });
  return NextResponse.json(inspecoes);
}
