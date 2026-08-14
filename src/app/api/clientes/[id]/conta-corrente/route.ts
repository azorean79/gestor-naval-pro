import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const access = await getAccessContext();
    if (!access) {
      return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    }

    const { id: rawId } = await context.params;
    const clienteId = Number(rawId);
    if (!Number.isFinite(clienteId) || clienteId <= 0) {
      return NextResponse.json({ error: "ID de cliente inválido." }, { status: 400 });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: {
        ordensServico: {
          orderBy: { dataAbertura: "desc" },
          include: {
            jangada: { select: { id: true, serial: true, brand: true, model: true, shipNameManual: true } },
          },
        },
        navios: { select: { id: true, nome: true, matricula: true, ilha: true } },
      },
    });

    if (!cliente) {
      return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
    }

    const ordens = cliente.ordensServico || [];
    const totalFaturado = ordens.reduce((sum, o) => sum + (o.valorTotal || 0), 0);
    const totalConcluido = ordens.filter((o) => o.status === "concluida").reduce((sum, o) => sum + (o.valorTotal || 0), 0);
    const totalPendente = ordens.filter((o) => o.status !== "concluida" && o.status !== "cancelada").reduce((sum, o) => sum + (o.valorTotal || 0), 0);

    const extrato = {
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        numeroCliente: cliente.numeroCliente,
        nif: cliente.nif,
        email: cliente.email,
        telefone: cliente.telefone || cliente.telmovel,
        morada: cliente.morada,
      },
      resumo: {
        totalObras: ordens.length,
        totalFaturado,
        totalConcluido,
        totalPendente,
      },
      movimentos: ordens.map((o) => ({
        id: o.id,
        numeroOrdem: o.numeroOrdem,
        tipo: o.tipo,
        status: o.status,
        orcamentoStatus: o.orcamentoStatus,
        dataAbertura: o.dataAbertura,
        dataConclusao: o.dataConclusao,
        valorTotal: o.valorTotal,
        valorPecas: o.valorPecas,
        valorMaoObra: o.valorMaoObra,
        jangada: o.jangada ? `${o.jangada.brand || ""} ${o.jangada.model || ""} (${o.jangada.serial || ""})` : null,
        navio: o.jangada?.shipNameManual || null,
      })),
      navios: cliente.navios,
    };

    return NextResponse.json(extrato);
  } catch (error: unknown) {
    console.error("Erro ao obter conta-corrente:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno ao consultar conta-corrente." }, { status: 500 });
  }
}
