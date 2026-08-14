import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { canonicalizeDateFields } from "@/lib/date-display";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const epirb = await prisma.epirb.findUnique({
      where: { id: parseInt(id) },
    });
    if (!epirb) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(epirb);
  } catch (error) {
    console.error("GET epirb error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = canonicalizeDateFields(await req.json(), [
      "dataInspecao",
      "dataProxInspecao",
      "dataValidadeBateria",
    ]);
    const current = await prisma.epirb.findUnique({
      where: { id: parseInt(id) },
      select: { shipId: true, serial: true }
    });

    const newShipId = body.shipId ? parseInt(body.shipId) : null;

    if (current && newShipId !== current.shipId) {
      let origemNome = null;
      let destinoNome = null;

      if (current.shipId) {
        const s = await prisma.navio.findUnique({ where: { id: current.shipId }, select: { nome: true } });
        origemNome = s?.nome || null;
      }
      if (newShipId) {
        const s = await prisma.navio.findUnique({ where: { id: newShipId }, select: { nome: true } });
        destinoNome = s?.nome || null;
      }

      await prisma.movimentoEquipamento.create({
        data: {
          tipoEquipamento: "Epirb",
          equipamentoId: parseInt(id),
          serial: current.serial || body.serial || "",
          origemShipId: current.shipId,
          origemShipNome: origemNome,
          destinoShipId: newShipId,
          destinoShipNome: destinoNome,
          motivo: "Alteração de Navio"
        }
      });
    }

    const epirb = await prisma.epirb.update({
      where: { id: parseInt(id) },
      data: {
        serial: body.serial,
        shipId: body.shipId ? parseInt(body.shipId) : null,
        marca: body.marca,
        modelo: body.modelo,
        tipo: body.tipo,
        hexId: body.hexId,
        estado: body.estado,
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
    console.error("PUT epirb error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.epirb.delete({
      where: { id: parseInt(id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE epirb error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
