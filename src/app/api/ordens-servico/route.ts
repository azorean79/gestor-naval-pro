import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAccessContext } from "@/lib/access-control";
import { resolveActiveServiceStationId } from "@/lib/station-selection";
import { logAuditoria } from "@/lib/auditoria";
import {
  appendOrdemServicoLog,
  appendWorkflowTransition,
  generateNumeroOrdem,
  mapOrderStatusToWorkflowStatus,
  normalizeUniquePositiveInts,
  normalizeOrdemPrioridade,
  normalizeOrdemStatus,
  normalizeOrdemTipo,
  parseOrdemServicoMeta,
  replaceOrdemServicoJangadas,
  resolveClienteIdForShipId,
  resolveOrderJangadasContext,
  resolveClienteIdForJangada,
  resolveWorkflowStatus,
  toOrdemServicoMetaJson,
} from "@/lib/ordens-servico";
import { parseFlexibleDate } from "@/lib/agenda-sync";
import { buildDatabaseErrorResponse } from "@/lib/database-errors";

function normalizeListNumber(value: unknown) {
  if (!Array.isArray(value)) return [] as number[];
  return normalizeUniquePositiveInts(value);
}

function applyServiceStationScope(where: Record<string, unknown>, req: NextRequest, access: Awaited<ReturnType<typeof getAccessContext>>) {
  if (!access) return;

  const activeStationId = resolveActiveServiceStationId(req, access);
  if (activeStationId) {
    where.serviceStationId = activeStationId;
    return;
  }

  if (!access.isAdmin) {
    if (access.allowedStationIds.length > 0) {
      where.serviceStationId = { in: access.allowedStationIds };
    } else if (access.stationId) {
      where.serviceStationId = access.stationId;
    }
  }
}

async function resolveJangadaIds(body: Record<string, unknown>) {
  const explicitIds = normalizeListNumber(body.jangadaIds);
  if (explicitIds.length > 0) return explicitIds;

  const singleId = Number(body.jangadaId || body.raftId);
  if (Number.isFinite(singleId) && singleId > 0) return [singleId];

  const serial = String(body.serial || "").trim();
  if (!serial) return [];

  const raft = await prisma.jangada.findFirst({
    where: { serial: { equals: serial, mode: "insensitive" } },
    select: { id: true },
  });

  return raft?.id ? [raft.id] : [];
}

function parseOptionalDate(value: unknown) {
  const parsed = parseFlexibleDate(String(value || "").trim());
  return parsed || null;
}

function parseOptionalPositiveInt(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.floor(parsed);
}

async function resolveTecnicoPayload(tecnicoIdValue: unknown, tecnicoResponsavelValue: unknown) {
  const tecnicoId = parseOptionalPositiveInt(tecnicoIdValue);
  if (!tecnicoId) {
    return {
      tecnicoId: null as number | null,
      tecnicoResponsavel: String(tecnicoResponsavelValue || "").trim() || null,
    };
  }

  const tecnico = await prisma.tecnico.findUnique({
    where: { id: tecnicoId },
    select: { id: true, nome: true, ativo: true },
  });

  if (!tecnico || !tecnico.ativo) {
    return null;
  }

  return {
    tecnicoId: tecnico.id,
    tecnicoResponsavel: tecnico.nome,
  };
}

function buildDefaultChecklistRows(tipo: string) {
  const isInspection = String(tipo || "").toLowerCase() === "inspecao";
  return [
    { phase: "pre", label: "Confirmar dados da OT e ativo" },
    { phase: "pre", label: "Validar condições de segurança" },
    { phase: "intervencao", label: isInspection ? "Executar checklist de inspeção da jangada" : "Executar procedimento técnico principal" },
    { phase: "intervencao", label: "Registar materiais/consumos" },
    { phase: "validacao", label: "Validar resultado final" },
    { phase: "validacao", label: "Confirmar documentação e evidências" },
  ];
}

async function buildLatestInspectionSummaryForOrders(serializedOrders: any[]) {
  const allJangadas = serializedOrders.flatMap((order) => Array.isArray(order?.jangadas) ? order.jangadas : []);
  const jangadaIds = Array.from(new Set(
    allJangadas
      .map((jangada) => Number(jangada?.id))
      .filter((id) => Number.isFinite(id) && id > 0)
  ));

  if (jangadaIds.length === 0) {
    return serializedOrders;
  }

  const inspections = await prisma.inspecao.findMany({
    where: {
      jangadaId: { in: jangadaIds },
    },
    orderBy: [{ dataInspecao: "desc" }, { updatedAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      jangadaId: true,
      certificadoNumero: true,
      dataInspecao: true,
      status: true,
      artigos: {
        select: { id: true },
      },
    },
  });

  const latestInspectionByJangada = new Map<number, (typeof inspections)[number]>();
  for (const inspection of inspections) {
    const jangadaId = Number(inspection.jangadaId);
    if (!Number.isFinite(jangadaId) || jangadaId <= 0 || latestInspectionByJangada.has(jangadaId)) {
      continue;
    }
    latestInspectionByJangada.set(jangadaId, inspection);
  }

  return serializedOrders.map((order) => {
    const jangadas = Array.isArray(order?.jangadas) ? order.jangadas : [];
    const latestInspectionContext = jangadas.map((jangada: any) => {
      const inspection = latestInspectionByJangada.get(Number(jangada?.id));
      return {
        jangadaId: Number(jangada?.id),
        serial: jangada?.serial || "",
        brand: jangada?.brand || null,
        model: jangada?.model || null,
        certificadoNumero: inspection?.certificadoNumero || null,
        dataInspecao: inspection?.dataInspecao || null,
        status: inspection?.status || null,
        artigosSubstituidosCount: Array.isArray(inspection?.artigos) ? inspection.artigos.length : 0,
      };
    });

    const historyCount = latestInspectionContext.filter((item: any) => item.dataInspecao).length;
    const replacementCount = latestInspectionContext.reduce((acc: number, item: any) => acc + Number(item.artigosSubstituidosCount || 0), 0);

    return {
      ...order,
      latestInspectionContext,
      latestInspectionSummary: {
        historyCount,
        replacementCount,
        latestDate: latestInspectionContext
          .map((item: any) => String(item.dataInspecao || "").trim())
          .filter(Boolean)
          .sort((a: string, b: string) => b.localeCompare(a))[0] || null,
      },
    };
  });
}

function serializeOrder(row: any) {
  const meta = parseOrdemServicoMeta(row.metadados);
  const queue = Array.isArray(row.serviceStationQueues) ? row.serviceStationQueues[0] : null;
  const jangadas = (() => {
    const linked = Array.isArray(row.ordemJangadas)
      ? row.ordemJangadas.map((link: any) => link?.jangada).filter(Boolean)
      : [];
    const combined = [...linked, row.jangada].filter(Boolean);
    const seen = new Set<number>();
    return combined.filter((jangada: any) => {
      const id = Number(jangada?.id);
      if (!Number.isFinite(id) || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  })();
  const primaryJangada = jangadas[0] || row.jangada || null;
  const workflowStatus = resolveWorkflowStatus({ meta, orderStatus: row.status });

  return {
    id: row.id,
    numeroOrdem: row.numeroOrdem,
    grupoNumeroOrdem: meta.grupoNumeroOrdem || null,
    tipo: row.tipo,
    prioridade: row.prioridade,
    status: row.status,
    workflowStatus,
    descricao: row.descricao || "",
    tecnicoId: row.tecnicoId ?? row.tecnico?.id ?? null,
    tecnicoResponsavel: row.tecnicoResponsavel || "",
    tecnico: row.tecnico ? {
      id: row.tecnico.id,
      nome: row.tecnico.nome,
      email: row.tecnico.email,
      ativo: row.tecnico.ativo,
    } : null,
    slaHoras: row.slaHoras ?? null,
    dataPlaneadaInicio: row.dataPlaneadaInicio?.toISOString() || null,
    dataPlaneadaFim: row.dataPlaneadaFim?.toISOString() || null,
    dataAbertura: row.dataAbertura?.toISOString() || null,
    dataPrevista: row.dataPrevista?.toISOString() || null,
    dataInicio: row.dataInicio?.toISOString() || null,
    dataConclusao: row.dataConclusao?.toISOString() || null,
    durationMinutes: row.durationMinutes || 0,
    orcamentoStatus: row.orcamentoStatus || "Rascunho",
    isPesca: row.isPesca || false,
    isIsentoIva: row.isIsentoIva || false,
    valorPecas: row.valorPecas || 0,
    valorMaoObra: row.valorMaoObra || 0,
    valorDesconto: row.valorDesconto || 0,
    valorTotal: row.valorTotal || 0,
    metadados: meta,
    jangadaId: primaryJangada?.id || row.jangadaId,
    shipId: primaryJangada?.shipId ?? row.shipId ?? meta.shipId ?? null,
    clienteId: row.clienteId || null,
    inspecaoId: row.inspecaoId || null,
    jangada: primaryJangada ? {
      id: primaryJangada.id,
      serial: primaryJangada.serial,
      brand: primaryJangada.brand,
      model: primaryJangada.model,
      owner: primaryJangada.owner,
      shipId: primaryJangada.shipId,
      shipNameManual: primaryJangada.shipNameManual,
      numeroObra: primaryJangada.numeroObra,
      dataInspecao: primaryJangada.dataInspecao,
      dataProxInspecao: primaryJangada.dataProxInspecao,
    } : null,
    jangadas: jangadas.map((jangada: any) => ({
      id: jangada.id,
      serial: jangada.serial,
      brand: jangada.brand,
      model: jangada.model,
      owner: jangada.owner,
      shipId: jangada.shipId,
      shipNameManual: jangada.shipNameManual,
      numeroObra: jangada.numeroObra,
      dataInspecao: jangada.dataInspecao,
      dataProxInspecao: jangada.dataProxInspecao,
    })),
    cliente: row.cliente ? {
      id: row.cliente.id,
      nome: row.cliente.nome,
      ilha: row.cliente.ilha,
      numeroCliente: row.cliente.numeroCliente,
    } : null,
    inspecao: row.inspecao ? {
      id: row.inspecao.id,
      certificadoNumero: row.inspecao.certificadoNumero,
      dataInspecao: row.inspecao.dataInspecao,
      dataProxInspecao: row.inspecao.dataProxInspecao,
      status: row.inspecao.status,
    } : null,
    serviceStation: queue ? {
      id: row.serviceStation?.id ?? null,
      codigo: row.serviceStation?.codigo ?? null,
      nome: row.serviceStation?.nome ?? null,
      queueId: queue.id,
      status: queue.status,
      dataChegada: queue.dataChegada?.toISOString() || null,
      dataPrevistaEntrega: queue.dataPrevistaEntrega?.toISOString() || null,
    } : (row.serviceStation ? {
      id: row.serviceStation.id,
      codigo: row.serviceStation.codigo,
      nome: row.serviceStation.nome,
      queueId: null,
      status: null,
      dataChegada: null,
      dataPrevistaEntrega: null,
    } : null),
    createdAt: row.createdAt?.toISOString() || null,
    updatedAt: row.updatedAt?.toISOString() || null,
  };
}

async function fetchOrders(where?: Record<string, unknown>) {
  const rows = await prisma.ordemServico.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    include: {
      jangada: {
        select: {
          id: true,
          serial: true,
          brand: true,
          model: true,
          owner: true,
          shipId: true,
          shipNameManual: true,
          numeroObra: true,
          dataInspecao: true,
          dataProxInspecao: true,
        },
      },
      ordemJangadas: {
        orderBy: [{ addedAt: "asc" }, { id: "asc" }],
        include: {
          jangada: {
            select: {
              id: true,
              serial: true,
              brand: true,
              model: true,
              owner: true,
              shipId: true,
              shipNameManual: true,
              numeroObra: true,
              dataInspecao: true,
              dataProxInspecao: true,
            },
          },
        },
      },
      cliente: {
        select: {
          id: true,
          nome: true,
          ilha: true,
          numeroCliente: true,
        },
      },
      tecnico: {
        select: {
          id: true,
          nome: true,
          email: true,
          ativo: true,
        },
      },
      inspecao: {
        select: {
          id: true,
          certificadoNumero: true,
          dataInspecao: true,
          dataProxInspecao: true,
          status: true,
        },
      },
      serviceStationQueues: {
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        take: 1,
        select: {
          id: true,
          status: true,
          dataChegada: true,
          dataPrevistaEntrega: true,
        },
      },
      serviceStation: {
        select: {
          id: true,
          codigo: true,
          nome: true,
        },
      },
    },
  });

  const serialized = rows.map(serializeOrder);
  return buildLatestInspectionSummaryForOrders(serialized);
}

export async function GET(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) {
      return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const jangadaId = Number(searchParams.get("jangadaId"));
    const clienteId = Number(searchParams.get("clienteId"));
    const status = searchParams.get("status");
    const prioridade = searchParams.get("prioridade");
    const tecnico = String(searchParams.get("tecnicoResponsavel") || "").trim();
    const tecnicoId = parseOptionalPositiveInt(searchParams.get("tecnicoId"));
    const atraso = searchParams.get("atraso") === "1";
    const includeClosed = searchParams.get("includeClosed") === "1";
    const planeadoInicioDe = parseOptionalDate(searchParams.get("planeadoInicioDe"));
    const planeadoInicioAte = parseOptionalDate(searchParams.get("planeadoInicioAte"));
    const planeadoFimDe = parseOptionalDate(searchParams.get("planeadoFimDe"));
    const planeadoFimAte = parseOptionalDate(searchParams.get("planeadoFimAte"));

    const where: Record<string, unknown> = {};
    applyServiceStationScope(where, req, access);
    if (Number.isFinite(jangadaId) && jangadaId > 0) {
      where.OR = [
        { jangadaId },
        { ordemJangadas: { some: { jangadaId } } },
      ];
    }
    if (Number.isFinite(clienteId) && clienteId > 0) where.clienteId = clienteId;
    if (status) where.status = normalizeOrdemStatus(status);
    if (prioridade) where.prioridade = normalizeOrdemPrioridade(prioridade);
    if (tecnicoId) {
      where.tecnicoId = tecnicoId;
    }
    if (tecnico) where.tecnicoResponsavel = { contains: tecnico, mode: "insensitive" };
    if (!includeClosed && !status) where.status = { notIn: ["concluida", "cancelada"] };

    if (planeadoInicioDe || planeadoInicioAte) {
      where.dataPlaneadaInicio = {
        ...(planeadoInicioDe ? { gte: planeadoInicioDe } : {}),
        ...(planeadoInicioAte ? { lte: planeadoInicioAte } : {}),
      };
    }

    if (planeadoFimDe || planeadoFimAte) {
      where.dataPlaneadaFim = {
        ...(planeadoFimDe ? { gte: planeadoFimDe } : {}),
        ...(planeadoFimAte ? { lte: planeadoFimAte } : {}),
      };
    }

    if (atraso) {
      const andClauses = Array.isArray(where.AND) ? where.AND : [];
      andClauses.push({ dataPlaneadaFim: { lt: new Date() } });
      andClauses.push({ status: { notIn: ["concluida", "cancelada"] } });
      where.AND = andClauses;
    }

    const rows = await fetchOrders(where);
    return NextResponse.json(rows);
  } catch (error) {
    return buildDatabaseErrorResponse(error, "Erro ao listar ordens de serviço.");
  }
}

export async function POST(req: NextRequest) {
  try {
    const access = await getAccessContext();
    if (!access) {
      return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const jangadaIds = await resolveJangadaIds(body);
    if (jangadaIds.length === 0) {
      return NextResponse.json({ error: "jangadaId/jangadaIds inválidos." }, { status: 400 });
    }

    const jangadaContext = await resolveOrderJangadasContext(jangadaIds);
    const explicitShipId = Number(body.shipId);
    if (Number.isFinite(explicitShipId) && explicitShipId > 0 && jangadaContext.shipId && explicitShipId !== jangadaContext.shipId) {
      return NextResponse.json({ error: "As jangadas selecionadas não pertencem ao navio indicado." }, { status: 400 });
    }

    const dataPlaneadaInicio = parseOptionalDate(body.dataPlaneadaInicio);
    const dataPlaneadaFim = parseOptionalDate(body.dataPlaneadaFim);
    const dataPrevista = parseOptionalDate(body.dataPrevista);
    const dataInicio = parseOptionalDate(body.dataInicio);
    const dataConclusao = parseOptionalDate(body.dataConclusao);
    const explicitBaseNumber = String(body.numeroBase || "").trim();
    const numeroOrdem = await generateNumeroOrdem(
      dataPlaneadaInicio
      || dataPrevista
      || dataInicio
      || dataConclusao
      || new Date()
    );
    const groupNumber = String(body.grupoNumeroOrdem || explicitBaseNumber || numeroOrdem).trim() || numeroOrdem;
    const tipo = normalizeOrdemTipo(body.tipo);
    const prioridade = normalizeOrdemPrioridade(body.prioridade);
    const status = normalizeOrdemStatus(body.status);
    const workflowStatus = resolveWorkflowStatus({
      meta: { workflowStatus: body.workflowStatus as any },
      orderStatus: status,
    }) || mapOrderStatusToWorkflowStatus(status) || "orcamento_em_preparacao";
    const descricao = String(body.descricao || "").trim() || null;
    const tecnicoPayload = await resolveTecnicoPayload(body.tecnicoId, body.tecnicoResponsavel);
    if (body.tecnicoId && !tecnicoPayload) {
      return NextResponse.json({ error: "Técnico inválido ou inativo." }, { status: 400 });
    }
    const tecnicoResponsavel = tecnicoPayload?.tecnicoResponsavel ?? null;
    const tecnicoIdResolved = tecnicoPayload?.tecnicoId ?? null;
    const slaHoras = parseOptionalPositiveInt(body.slaHoras);
    const durationMinutes = Math.max(0, Number(body.durationMinutes || 210)) || 210;
    const providedMeta = body.metadados && typeof body.metadados === "object" ? body.metadados as Record<string, unknown> : {};

    const clienteId = Number(body.clienteId);
    const resolvedClienteId = Number.isFinite(clienteId) && clienteId > 0
      ? clienteId
      : (jangadaContext.shipId ? await resolveClienteIdForShipId(jangadaContext.shipId) : await resolveClienteIdForJangada(jangadaContext.primaryJangadaId || 0));
    const baseMeta = {
      grupoNumeroOrdem: groupNumber,
      origem: String(body.origem || "manual").trim() || "manual",
      shipId: jangadaContext.shipId ?? (Number.isFinite(explicitShipId) ? explicitShipId : undefined),
      shipName: String(body.shipName || "").trim() || jangadaContext.shipName || undefined,
      linhas: Array.isArray(providedMeta.linhas) ? providedMeta.linhas as any[] : undefined,
      totais: providedMeta.totais && typeof providedMeta.totais === "object" ? providedMeta.totais as Record<string, number> : undefined,
      observacao: String(providedMeta.observacao || "").trim() || undefined,
    };

    const metaWithLog = appendOrdemServicoLog(appendWorkflowTransition(baseMeta, workflowStatus, {
      origin: "order",
      message: `Workflow inicial definido para ${workflowStatus}.`,
      user: tecnicoResponsavel || "sistema",
    }), {
      type: "CREATE",
      message: `OT criada (${numeroOrdem}) com ${jangadaIds.length} jangada(s).`,
      user: "sistema",
    });

    const created = await prisma.$transaction(async (tx) => {
      const order = await tx.ordemServico.create({
        data: {
          numeroOrdem,
          serviceStationId: jangadaContext.serviceStationId,
          jangadaId: jangadaContext.primaryJangadaId!,
          shipId: jangadaContext.shipId,
          clienteId: resolvedClienteId,
          tecnicoId: tecnicoIdResolved,
          inspecaoId: Number.isFinite(Number(body.inspecaoId)) ? Number(body.inspecaoId) : null,
          tipo,
          prioridade,
          status,
          descricao,
          tecnicoResponsavel,
          slaHoras,
          dataPlaneadaInicio,
          dataPlaneadaFim,
          dataPrevista,
          dataInicio,
          dataConclusao,
          durationMinutes,
          metadados: toOrdemServicoMetaJson(metaWithLog),
        },
      });

      await replaceOrdemServicoJangadas(tx as typeof prisma, order.id, jangadaIds);

      await (tx as any).ordemServicoChecklistItem.createMany({
        data: buildDefaultChecklistRows(tipo).map((item) => ({
          ordemServicoId: order.id,
          phase: item.phase,
          label: item.label,
          done: false,
        })),
      });

      await (tx as any).ordemServicoLog.create({
        data: {
          ordemServicoId: order.id,
          type: "CREATE",
          message: `OT criada (${numeroOrdem}) com ${jangadaIds.length} jangada(s).`,
          user: "sistema",
        },
      });

      await tx.jangada.updateMany({
        where: { id: { in: jangadaIds } },
        data: { numeroObra: groupNumber },
      });

      return order;
    });

    await logAuditoria({
      tabela: "OrdemServico",
      tipoOperacao: "CREATE",
      idRegisto: created.id,
      descricao: `Criação de OT ${numeroOrdem} com ${jangadaIds.length} jangada(s)` ,
      dadosDepois: created,
    });

    const rows = await fetchOrders({ id: created.id });
    return NextResponse.json(rows, { status: 201 });
  } catch (error) {
    return buildDatabaseErrorResponse(error, "Erro ao criar ordem de serviço.");
  }
}
