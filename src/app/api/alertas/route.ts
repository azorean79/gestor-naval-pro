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
    const [jangadas, certificados] = await Promise.all([
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
    ]);

    const alertasInspecao = jangadas
      .filter((j) => isWithinDays(j.dataProxInspecao, 30))
      .map((j) => ({
        tipo: "inspecao",
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
        tipo: "certificado",
        id: c.id,
        referencia: c.certificadoNumero || c.raftSerial || `Certificado ${c.id}`,
        data: c.dataProxInspecao,
        jangadaSerial: c.raftSerial,
        sourceYear: c.sourceYear,
        status: c.shipName || null,
      }));

    const alertas = [...alertasInspecao, ...alertasCertificado].sort((a, b) => {
      const da = parseDateFlexible(a.data)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const db = parseDateFlexible(b.data)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return da - db;
    });

    return NextResponse.json({
      total: alertas.length,
      inspecoes: alertasInspecao.length,
      certificados: alertasCertificado.length,
      alertas,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erro ao gerar alertas" }, { status: 500 });
  }
}
