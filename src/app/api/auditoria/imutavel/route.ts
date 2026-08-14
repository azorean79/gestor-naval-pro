import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";

export async function GET(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const tabela = searchParams.get("tabela") || "";
    const dias = Math.min(365, Math.max(1, Number(searchParams.get("dias")) || 90));
    const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

    const logs = await prisma.auditoria.findMany({
      where: {
        createdAt: { gte: desde },
        ...(tabela ? { tabela } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return NextResponse.json({
      desde: desde.toISOString(),
      total: logs.length,
      logs: logs.map((l) => ({
        id: l.id,
        tabela: l.tabela,
        tipoOperacao: l.tipoOperacao,
        idRegisto: l.idRegisto,
        descricao: l.descricao,
        usuario: l.usuario,
        dadosAntes: l.dadosAntes ? JSON.parse(l.dadosAntes) : null,
        dadosDepois: l.dadosDepois ? JSON.parse(l.dadosDepois) : null,
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[GET /api/auditoria/imutavel]", error);
    return NextResponse.json({ error: "Erro ao consultar histórico de auditoria." }, { status: 500 });
  }
}
