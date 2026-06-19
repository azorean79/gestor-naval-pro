import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { listAuditoriaFiles } from "@/lib/auditorias-storage";
import { resolveLifejacketManuals } from "@/modules/lifejackets/manualResolver";

const COLETE_EVIDENCIAS_DIR_PREFIX = "coletes-evidencias";

function buildEvidenceRelativeDir(id: number) {
  return `${COLETE_EVIDENCIAS_DIR_PREFIX}/${id}`;
}

function inferEvidenceDocumentType(filename: string) {
  return /\.pdf$/i.test(filename) ? "Anexo PDF" : "Foto de inspeção";
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

function normalizeText(value: unknown) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || null;
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

function countChecklistFlags(values: Array<string | null | undefined>, target: string) {
  return values.filter((value) => String(value || "").trim().toUpperCase() === target).length;
}

function sanitizeColeteUpdatePayload(data: any) {
  return {
    shipId: Object.prototype.hasOwnProperty.call(data || {}, "shipId")
      ? (data?.shipId === null || data?.shipId === "" ? null : Number(data.shipId) || null)
      : undefined,
    serial: Object.prototype.hasOwnProperty.call(data || {}, "serial") ? (data?.serial ? String(data.serial).trim() : null) : undefined,
    marca: Object.prototype.hasOwnProperty.call(data || {}, "marca") ? (data?.marca ? String(data.marca).trim() : null) : undefined,
    modelo: Object.prototype.hasOwnProperty.call(data || {}, "modelo") ? (data?.modelo ? String(data.modelo).trim() : null) : undefined,
    tamanho: Object.prototype.hasOwnProperty.call(data || {}, "tamanho") ? (data?.tamanho ? String(data.tamanho).trim() : null) : undefined,
    estado: Object.prototype.hasOwnProperty.call(data || {}, "estado") ? (data?.estado ? String(data.estado).trim() : "Ativo") : undefined,
    dataFabrico: Object.prototype.hasOwnProperty.call(data || {}, "dataFabrico") ? (data?.dataFabrico || null) : undefined,
    dataInspecao: Object.prototype.hasOwnProperty.call(data || {}, "dataInspecao") ? (data?.dataInspecao || null) : undefined,
    dataProxInspecao: Object.prototype.hasOwnProperty.call(data || {}, "dataProxInspecao") ? (data?.dataProxInspecao || null) : undefined,
    observacoes: Object.prototype.hasOwnProperty.call(data || {}, "observacoes") ? (data?.observacoes ? String(data.observacoes).trim() : null) : undefined,
  };
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    
    const url = new URL(req.url);
    const includeStock = url.searchParams.get("includeStock") === "true";

    const colete = await prisma.colete.findUnique({
      where: { id },
      select: {
        id: true,
        shipId: true,
        serial: true,
        marca: true,
        modelo: true,
        tamanho: true,
        estado: true,
        dataFabrico: true,
        dataInspecao: true,
        dataProxInspecao: true,
        observacoes: true,
        createdAt: true,
        updatedAt: true,
        verificacoes: {
          orderBy: { dataVerificacao: "desc" },
        },
        certificado: true,
      },
    });
    if (!colete) return NextResponse.json({ error: "Colete não encontrado" }, { status: 404 });

    const [navio, shipInspecoes, evidenceFiles, globalStock] = await Promise.all([
      colete.shipId
        ? prisma.navio.findUnique({
            where: { id: colete.shipId },
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
      prisma.inspecao.findMany({
        where: {
          OR: [
            { coleteId: colete.id },
            ...(normalizeText(colete.serial) ? [{ coleteSerial: colete.serial! }] : []),
            ...(colete.shipId ? [{ navioId: colete.shipId }] : []),
          ],
        },
        include: {
          artigos: true,
        },
        orderBy: { dataInspecao: "desc" },
        take: 12,
      }),
      listAuditoriaFiles(buildEvidenceRelativeDir(colete.id)),
      includeStock
        ? prisma.stock.findMany({
            where: { estado: "Ativo" },
            select: {
              id: true,
              referencia: true,
              descricao: true,
              quantidade: true,
              categoria: true,
              validade: true,
              lote: true,
            },
          })
        : Promise.resolve([]),
    ]);

      const resolvedManuals = resolveLifejacketManuals(colete.marca, colete.modelo);

    const checklistSnapshots = colete.verificacoes.map((verification) => [
      verification.tecidoExterior,
      verification.colagens,
      verification.zataosVelcro,
      verification.fitasReflectoras,
      verification.sistemaInflacao,
      verification.mecanismoInflacao,
      verification.camaras,
      verification.garrafaCO2,
      verification.tuboInflador,
    ]);

    const totalFalhas = checklistSnapshots.reduce((sum, values) => sum + countChecklistFlags(values, "F"), 0);
    const totalSubstituicoes = checklistSnapshots.reduce((sum, values) => sum + countChecklistFlags(values, "S"), 0);
    const totalReparacoes = checklistSnapshots.reduce((sum, values) => sum + countChecklistFlags(values, "R"), 0);

    const deadlineCandidates = [] as Array<{
      id: string;
      title: string;
      entityType: "colete" | "navio";
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
      entityType: "colete" | "navio";
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
      id: `colete-next-${colete.id}`,
      title: "Próxima inspeção do colete",
      entityType: "colete",
      entityLabel: colete.serial,
      date: colete.dataProxInspecao,
      href: `/equipamentos/${colete.id}`,
      source: "Ficha do colete",
    });

    if (colete.certificado) {
      addDeadline({
        id: `colete-cert-${colete.id}`,
        title: "Validade do certificado",
        entityType: "colete",
        entityLabel: colete.serial,
        date: colete.certificado.dataValidade,
        href: `/equipamentos/${colete.id}`,
        source: "Certificado do colete",
      });
    }

    const timeline = [] as Array<{
      id: string;
      kind: string;
      title: string;
      description: string;
      entityType: "colete" | "navio";
      entityLabel: string;
      date: string | null;
      status: string;
      severity: "critical" | "warning" | "ok" | "info";
      href?: string;
      source: string;
    }>;

    timeline.push({
      id: `colete-created-${colete.id}`,
      kind: "record",
      title: `Registo do colete ${colete.serial || `#${colete.id}`}`,
      description: "Criação inicial da ficha do equipamento.",
      entityType: "colete",
      entityLabel: colete.serial || `#${colete.id}`,
      date: toIso(colete.createdAt),
      status: "criado",
      severity: "info",
      href: `/equipamentos/${colete.id}`,
      source: "Ficha do colete",
    });

    timeline.push({
      id: `colete-updated-${colete.id}`,
      kind: "record",
      title: `Atualização da ficha do colete ${colete.serial || `#${colete.id}`}`,
      description: "Última atualização administrativa ou técnica do registo.",
      entityType: "colete",
      entityLabel: colete.serial || `#${colete.id}`,
      date: toIso(colete.updatedAt),
      status: "atualizado",
      severity: "info",
      href: `/equipamentos/${colete.id}`,
      source: "Ficha do colete",
    });

    colete.verificacoes.forEach((verification) => {
      const values = [
        verification.tecidoExterior,
        verification.colagens,
        verification.zataosVelcro,
        verification.fitasReflectoras,
        verification.sistemaInflacao,
        verification.mecanismoInflacao,
        verification.camaras,
        verification.garrafaCO2,
        verification.tuboInflador,
      ];
      const hasFailure = countChecklistFlags(values, "F") > 0;
      timeline.push({
        id: `colete-verificacao-${verification.id}`,
        kind: "verification",
        title: `Verificação do colete ${colete.serial || `#${colete.id}`}`,
        description: [
          normalizeText(verification.inspectorNome) ? `Inspetor: ${verification.inspectorNome}` : null,
          hasFailure ? "Com falhas registadas" : "Sem falhas críticas registadas",
        ].filter(Boolean).join(" · "),
        entityType: "colete",
        entityLabel: colete.serial || `#${colete.id}`,
        date: toIso(verification.dataVerificacao),
        status: hasFailure ? "revisão" : "verificado",
        severity: hasFailure ? "warning" : "ok",
        href: `/equipamentos/${colete.id}`,
        source: "Verificações do colete",
      });
    });

    if (colete.certificado) {
      timeline.push({
        id: `colete-certificado-${colete.certificado.id}`,
        kind: "certificate",
        title: `Certificado do colete ${colete.serial || `#${colete.id}`}`,
        description: colete.certificado.numeroCertificado,
        entityType: "colete",
        entityLabel: colete.serial || `#${colete.id}`,
        date: toIso(colete.certificado.dataCertificado),
        status: colete.certificado.resultado || "emitido",
        severity: String(colete.certificado.resultado || "").toLowerCase() === "reprovado" ? "critical" : "ok",
        href: `/equipamentos/${colete.id}`,
        source: "Certificado do colete",
      });
    }

    shipInspecoes.forEach((inspection) => {
      timeline.push({
        id: `navio-inspecao-${inspection.id}`,
        kind: "inspection",
        title: `Inspeção associada ao navio ${navio?.nome || ""}`.trim(),
        description: [inspection.certificadoNumero, inspection.status].filter(Boolean).join(" · "),
        entityType: "navio",
        entityLabel: navio?.nome || `Navio #${colete.shipId}`,
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

    const documents = [] as Array<{
      id: string;
      title: string;
      documentType: string;
      entityType: "colete";
      entityLabel: string;
      reference?: string | null;
      issueDate?: string | null;
      expiryDate?: string | null;
      status: string;
      severity: "critical" | "warning" | "ok" | "info";
      href: string;
      source: string;
    }>;

    if (colete.certificado) {
      const certificateDays = getDaysRemaining(colete.certificado.dataValidade);
      documents.push({
        id: `document-cert-${colete.certificado.id}`,
        title: `Certificado do colete ${colete.serial || `#${colete.id}`}`,
        documentType: "Certificado de colete",
        entityType: "colete",
        entityLabel: colete.serial || `#${colete.id}`,
        reference: colete.certificado.numeroCertificado,
        issueDate: toIso(colete.certificado.dataCertificado),
        expiryDate: toIso(colete.certificado.dataValidade),
        status: colete.certificado.resultado || "emitido",
        severity: getSeverity(certificateDays),
        href: `/equipamentos/${colete.id}`,
        source: "Certificado do colete",
      });
    }

    resolvedManuals.manuals.forEach((manual, index) => {
      documents.push({
        id: `document-manual-${colete.id}-${index}`,
        title: manual.fileName,
        documentType: "Manual técnico",
        entityType: "colete",
        entityLabel: colete.serial || `#${colete.id}`,
        reference: manual.label,
        issueDate: null,
        expiryDate: null,
        status: "biblioteca",
        severity: "info",
        href: manual.href,
        source: "Biblioteca técnica do modelo",
      });
    });

    evidenceFiles
      .slice()
      .sort((a, b) => String(b.uploadedAt || b.modified).localeCompare(String(a.uploadedAt || a.modified)))
      .forEach((file, index) => {
        const href = `/api/coletes/${colete.id}/evidencias?name=${encodeURIComponent(file.name)}`;
        documents.push({
          id: `document-evidence-${colete.id}-${index}`,
          title: file.originalName || file.name,
          documentType: inferEvidenceDocumentType(file.name),
          entityType: "colete",
          entityLabel: colete.serial || `#${colete.id}`,
          reference: file.name,
          issueDate: String(file.uploadedAt || file.modified),
          expiryDate: null,
          status: "anexado",
          severity: "info",
          href,
          source: "Evidências operacionais do colete",
        });

        timeline.push({
          id: `colete-evidence-${colete.id}-${index}`,
          kind: "evidence",
          title: `Evidência anexada ao colete ${colete.serial || `#${colete.id}`}`,
          description: file.originalName || file.name,
          entityType: "colete",
          entityLabel: colete.serial || `#${colete.id}`,
          date: toIso(file.uploadedAt || file.modified),
          status: "anexado",
          severity: "info",
          href,
          source: "Evidências operacionais do colete",
        });
      });

    const sortedDeadlines = deadlineCandidates.slice().sort((a, b) => rankDeadline(a.daysRemaining) - rankDeadline(b.daysRemaining));
    const nextDeadline = sortedDeadlines[0] || null;
    const criticalCount = deadlineCandidates.filter((item) => item.severity === "critical").length;
    const warningCount = deadlineCandidates.filter((item) => item.severity === "warning").length;
    const latestVerification = colete.verificacoes[0] || null;
    const lastInspectionAt = latestVerification?.dataVerificacao || colete.dataInspecao || null;
    const sortedTimeline = sortTimeline(dedupeById(timeline)).slice(0, 30);
    const statusHealth = criticalCount > 0
      ? "critical"
      : warningCount > 0 || totalFalhas > 0
        ? "warning"
        : "ok";

    const dossier = {
      summary: {
        verificationCount: colete.verificacoes.length,
        totalFalhas,
        totalSubstituicoes,
        totalReparacoes,
        hasCertificate: Boolean(colete.certificado),
        criticalCount,
        warningCount,
        statusHealth,
        statusLabel: statusHealth === "critical" ? "Ação imediata necessária" : statusHealth === "warning" ? "Requer seguimento" : "Operacional",
        nextDeadline: nextDeadline ? {
          id: nextDeadline.id,
          title: nextDeadline.title,
          entityLabel: nextDeadline.entityLabel,
          date: nextDeadline.date,
          daysRemaining: nextDeadline.daysRemaining,
          severity: nextDeadline.severity,
          status: nextDeadline.status,
          href: nextDeadline.href,
          source: nextDeadline.source,
        } : null,
        lastInspectionAt: toIso(lastInspectionAt),
        lastActivityAt: sortedTimeline[0]?.date || null,
      },
      timeline: sortedTimeline,
      documents,
      deadlines: sortedDeadlines,
    };

    return NextResponse.json({
      ...colete,
      navio,
      dossier,
      globalStock: includeStock ? globalStock : undefined,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao obter colete" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    await prisma.colete.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao eliminar colete" }, { status: 400 });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    const data = await req.json();
    const payload = sanitizeColeteUpdatePayload(data);
    const updateData = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));

    if (Object.prototype.hasOwnProperty.call(updateData, "serial") && !updateData.serial) {
      return NextResponse.json({ error: "Nº de série do colete é obrigatório." }, { status: 400 });
    }

    const updated = await prisma.colete.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        shipId: true,
        serial: true,
        marca: true,
        modelo: true,
        tamanho: true,
        estado: true,
        dataFabrico: true,
        dataInspecao: true,
        dataProxInspecao: true,
        observacoes: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro ao atualizar colete" }, { status: 400 });
  }
}
