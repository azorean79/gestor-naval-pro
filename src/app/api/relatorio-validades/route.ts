import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";

export async function GET() {
  const access = await getAccessContext();
  if (!access) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  try {
    const waterExpiring = await prisma.artigoJangada.findMany({
      where: { name: { contains: "Água" }, validade: { lte: thirtyDays, gte: now } },
      select: { id: true, name: true, quantidade: true, validade: true, jangadaId: true, Jangada: { select: { serial: true, brand: true, model: true } } },
      orderBy: { validade: "asc" },
    });

    const rationsExpiring = await prisma.artigoJangada.findMany({
      where: { name: { contains: "Rações" }, validade: { lte: thirtyDays, gte: now } },
      select: { id: true, name: true, quantidade: true, validade: true, jangadaId: true, Jangada: { select: { serial: true, brand: true, model: true } } },
      orderBy: { validade: "asc" },
    });

    const nowIso = now.toISOString().slice(0, 10);
    const thirtyDaysIso = thirtyDays.toISOString().slice(0, 10);

    const coletesExpiring = await prisma.colete.findMany({
      where: { dataProxInspecao: { lte: thirtyDaysIso, gte: nowIso } },
      select: { id: true, serial: true, marca: true, modelo: true, dataProxInspecao: true, shipId: true },
      orderBy: { dataProxInspecao: "asc" },
    });

    const stockExpiring = await prisma.stock.findMany({
      where: { validade: { lte: thirtyDaysIso, gte: nowIso }, estadoArtigo: "ATIVO" },
      select: { id: true, descricao: true, quantidade: true, validade: true, referencia: true },
      orderBy: { validade: "asc" },
    });

    const extintoresExpiring = await prisma.extintor.findMany({
      where: {
        OR: [
          { dataProxRecarga: { lte: thirtyDaysIso, gte: nowIso } },
          { dataProxTesteHidraulico: { lte: thirtyDaysIso, gte: nowIso } },
        ],
      },
      select: {
        id: true,
        serial: true,
        marca: true,
        modelo: true,
        tipoAgente: true,
        dataProxRecarga: true,
        dataProxTesteHidraulico: true,
        shipId: true,
      },
      orderBy: [{ dataProxRecarga: "asc" }, { dataProxTesteHidraulico: "asc" }],
    });

    const epirbsExpiring = await prisma.epirb.findMany({
      where: {
        estado: "Ativo",
        OR: [
          { dataProxInspecao: { lte: thirtyDaysIso, gte: nowIso } },
          { dataValidadeBateria: { lte: thirtyDaysIso, gte: nowIso } },
        ],
      },
      select: {
        id: true,
        serial: true,
        marca: true,
        modelo: true,
        dataProxInspecao: true,
        dataValidadeBateria: true,
        shipId: true,
      },
      orderBy: [{ dataProxInspecao: "asc" }, { dataValidadeBateria: "asc" }],
    });

    const fatosExpiring = await prisma.fatoImersao.findMany({
      where: {
        dataProxInspecao: { lte: thirtyDaysIso, gte: nowIso },
      },
      select: {
        id: true,
        serial: true,
        marca: true,
        modelo: true,
        dataProxInspecao: true,
        shipId: true,
      },
      orderBy: { dataProxInspecao: "asc" },
    });

    const shipIds = Array.from(new Set(
      [...extintoresExpiring.map((e) => e.shipId), ...epirbsExpiring.map((e) => e.shipId), ...fatosExpiring.map((f) => f.shipId)]
        .filter((id): id is number => id !== null && id !== undefined)
    ));
    const navios = shipIds.length
      ? await prisma.navio.findMany({ where: { id: { in: shipIds } }, select: { id: true, nome: true } })
      : [];
    const navioNomeById = new Map(navios.map((n) => [n.id, n.nome]));

    const extintores = extintoresExpiring.flatMap((e) => {
      const base = {
        marca: e.marca || "",
        modelo: e.modelo || "",
        serial: e.serial || `#${e.id}`,
        navio: e.shipId && navioNomeById.has(e.shipId) ? { nome: navioNomeById.get(e.shipId) as string } : undefined,
        tipoAgente: e.tipoAgente || undefined,
      };
      const rows: Array<Record<string, unknown>> = [];
      if (e.dataProxRecarga && e.dataProxRecarga >= nowIso && e.dataProxRecarga <= thirtyDaysIso) {
        rows.push({ id: `ext-r-${e.id}`, ...base, name: `${e.marca || "Extintor"} ${e.modelo || ""}`.trim(), descricao: "Recarga", validade: e.dataProxRecarga });
      }
      if (e.dataProxTesteHidraulico && e.dataProxTesteHidraulico >= nowIso && e.dataProxTesteHidraulico <= thirtyDaysIso) {
        rows.push({ id: `ext-t-${e.id}`, ...base, name: `${e.marca || "Extintor"} ${e.modelo || ""}`.trim(), descricao: "Teste hidráulico", validade: e.dataProxTesteHidraulico });
      }
      return rows;
    });

    const epirbs = epirbsExpiring.flatMap((e) => {
      const base = {
        marca: e.marca || "",
        modelo: e.modelo || "",
        serial: e.serial || `#${e.id}`,
        navio: e.shipId && navioNomeById.has(e.shipId) ? { nome: navioNomeById.get(e.shipId) as string } : undefined,
      };
      const rows: Array<Record<string, unknown>> = [];
      if (e.dataProxInspecao && e.dataProxInspecao >= nowIso && e.dataProxInspecao <= thirtyDaysIso) {
        rows.push({ id: `epirb-i-${e.id}`, ...base, name: `${e.marca || "EPIRB"} ${e.modelo || ""}`.trim(), descricao: "Inspeção", validade: e.dataProxInspecao });
      }
      if (e.dataValidadeBateria && e.dataValidadeBateria >= nowIso && e.dataValidadeBateria <= thirtyDaysIso) {
        rows.push({ id: `epirb-b-${e.id}`, ...base, name: `${e.marca || "EPIRB"} ${e.modelo || ""}`.trim(), descricao: "Bateria", validade: e.dataValidadeBateria });
      }
      return rows;
    });

    const fatos = fatosExpiring.flatMap((f) => {
      const base = {
        marca: f.marca || "",
        modelo: f.modelo || "",
        serial: f.serial || `#${f.id}`,
        navio: f.shipId && navioNomeById.has(f.shipId) ? { nome: navioNomeById.get(f.shipId) as string } : undefined,
      };
      const rows: Array<Record<string, unknown>> = [];
      if (f.dataProxInspecao && f.dataProxInspecao >= nowIso && f.dataProxInspecao <= thirtyDaysIso) {
        rows.push({ id: `fato-${f.id}`, ...base, name: `${f.marca || "Fato de imersão"} ${f.modelo || ""}`.trim(), descricao: "Inspeção", validade: f.dataProxInspecao });
      }
      return rows;
    });

    return NextResponse.json({
      geradoEm: now.toISOString(),
      agua: waterExpiring,
      racoes: rationsExpiring,
      coletes: coletesExpiring,
      stock: stockExpiring,
      extintores,
      epirbs,
      fatos,
      totais: {
        agua: waterExpiring.length,
        racoes: rationsExpiring.length,
        coletes: coletesExpiring.length,
        stock: stockExpiring.length,
        extintores: extintores.length,
        epirbs: epirbs.length,
        fatos: fatos.length,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao gerar o relatório de validades.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
