import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function cleanPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  return phone.replace(/\D/g, ""); // Keep only digits
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
    }

    const { telmovel, shipName } = body as { telmovel?: string; shipName?: string };

    if (!telmovel || !shipName) {
      return NextResponse.json({ error: "Telemóvel e nome do navio são obrigatórios." }, { status: 400 });
    }

    const cleanedTarget = cleanPhone(telmovel);
    if (!cleanedTarget) {
      return NextResponse.json({ error: "Número de telemóvel inválido." }, { status: 400 });
    }

    // Find client with matching phone
    const clientes = await prisma.cliente.findMany({
      select: {
        id: true,
        nome: true,
        telmovel: true,
        telefone: true,
        email: true,
      }
    });

    const cliente = clientes.find(c => {
      const t1 = cleanPhone(c.telmovel);
      const t2 = cleanPhone(c.telefone);
      return (t1 && t1.endsWith(cleanedTarget)) || 
             (t2 && t2.endsWith(cleanedTarget)) || 
             (cleanedTarget.endsWith(t1) && t1) || 
             (cleanedTarget.endsWith(t2) && t2);
    });

    if (!cliente) {
      return NextResponse.json({ error: "Cliente não encontrado com este telemóvel." }, { status: 404 });
    }

    // Verify if client owns a ship with that name (case-insensitive)
    const ship = await prisma.navio.findFirst({
      where: {
        clienteId: cliente.id,
        nome: {
          equals: shipName.trim(),
          mode: "insensitive"
        }
      }
    });

    if (!ship) {
      return NextResponse.json({ error: "Navio não associado a este cliente." }, { status: 404 });
    }

    // Generate a 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in client model
    await prisma.cliente.update({
      where: { id: cliente.id },
      data: {
        verificationCode: code,
        verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry
      }
    });

    // Mock SMS sending
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV SMS] Código para ${cliente.nome} (${ship.nome}): ${code}`);
    }

    return NextResponse.json({
      success: true,
      message: "Código enviado com sucesso.",
      code: process.env.NODE_ENV !== "production" ? code : undefined
    });
  } catch (error) {
    console.error("Error in client-code route:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
