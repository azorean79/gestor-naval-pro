import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";

export async function GET(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const dataInicio = searchParams.get("inicio") ? new Date(searchParams.get("inicio")!) : new Date();
    const dataFim = searchParams.get("fim")
      ? new Date(searchParams.get("fim")!)
      : new Date(dataInicio.getTime() + 7 * 24 * 60 * 60 * 1000);

    const tecnicos = await prisma.tecnico.findMany({
      where: { ativo: true },
      include: {
        ausencias: {
          where: {
            OR: [
              { dataInicio: { lte: dataFim }, dataFim: { gte: dataInicio } },
            ],
          },
        },
        ordensServico: {
          where: {
            status: { not: "concluida" },
          },
          select: {
            id: true,
            numeroOrdem: true,
            status: true,
            dataAbertura: true,
            dataPrevista: true,
            prioridade: true,
            tipo: true,
          },
        },
      },
    });

    const result = tecnicos.map((t) => {
      const carga = t.ordensServico.length;
      const indisponivel = t.ausencias.length > 0;
      const capacidadeMax = 8; // OTs ativas simultâneas por técnico
      const disponibilidadePct = indisponivel ? 0 : Math.max(0, Math.round((1 - carga / capacidadeMax) * 100));

      return {
        id: t.id,
        nome: t.nome,
        carga,
        indisponivel,
        ausencias: t.ausencias,
        ordens: t.ordensServico,
        disponibilidadePct,
        disponivel: !indisponivel && carga < capacidadeMax,
        capacidadeMax,
      };
    });

    return NextResponse.json({
      periodo: { dataInicio: dataInicio.toISOString(), dataFim: dataFim.toISOString() },
      tecnicos: result,
      resumo: {
        totalTecnicos: result.length,
        disponiveis: result.filter((r) => r.disponivel).length,
        indisponiveis: result.filter((r) => r.indisponivel).length,
      },
    });
  } catch (error) {
    console.error("[GET /api/tecnicos/agenda]", error);
    return NextResponse.json({ error: "Erro ao carregar agenda e carga de técnicos." }, { status: 500 });
  }
}
