import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { buildDatabaseErrorResponse } from "@/lib/database-errors";
import { getAccessContext } from "@/lib/access-control";
import { buildVisibleServiceStationWhere } from "@/lib/service-station-visibility";

export async function GET() {
  try {
    const access = await getAccessContext();
    if (!access) {
      return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    }

    const stations = await prisma.serviceStation.findMany({
      where: buildVisibleServiceStationWhere({
        ativo: true,
        ...(access.stationId
          ? { id: access.stationId }
          : access.isAdmin
            ? {}
            : { id: { in: access.allowedStationIds.length ? access.allowedStationIds : [-1] } }),
      }),
      orderBy: [{ nome: "asc" }],
      select: {
        id: true,
        codigo: true,
        nome: true,
        empresa: true,
        localizacao: true,
        territorioTipo: true,
        regiaoOperacional: true,
      },
    });

    return NextResponse.json(stations);
  } catch (error: any) {
    return buildDatabaseErrorResponse(error, error?.message || "Erro ao listar estações de serviço.");
  }
}
