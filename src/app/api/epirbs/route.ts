import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";
import { canonicalizeDateFields } from "@/lib/date-display";

export async function GET() {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });

    const epirbs = await prisma.epirb.findMany({
      orderBy: { id: "desc" },
    });
    return NextResponse.json(epirbs);
  } catch (error) {
    console.error("GET epirbs error:", error);
    return NextResponse.json({ error: "Erro ao buscar EPIRBs." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    if (!access.isAdmin) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

    const body = canonicalizeDateFields(await req.json(), [
      "dataInspecao",
      "dataProxInspecao",
      "dataValidadeBateria",
    ]);
    if (!body.serial || typeof body.serial !== "string" || !body.serial.trim()) {
      return NextResponse.json({ error: "Serial é obrigatório." }, { status: 400 });
    }
    const epirb = await prisma.epirb.create({
      data: {
        serial: body.serial,
        shipId: body.shipId ? parseInt(body.shipId) : null,
        marca: body.marca,
        modelo: body.modelo,
        tipo: body.tipo,
        hexId: body.hexId,
        estado: body.estado || "Ativo",
        dataInspecao: body.dataInspecao,
        dataProxInspecao: body.dataProxInspecao,
        dataValidadeBateria: body.dataValidadeBateria,
        ownerName: body.ownerName,
        ownerAddress: body.ownerAddress,
        ownerPhone: body.ownerPhone,
        emergencyContact1Name: body.emergencyContact1Name,
        emergencyContact1Phone: body.emergencyContact1Phone,
        emergencyContact2Name: body.emergencyContact2Name,
        emergencyContact2Phone: body.emergencyContact2Phone,
        observacoes: body.observacoes,
      },
    });
    return NextResponse.json(epirb);
  } catch (error) {
    console.error("POST epirbs error:", error);
    return NextResponse.json({ error: "Erro ao criar EPIRB." }, { status: 500 });
  }
}
