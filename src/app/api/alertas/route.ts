import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function parseDateFlexible(value: string | null | undefined) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct;

  const yyyyMmDd = raw.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (yyyyMmDd) {
    const year = Number(yyyyMmDd[1]);
    const month = Number(yyyyMmDd[2]);
    const day = Number(yyyyMmDd[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const parsed = new Date(year, month - 1, day);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }

    if (day >= 1 && day <= 12 && month >= 1 && month <= 31) {
      const parsedLegacy = new Date(year, day - 1, month);
      if (!Number.isNaN(parsedLegacy.getTime())) return parsedLegacy;
    }
  }

  const ddMmYyyy = raw.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (ddMmYyyy) {
    const day = Number(ddMmYyyy[1]);
    const month = Number(ddMmYyyy[2]);
    const year = Number(ddMmYyyy[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const parsed = new Date(year, month - 1, day);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
  }

  const mmYyyy = raw.match(/^(\d{1,2})[\/\-\.](\d{4})$/);
  if (mmYyyy) {
    const month = Number(mmYyyy[1]);
    const year = Number(mmYyyy[2]);
    if (month >= 1 && month <= 12) {
      const parsed = new Date(year, month - 1, 1);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
  }

  const mmYy = raw.match(/^(\d{1,2})[\/\-\.](\d{2})$/);
  if (mmYy) {
    const month = Number(mmYy[1]);
    const shortYear = Number(mmYy[2]);
    if (month >= 1 && month <= 12) {
      const fullYear = shortYear >= 70 ? 1900 + shortYear : 2000 + shortYear;
      const parsed = new Date(fullYear, month - 1, 1);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
  }

  return null;
}

function isWithinDays(dateText: string | null | undefined, days: number) {
  const parsedDate = parseDateFlexible(dateText);
  if (!parsedDate) return false;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const limit = new Date(now);
  limit.setDate(limit.getDate() + days);

  return parsedDate.getTime() >= now.getTime() && parsedDate.getTime() <= limit.getTime();
}

export async function GET() {
  try {
    const [jangadas, certificados, pendingOrders, epirbs] = await Promise.all([
      prisma.jangada.findMany({
        select: {
          id: true,
          serial: true,
          model: true,
          shipNameManual: true,
          dataProxInspecao: true,
        },
        take: 5000,
        orderBy: { id: "desc" },
      }),
      prisma.certificadoExtraido.findMany({
        select: {
          id: true,
          certificadoNumero: true,
          raftSerial: true,
          shipName: true,
          dataProxInspecao: true,
          sourceYear: true,
          isMaisRecente: true,
        },
        take: 5000,
        orderBy: { id: "desc" },
      }),
      prisma.ordemServico.findMany({
        where: {
          status: "pendente",
        },
        select: {
          id: true,
          numeroOrdem: true,
          dataPlaneadaInicio: true,
          dataAbertura: true,
          shipId: true,
          jangada: {
            select: {
              serial: true,
            },
          },
        },
        orderBy: { id: "desc" },
      }),
      prisma.epirb.findMany({
        where: {
          estado: "Ativo",
        },
        select: {
          id: true,
          serial: true,
          marca: true,
          modelo: true,
          dataProxInspecao: true,
          dataValidadeBateria: true,
        },
        take: 5000,
        orderBy: { id: "desc" },
      }),
    ]);

    // Resolve ship names for pending orders
    const shipIds = Array.from(new Set(pendingOrders.map((o) => o.shipId).filter((id): id is number => id !== null)));
    const ships = shipIds.length > 0
      ? await prisma.navio.findMany({
          where: { id: { in: shipIds } },
          select: { id: true, nome: true },
        })
      : [];
    const shipNameMap = new Map(ships.map((s) => [s.id, s.nome]));

    const alertasAssistencia = pendingOrders.map((o) => {
      const shipName = o.shipId ? shipNameMap.get(o.shipId) : null;
      const ref = shipName
        ? `Ordem nº ${o.numeroOrdem} - ${shipName}`
        : `Ordem nº ${o.numeroOrdem}`;
      return {
        tipo: "assistencia" as const,
        id: o.id,
        referencia: ref,
        data: o.dataPlaneadaInicio ? o.dataPlaneadaInicio.toISOString() : o.dataAbertura.toISOString(),
        jangadaSerial: o.jangada?.serial || null,
        ordemId: o.id,
      };
    });

    const alertasInspecao = jangadas
      .filter((j) => isWithinDays(j.dataProxInspecao, 30))
      .map((j) => ({
        tipo: "inspecao" as const,
        id: j.id,
        referencia:
          j.model?.trim() && j.serial?.trim()
            ? `${j.model} (${j.serial})`
            : j.serial || `Jangada ${j.id}`,
        data: j.dataProxInspecao,
        jangadaId: j.id,
        jangadaSerial: j.serial,
        status: j.shipNameManual || null,
      }));

    const alertasCertificado = certificados
      .filter((c) => c.isMaisRecente && isWithinDays(c.dataProxInspecao, 30))
      .map((c) => ({
        tipo: "certificado" as const,
        id: c.id,
        referencia: c.certificadoNumero || c.raftSerial || `Certificado ${c.id}`,
        data: c.dataProxInspecao,
        jangadaSerial: c.raftSerial,
        sourceYear: c.sourceYear,
        status: c.shipName || null,
      }));

    const alertasEpirb = epirbs
      .filter((e) => isWithinDays(e.dataProxInspecao, 30) || isWithinDays(e.dataValidadeBateria, 30))
      .map((e) => {
        const isBatteryExpiring = isWithinDays(e.dataValidadeBateria, 30);
        return {
          tipo: "epirb" as const,
          id: e.id,
          referencia: `EPIRB ${[e.marca, e.modelo].filter(Boolean).join(" ")} (${e.serial})`,
          data: isBatteryExpiring ? e.dataValidadeBateria : e.dataProxInspecao,
          jangadaSerial: e.serial,
          status: isBatteryExpiring ? "Bateria a expirar" : "Inspeção a expirar",
        };
      });

    const sortedExpirations = [...alertasInspecao, ...alertasCertificado, ...alertasEpirb].sort((a, b) => {
      const da = parseDateFlexible(a.data)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const db = parseDateFlexible(b.data)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return da - db;
    });

    const alertas = [...alertasAssistencia, ...sortedExpirations];

    return NextResponse.json({
      total: alertas.length,
      inspecoes: alertasInspecao.length,
      certificados: alertasCertificado.length,
      pedidosAssistencia: alertasAssistencia.length,
      epirbs: alertasEpirb.length,
      alertas,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error)?.message || "Erro ao gerar alertas" }, { status: 500 });
  }
}
