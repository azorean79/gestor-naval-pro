import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";
import { getLocalDateKey } from "@/lib/date-utils";

export async function GET(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });

    const totalJangadas = await prisma.jangada.count();
    const jangadasComCertificadoValido = await prisma.jangada.count({
      where: {
        dataProxInspecao: { gte: getLocalDateKey() },
      },
    });

    const jangadasExpiradas = totalJangadas - jangadasComCertificadoValido;
    const taxaConformidade = totalJangadas > 0 ? Number(((jangadasComCertificadoValido / totalJangadas) * 100).toFixed(1)) : 100;

    const inspecoesRecentes = await prisma.inspecao.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    return NextResponse.json({
      conformidadeDGRM: {
        totalJangadas,
        validas: jangadasComCertificadoValido,
        expiradas: jangadasExpiradas,
        taxaConformidadePct: taxaConformidade,
        inspecoesUltimos30Dias: inspecoesRecentes,
        estadoGeral: taxaConformidade >= 90 ? "Excelente" : taxaConformidade >= 75 ? "Regular" : "Atenção Requerida",
      },
    });
  } catch (error) {
    console.error("[GET /api/qualidade-dados/dgrm]", error);
    return NextResponse.json({ error: "Erro ao gerar auditoria de conformidade DGRM." }, { status: 500 });
  }
}
