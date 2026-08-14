import { NextRequest, NextResponse } from "next/server";
import { sendTextBeeSms } from "@/lib/textbee-sms";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const phoneRaw = String(body?.phone ?? "").trim();
    const message = String(body?.message ?? "").trim();

    // Resolver o telemóvel a partir da ficha do cliente quando existir referência
    let phone = phoneRaw;
    const clienteId = Number(body?.clienteId);
    const jangadaId = Number(body?.jangadaId);
    const orderId = Number(body?.orderId);

    let cliente = null;
    if (orderId && Number.isFinite(orderId)) {
      cliente = await prisma.ordemServico.findUnique({
        where: { id: orderId },
        select: { cliente: { select: { telmovel: true, telefone: true } } },
      }).then((o) => o?.cliente || null);
    } else if (jangadaId && Number.isFinite(jangadaId)) {
      const ordem = await prisma.ordemServico.findFirst({
        where: { jangadaId, clienteId: { not: null } },
        orderBy: { createdAt: "desc" },
        select: { cliente: { select: { telmovel: true, telefone: true } } },
      });
      cliente = ordem?.cliente || null;
    } else if (clienteId && Number.isFinite(clienteId)) {
      cliente = await prisma.cliente.findUnique({
        where: { id: clienteId },
        select: { telmovel: true, telefone: true },
      });
    }

    // O telemóvel da ficha do cliente tem prioridade sobre o número enviado
    if (cliente) {
      const fichaTel = String(cliente.telmovel || "").trim() || String(cliente.telefone || "").trim();
      if (fichaTel) phone = fichaTel;
    }

    const result = await sendTextBeeSms(phone, message);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Falha ao enviar SMS." },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, phone });
  } catch (error) {
    console.error("[notificar-sms] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno ao enviar SMS." },
      { status: 500 },
    );
  }
}
