import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveEpirbManuals } from "@/modules/epirbs/manualResolver";

function getEpirbDelegate() {
  const delegate = (prisma as any).epirb;
  if (!delegate) {
    throw new Error("Prisma client ainda não está sincronizado com o modelo EPIRB.");
  }
  return delegate;
}

function parseFlexibleDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const raw = String(value).trim();
  if (!raw) return null;

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct;

  const match = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]) - 1;
    const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
    const candidate = new Date(year, month, day);
    return Number.isNaN(candidate.getTime()) ? null : candidate;
  }

  return null;
}

function toIso(value: unknown) {
  const date = parseFlexibleDate(value);
  return date ? date.toISOString() : null;
}

function getStartOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getDaysRemaining(value: unknown) {
  const date = parseFlexibleDate(value);
  if (!date) return null;
  return Math.ceil((date.getTime() - getStartOfToday().getTime()) / (1000 * 60 * 60 * 24));
}

function getSeverity(daysRemaining: number | null): "critical" | "warning" | "ok" | "info" {
  if (daysRemaining === null) return "info";
  if (daysRemaining < 0) return "critical";
  if (daysRemaining <= 30) return "critical";
  if (daysRemaining <= 90) return "warning";
  return "ok";
}

function getDeadlineStatus(daysRemaining: number | null) {
  if (daysRemaining === null) return "sem-data";
  if (daysRemaining < 0) return "expirado";
  if (daysRemaining === 0) return "vence-hoje";
  if (daysRemaining <= 30) return "a-expirar";
  if (daysRemaining <= 90) return "planear";
  return "ok";
}

function rankDeadline(daysRemaining: number | null) {
  if (daysRemaining === null) return 99999;
  if (daysRemaining < 0) return Math.abs(daysRemaining);
  return daysRemaining + 10000;
}

function dedupeById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function sortTimeline<T extends { date: string | null }>(items: T[]) {
  return items.sort((a, b) => {
    const aTime = parseFlexibleDate(a.date)?.getTime() ?? 0;
    const bTime = parseFlexibleDate(b.date)?.getTime() ?? 0;
    return bTime - aTime;
  });
}

function sanitizeEpirbUpdatePayload(data: any) {
  return {
    shipId: Object.prototype.hasOwnProperty.call(data || {}, "shipId")
      ? (data?.shipId === null || data?.shipId === "" ? null : Number(data.shipId) || null)
      : undefined,
    serial: Object.prototype.hasOwnProperty.call(data || {}, "serial") ? (data?.serial ? String(data.serial).trim() : null) : undefined,
    marca: Object.prototype.hasOwnProperty.call(data || {}, "marca") ? (data?.marca ? String(data.marca).trim() : null) : undefined,
    modelo: Object.prototype.hasOwnProperty.call(data || {}, "modelo") ? (data?.modelo ? String(data.modelo).trim() : null) : undefined,
    tipo: Object.prototype.hasOwnProperty.call(data || {}, "tipo") ? (data?.tipo ? String(data.tipo).trim() : null) : undefined,
    hexId: Object.prototype.hasOwnProperty.call(data || {}, "hexId") ? (data?.hexId ? String(data.hexId).trim() : null) : undefined,
    estado: Object.prototype.hasOwnProperty.call(data || {}, "estado") ? (data?.estado ? String(data.estado).trim() : "Ativo") : undefined,
    dataInspecao: Object.prototype.hasOwnProperty.call(data || {}, "dataInspecao") ? (data?.dataInspecao || null) : undefined,
    dataProxInspecao: Object.prototype.hasOwnProperty.call(data || {}, "dataProxInspecao") ? (data?.dataProxInspecao || null) : undefined,
    dataValidadeBateria: Object.prototype.hasOwnProperty.call(data || {}, "dataValidadeBateria") ? (data?.dataValidadeBateria || null) : undefined,
    ownerName: Object.prototype.hasOwnProperty.call(data || {}, "ownerName") ? (data?.ownerName ? String(data.ownerName).trim() : null) : undefined,
    ownerAddress: Object.prototype.hasOwnProperty.call(data || {}, "ownerAddress") ? (data?.ownerAddress ? String(data.ownerAddress).trim() : null) : undefined,
    ownerPhone: Object.prototype.hasOwnProperty.call(data || {}, "ownerPhone") ? (data?.ownerPhone ? String(data.ownerPhone).trim() : null) : undefined,
    emergencyContact1Name: Object.prototype.hasOwnProperty.call(data || {}, "emergencyContact1Name") ? (data?.emergencyContact1Name ? String(data.emergencyContact1Name).trim() : null) : undefined,
    emergencyContact1Phone: Object.prototype.hasOwnProperty.call(data || {}, "emergencyContact1Phone") ? (data?.emergencyContact1Phone ? String(data.emergencyContact1Phone).trim() : null) : undefined,
    emergencyContact2Name: Object.prototype.hasOwnProperty.call(data || {}, "emergencyContact2Name") ? (data?.emergencyContact2Name ? String(data.emergencyContact2Name).trim() : null) : undefined,
    emergencyContact2Phone: Object.prototype.hasOwnProperty.call(data || {}, "emergencyContact2Phone") ? (data?.emergencyContact2Phone ? String(data.emergencyContact2Phone).trim() : null) : undefined,
    observacoes: Object.prototype.hasOwnProperty.call(data || {}, "observacoes") ? (data?.observacoes ? String(data.observacoes).trim() : null) : undefined,
  };
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const epirb = await getEpirbDelegate().findUnique({ where: { id } });
    if (!epirb) return NextResponse.json({ error: "EPIRB não encontrado" }, { status: 404 });

    const [navio, shipInspecoes] = await Promise.all([
      epirb.shipId
        ? prisma.navio.findUnique({
            where: { id: epirb.shipId },
            select: {
              id: true,
              nome: true,
              matricula: true,
              mmsi: true,
              callSignal: true,
              proprietario: true,
              cliente: {
                select: {
                  id: true,
                  nome: true,
                  telefone: true,
                  telmovel: true,
                  morada: true,
                  moradaNumero: true,
                  codigoPostal: true,
                  localidade: true,
                  ilha: true,
                },
              },
            },
          })
        : Promise.resolve(null),
      epirb.shipId
        ? prisma.inspecao.findMany({
            where: { navioId: epirb.shipId },
            orderBy: { dataInspecao: "desc" },
            take: 8,
          })
        : Promise.resolve([]),
    ]);

    const manuals = resolveEpirbManuals(epirb.marca, epirb.modelo);

    const deadlineCandidates = [] as Array<{
      id: string;
      title: string;
      entityType: "epirb" | "navio";
      entityLabel: string;
      date: string;
      daysRemaining: number | null;
      severity: "critical" | "warning" | "ok" | "info";
      status: string;
      href: string;
      source: string;
    }>;

    const addDeadline = (entry: {
      id: string;
      title: string;
      entityType: "epirb" | "navio";
      entityLabel: string;
      date: unknown;
      href: string;
      source: string;
    }) => {
      const iso = toIso(entry.date);
      if (!iso) return;
      const daysRemaining = getDaysRemaining(entry.date);
      deadlineCandidates.push({
        ...entry,
        date: iso,
        daysRemaining,
        severity: getSeverity(daysRemaining),
        status: getDeadlineStatus(daysRemaining),
      });
    };

    addDeadline({
      id: `epirb-next-${epirb.id}`,
      title: "Próxima inspeção do EPIRB",
      entityType: "epirb",
      entityLabel: epirb.serial,
      date: epirb.dataProxInspecao,
      href: `/epirbs/${epirb.id}`,
      source: "Ficha do EPIRB",
    });

    addDeadline({
      id: `epirb-battery-${epirb.id}`,
      title: "Validade da bateria",
      entityType: "epirb",
      entityLabel: epirb.serial,
      date: epirb.dataValidadeBateria,
      href: `/epirbs/${epirb.id}`,
      source: "Ficha do EPIRB",
    });

    const timeline = [] as Array<{
      id: string;
      kind: string;
      title: string;
      description: string;
      entityType: "epirb" | "navio";
      entityLabel: string;
      date: string | null;
      status: string;
      severity: "critical" | "warning" | "ok" | "info";
      href?: string;
      source: string;
    }>;

    timeline.push({
      id: `epirb-created-${epirb.id}`,
      kind: "record",
      title: `Registo do EPIRB ${epirb.serial || `#${epirb.id}`}`,
      description: "Criação inicial da ficha do beacon.",
      entityType: "epirb",
      entityLabel: epirb.serial || `#${epirb.id}`,
      date: toIso(epirb.createdAt),
      status: "criado",
      severity: "info",
      href: `/epirbs/${epirb.id}`,
      source: "Ficha do EPIRB",
    });

    timeline.push({
      id: `epirb-updated-${epirb.id}`,
      kind: "record",
      title: `Atualização da ficha do EPIRB ${epirb.serial || `#${epirb.id}`}`,
      description: "Última atualização administrativa ou técnica do registo.",
      entityType: "epirb",
      entityLabel: epirb.serial || `#${epirb.id}`,
      date: toIso(epirb.updatedAt),
      status: "atualizado",
      severity: "info",
      href: `/epirbs/${epirb.id}`,
      source: "Ficha do EPIRB",
    });

    if (epirb.dataInspecao) {
      timeline.push({
        id: `epirb-inspection-${epirb.id}`,
        kind: "inspection",
        title: `Inspeção registada do EPIRB ${epirb.serial || `#${epirb.id}`}`,
        description: epirb.estado || "Inspeção registada na ficha do equipamento",
        entityType: "epirb",
        entityLabel: epirb.serial || `#${epirb.id}`,
        date: toIso(epirb.dataInspecao),
        status: epirb.estado || "verificado",
        severity: "ok",
        href: `/epirbs/${epirb.id}`,
        source: "Ficha do EPIRB",
      });
    }

    if (epirb.shipId && navio) {
      timeline.push({
        id: `epirb-ship-${epirb.id}`,
        kind: "association",
        title: `EPIRB associado ao navio ${navio.nome}`,
        description: [navio.matricula, navio.callSignal].filter(Boolean).join(" · ") || "Associação ativa ao navio",
        entityType: "navio",
        entityLabel: navio.nome,
        date: toIso(epirb.updatedAt),
        status: "associado",
        severity: "info",
        href: `/navios/${navio.id}`,
        source: "Ligação navio / EPIRB",
      });
    }

    shipInspecoes.forEach((inspection) => {
      timeline.push({
        id: `navio-inspecao-${inspection.id}`,
        kind: "inspection",
        title: `Inspeção associada ao navio ${navio?.nome || ""}`.trim(),
        description: [inspection.certificadoNumero, inspection.status].filter(Boolean).join(" · "),
        entityType: "navio",
        entityLabel: navio?.nome || `Navio #${epirb.shipId}`,
        date: toIso(inspection.dataInspecao || inspection.createdAt),
        status: inspection.status || "Concluída",
        severity: "info",
        href: navio ? `/navios/${navio.id}` : undefined,
        source: "Histórico do navio associado",
      });
    });

    deadlineCandidates.forEach((deadline) => {
      timeline.push({
        id: `deadline-${deadline.id}`,
        kind: "deadline",
        title: deadline.title,
        description: `${deadline.entityLabel} · ${deadline.source}`,
        entityType: deadline.entityType,
        entityLabel: deadline.entityLabel,
        date: deadline.date,
        status: deadline.status,
        severity: deadline.severity,
        href: deadline.href,
        source: deadline.source,
      });
    });

    const documents = manuals.manuals.map((manual, index) => ({
      id: `document-manual-${epirb.id}-${index}`,
      title: manual.fileName,
      documentType: "Manual técnico",
      entityType: "epirb" as const,
      entityLabel: epirb.serial || `#${epirb.id}`,
      reference: manual.label,
      issueDate: null,
      expiryDate: null,
      status: "biblioteca",
      severity: "info" as const,
      href: manual.href,
      source: "Biblioteca técnica do modelo",
    }));

    const sortedDeadlines = deadlineCandidates.slice().sort((a, b) => rankDeadline(a.daysRemaining) - rankDeadline(b.daysRemaining));
    const sortedTimeline = sortTimeline(dedupeById(timeline)).slice(0, 30);
    const criticalCount = deadlineCandidates.filter((item) => item.severity === "critical").length;
    const warningCount = deadlineCandidates.filter((item) => item.severity === "warning").length;
    const statusHealth = criticalCount > 0
      ? "critical"
      : warningCount > 0 || !epirb.hexId || !epirb.shipId
        ? "warning"
        : "ok";

    const dossier = {
      summary: {
        hasShipAssociation: Boolean(epirb.shipId),
        hasHexId: Boolean(String(epirb.hexId || "").trim()),
        criticalCount,
        warningCount,
        manualCount: documents.length,
        statusHealth,
        statusLabel: statusHealth === "critical" ? "Ação imediata necessária" : statusHealth === "warning" ? "Requer seguimento" : "Operacional",
        nextDeadline: sortedDeadlines[0]
          ? {
              id: sortedDeadlines[0].id,
              title: sortedDeadlines[0].title,
              entityLabel: sortedDeadlines[0].entityLabel,
              date: sortedDeadlines[0].date,
              daysRemaining: sortedDeadlines[0].daysRemaining,
              severity: sortedDeadlines[0].severity,
              status: sortedDeadlines[0].status,
              href: sortedDeadlines[0].href,
              source: sortedDeadlines[0].source,
            }
          : null,
        lastInspectionAt: toIso(epirb.dataInspecao),
        lastActivityAt: sortedTimeline[0]?.date || null,
      },
      timeline: sortedTimeline,
      documents,
      deadlines: sortedDeadlines,
    };

    return NextResponse.json({
      ...epirb,
      navio,
      dossier,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao obter EPIRB" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    await getEpirbDelegate().delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao eliminar EPIRB" }, { status: 400 });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const data = await req.json();
    const payload = sanitizeEpirbUpdatePayload(data);
    const updateData = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));

    if (Object.prototype.hasOwnProperty.call(updateData, "serial") && !updateData.serial) {
      return NextResponse.json({ error: "Nº de série do EPIRB é obrigatório." }, { status: 400 });
    }

    const updated = await getEpirbDelegate().update({ where: { id }, data: updateData });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao atualizar EPIRB" }, { status: 400 });
  }
}
